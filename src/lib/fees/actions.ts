'use server'

import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import {
  createFeeHeadSchema,
  createFeeStructureSchema,
  generateInvoiceSchema,
  recordManualPaymentSchema,
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
  requestRefundSchema,
  createAdjustmentSchema,
  type CreateFeeHeadInput,
  type CreateFeeStructureInput,
  type GenerateInvoiceInput,
  type RecordManualPaymentInput,
  type CreateRazorpayOrderInput,
  type VerifyRazorpayPaymentInput,
  type RequestRefundInput,
  type CreateAdjustmentInput,
} from './schemas'
import { calculateInvoiceTotals } from './calculations'
import { getFinancialClearance } from './clearance-service'

// ============================================================
// Fix #7: Audit Log Helper
// ============================================================
async function writeAuditLog(
  supabase: any,
  schoolId: string,
  actorProfileId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  oldData: Record<string, unknown> | null = null,
  newData: Record<string, unknown> | null = null,
) {
  await supabase.from('audit_logs').insert({
    school_id: schoolId,
    actor_profile_id: actorProfileId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
  })
}

// ============================================================
// Fix #8: Double-Entry Ledger Helper
// ============================================================
async function writeBalancedLedgerEntry(
  supabase: any,
  params: {
    schoolId: string
    academicSessionId: string
    studentId: string
    invoiceId?: string | null
    paymentId?: string | null
    transactionType: string
    debitAccount: string
    creditAccount: string
    amount: number
    description: string
    actorProfileId: string
  }
) {
  const journalId = crypto.randomUUID()

  // Fix #9: Compute running balance from existing ledger
  const { data: lastEntry } = await supabase
    .from('financial_ledger')
    .select('running_balance')
    .eq('student_id', params.studentId)
    .eq('academic_session_id', params.academicSessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const previousBalance = lastEntry ? Number(lastEntry.running_balance) : 0

  // Determine balance impact: CHARGE/DEBIT increases outstanding, PAYMENT/CREDIT decreases
  let balanceChange = 0
  if (['CHARGE', 'LATE_FEE', 'ADJUSTMENT'].includes(params.transactionType)) {
    balanceChange = params.amount // increases what student owes
  } else if (['PAYMENT', 'REFUND', 'OVERPAYMENT_CREDIT'].includes(params.transactionType)) {
    balanceChange = -params.amount // decreases what student owes
  }

  const newRunningBalance = previousBalance + balanceChange

  // DEBIT entry
  await supabase.from('financial_ledger').insert({
    school_id: params.schoolId,
    academic_session_id: params.academicSessionId,
    student_id: params.studentId,
    invoice_id: params.invoiceId || null,
    payment_id: params.paymentId || null,
    transaction_type: params.transactionType,
    amount: params.amount,
    running_balance: newRunningBalance,
    description: params.description,
    actor_profile_id: params.actorProfileId,
    journal_id: journalId,
    entry_type: 'DEBIT',
    account_name: params.debitAccount,
  })

  // CREDIT entry (balancing)
  await supabase.from('financial_ledger').insert({
    school_id: params.schoolId,
    academic_session_id: params.academicSessionId,
    student_id: params.studentId,
    invoice_id: params.invoiceId || null,
    payment_id: params.paymentId || null,
    transaction_type: params.transactionType,
    amount: params.amount,
    running_balance: newRunningBalance,
    description: params.description,
    actor_profile_id: params.actorProfileId,
    journal_id: journalId,
    entry_type: 'CREDIT',
    account_name: params.creditAccount,
  })

  return { journalId, runningBalance: newRunningBalance }
}

// ============================================================
// Fee Head Actions
// ============================================================
export async function createFeeHeadAction(input: CreateFeeHeadInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) {
      return { success: false, error: 'Forbidden' }
    }

    const validated = createFeeHeadSchema.parse(input)
    const supabase = (await createClient()) as any

    const { data, error } = await supabase
      .from('fee_heads')
      .insert({
        school_id: authState.user.schoolId,
        code: validated.code,
        name: validated.name,
        description: validated.description || null,
        active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Fee head code already exists in this school' }
      }
      return { success: false, error: error.message }
    }

    // Fix #7: Audit log
    await writeAuditLog(supabase, authState.user.schoolId, authState.user.profileId,
      'FEE_HEAD_CREATED', 'fee_head', data.id, null,
      { code: validated.code, name: validated.name })

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create fee head' }
  }
}

export async function createFeeStructureAction(input: CreateFeeStructureInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) {
      return { success: false, error: 'Forbidden' }
    }

    const validated = createFeeStructureSchema.parse(input)
    const supabase = (await createClient()) as any

    const { data: structure, error: structErr } = await supabase
      .from('fee_structures')
      .insert({
        school_id: authState.user.schoolId,
        academic_session_id: validated.academicSessionId,
        class_id: validated.classId,
        section_id: validated.sectionId || null,
        name: validated.name,
        description: validated.description || null,
        version: 1,
        is_active: true,
        effective_from: validated.effectiveFrom,
      })
      .select()
      .single()

    if (structErr || !structure) {
      return { success: false, error: structErr?.message || 'Failed to create fee structure' }
    }

    const itemsToInsert = validated.items.map((item) => ({
      school_id: authState.user.schoolId,
      fee_structure_id: structure.id,
      fee_head_id: item.feeHeadId,
      amount: item.amount,
      frequency: item.frequency,
      due_day: item.dueDay,
      is_mandatory: item.isMandatory,
    }))

    const { error: itemsErr } = await supabase
      .from('fee_structure_items')
      .insert(itemsToInsert)

    if (itemsErr) {
      return { success: false, error: itemsErr.message }
    }

    // Fix #7: Audit log
    await writeAuditLog(supabase, authState.user.schoolId, authState.user.profileId,
      'FEE_STRUCTURE_CREATED', 'fee_structure', structure.id, null,
      { name: validated.name, classId: validated.classId, itemCount: validated.items.length })

    return { success: true, data: structure }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create fee structure' }
  }
}

// ============================================================
// Invoice Generation
// ============================================================
export async function generateInvoiceAction(input: GenerateInvoiceInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) {
      return { success: false, error: 'Forbidden' }
    }

    const validated = generateInvoiceSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Calculate totals server-side authoritatively
    const totals = calculateInvoiceTotals(
      validated.items,
      [],
      0,
      validated.previousBalanceAmount
    )

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        school_id: schoolId,
        academic_session_id: validated.academicSessionId,
        student_id: validated.studentId,
        invoice_number: invoiceNumber,
        issue_date: validated.issueDate,
        due_date: validated.dueDate,
        gross_amount: totals.grossAmount,
        discount_amount: totals.discountAmount,
        concession_amount: totals.concessionAmount,
        late_fee_amount: totals.lateFeeAmount,
        previous_balance_amount: totals.previousBalanceAmount,
        net_amount: totals.netAmount,
        paid_amount: 0,
        outstanding_amount: totals.netAmount,
        status: 'issued',
      })
      .select()
      .single()

    if (invErr || !invoice) {
      return { success: false, error: invErr?.message || 'Failed to generate invoice' }
    }

    // Insert Invoice Line Items
    const invoiceItems = validated.items.map((item) => ({
      school_id: schoolId,
      invoice_id: invoice.id,
      fee_head_id: item.feeHeadId,
      description: item.description,
      amount: item.amount,
      discount_amount: item.discountAmount || 0,
      net_amount: Math.max(0, item.amount - (item.discountAmount || 0)),
    }))

    await supabase.from('invoice_items').insert(invoiceItems)

    // Fix #8: Double-entry ledger (CHARGE)
    await writeBalancedLedgerEntry(supabase, {
      schoolId,
      academicSessionId: validated.academicSessionId,
      studentId: validated.studentId,
      invoiceId: invoice.id,
      transactionType: 'CHARGE',
      debitAccount: 'Accounts Receivable',
      creditAccount: 'Fee Revenue',
      amount: totals.netAmount,
      description: `Invoice Demand Issued: ${invoiceNumber}`,
      actorProfileId: authState.user.profileId,
    })

    // Fix #7: Audit log
    await writeAuditLog(supabase, schoolId, authState.user.profileId,
      'INVOICE_CREATED', 'invoice', invoice.id, null,
      { invoiceNumber, studentId: validated.studentId, netAmount: totals.netAmount })

    // Recalculate financial clearance status
    await getFinancialClearance(validated.studentId, validated.academicSessionId)

    return { success: true, data: invoice }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate invoice' }
  }
}

// ============================================================
// Manual Payment Recording
// ============================================================
export async function recordManualPaymentAction(input: RecordManualPaymentInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) {
      return { success: false, error: 'Forbidden' }
    }

    const validated = recordManualPaymentSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const paymentNumber = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const isAutoVerified = ['cash', 'upi', 'pos'].includes(validated.paymentMethod)

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        school_id: schoolId,
        academic_session_id: validated.academicSessionId,
        student_id: validated.studentId,
        payment_number: paymentNumber,
        payment_date: validated.paymentDate,
        payment_method: validated.paymentMethod,
        amount: validated.amount,
        currency: 'INR',
        transaction_reference: validated.transactionReference || null,
        cheque_number: validated.chequeNumber || null,
        bank_name: validated.bankName || null,
        status: isAutoVerified ? 'successful' : 'pending',
        received_by: authState.user.profileId,
        verified_by: isAutoVerified ? authState.user.profileId : null,
        verified_at: isAutoVerified ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (payErr || !payment) {
      return { success: false, error: payErr?.message || 'Failed to record payment' }
    }

    if (isAutoVerified) {
      // Fix #6: Allocate with overpayment tracking
      if (validated.invoiceId) {
        await allocatePaymentToInvoice(supabase, schoolId, payment.id, validated.invoiceId, validated.amount, validated.studentId, validated.academicSessionId)
      }

      // Fix #8: Double-entry ledger (PAYMENT)
      await writeBalancedLedgerEntry(supabase, {
        schoolId,
        academicSessionId: validated.academicSessionId,
        studentId: validated.studentId,
        paymentId: payment.id,
        invoiceId: validated.invoiceId || null,
        transactionType: 'PAYMENT',
        debitAccount: `Cash/Bank (${validated.paymentMethod.toUpperCase()})`,
        creditAccount: 'Accounts Receivable',
        amount: validated.amount,
        description: `Manual Payment Received (${validated.paymentMethod.toUpperCase()}): ${paymentNumber}`,
        actorProfileId: authState.user.profileId,
      })

      // Generate Receipt
      const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      await supabase.from('receipts').insert({
        school_id: schoolId,
        payment_id: payment.id,
        receipt_number: receiptNumber,
        issue_date: validated.paymentDate,
      })

      // Fix #7: Audit log
      await writeAuditLog(supabase, schoolId, authState.user.profileId,
        'MANUAL_PAYMENT_RECORDED', 'payment', payment.id, null,
        { paymentNumber, method: validated.paymentMethod, amount: validated.amount, studentId: validated.studentId })

      // Recalculate financial clearance
      await getFinancialClearance(validated.studentId, validated.academicSessionId)
    } else {
      // Fix #7: Audit log for pending payment
      await writeAuditLog(supabase, schoolId, authState.user.profileId,
        'PAYMENT_PENDING_VERIFICATION', 'payment', payment.id, null,
        { paymentNumber, method: validated.paymentMethod, amount: validated.amount })
    }

    return { success: true, data: payment }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record manual payment' }
  }
}

// ============================================================
// Fix #1: Razorpay Order Creation — Server-Authoritative Amount
// ============================================================
export async function createRazorpayOrderAction(input: CreateRazorpayOrderInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createRazorpayOrderSchema.parse(input)
    const supabase = (await createClient()) as any

    // Fetch invoice authoritatively from server
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', validated.invoiceId)
      .eq('school_id', authState.user.schoolId)
      .single()

    if (invErr || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    if (invoice.status === 'paid' || Number(invoice.outstanding_amount) <= 0) {
      return { success: false, error: 'Invoice is already fully paid' }
    }

    const serverOutstanding = Number(invoice.outstanding_amount)

    // FIX #1: Server-side amount validation — NEVER trust client amount
    if (validated.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than 0' }
    }
    if (validated.amount > serverOutstanding) {
      return { success: false, error: `Payment amount (₹${validated.amount}) exceeds invoice outstanding amount (₹${serverOutstanding})` }
    }

    // Razorpay production fail-closed: reject placeholder secrets in production
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    const _razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder'

    if (process.env.NODE_ENV === 'production' && razorpayKeyId === 'rzp_test_placeholder') {
      return { success: false, error: 'Razorpay credentials not configured for production' }
    }

    const amountInPaise = Math.round(validated.amount * 100)

    // Mock/Real Razorpay Order ID generation
    const mockOrderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    const paymentNumber = `PAY-RZP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        school_id: authState.user.schoolId,
        academic_session_id: validated.academicSessionId,
        student_id: invoice.student_id,
        payment_number: paymentNumber,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'razorpay',
        amount: validated.amount,
        currency: 'INR',
        razorpay_order_id: mockOrderId,
        status: 'pending',
      })
      .select()
      .single()

    if (payErr || !payment) {
      return { success: false, error: payErr?.message || 'Failed to create payment order record' }
    }

    return {
      success: true,
      data: {
        orderId: mockOrderId,
        keyId: razorpayKeyId,
        amount: amountInPaise,
        currency: 'INR',
        paymentId: payment.id,
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create Razorpay order' }
  }
}

// ============================================================
// Razorpay Payment Verification
// ============================================================
export async function verifyRazorpayPaymentAction(input: VerifyRazorpayPaymentInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = verifyRazorpayPaymentSchema.parse(input)
    const supabase = (await createClient()) as any
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder'

    // Fail closed in production
    if (process.env.NODE_ENV === 'production' && secret === 'rzp_secret_placeholder') {
      return { success: false, error: 'Razorpay secret not configured for production' }
    }

    // Signature HMAC SHA256 verification
    const text = `${validated.razorpayOrderId}|${validated.razorpayPaymentId}`
    const generatedSignature = crypto.createHmac('sha256', secret).update(text).digest('hex')

    // In dev/test mode with placeholder secret, allow. In production, strict.
    const isSignatureValid =
      secret === 'rzp_secret_placeholder' || generatedSignature === validated.razorpaySignature

    if (!isSignatureValid) {
      return { success: false, error: 'Invalid Razorpay signature. Payment verification failed.' }
    }

    // Find pending payment order
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', validated.razorpayOrderId)
      .eq('school_id', authState.user.schoolId)
      .single()

    if (payErr || !payment) {
      return { success: false, error: 'Matching payment order not found' }
    }

    if (payment.status === 'successful') {
      return { success: true, message: 'Payment already processed successfully (idempotent)' }
    }

    // Update payment record to successful
    await supabase
      .from('payments')
      .update({
        status: 'successful',
        razorpay_payment_id: validated.razorpayPaymentId,
        razorpay_signature: validated.razorpaySignature,
        verified_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    // Fix #6: Allocate payment to invoice with overpayment tracking
    await allocatePaymentToInvoice(supabase, authState.user.schoolId, payment.id, validated.invoiceId, Number(payment.amount), payment.student_id, validated.academicSessionId)

    // Fix #8: Double-entry ledger
    await writeBalancedLedgerEntry(supabase, {
      schoolId: authState.user.schoolId,
      academicSessionId: validated.academicSessionId,
      studentId: payment.student_id,
      paymentId: payment.id,
      invoiceId: validated.invoiceId,
      transactionType: 'PAYMENT',
      debitAccount: 'Cash/Bank (RAZORPAY)',
      creditAccount: 'Accounts Receivable',
      amount: Number(payment.amount),
      description: `Razorpay Payment Confirmed: ${payment.payment_number} (${validated.razorpayPaymentId})`,
      actorProfileId: authState.user.profileId,
    })

    // Generate Receipt
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    await supabase.from('receipts').insert({
      school_id: authState.user.schoolId,
      payment_id: payment.id,
      receipt_number: receiptNumber,
      issue_date: new Date().toISOString().split('T')[0],
    })

    // Fix #7: Audit log
    await writeAuditLog(supabase, authState.user.schoolId, authState.user.profileId,
      'RAZORPAY_PAYMENT_VERIFIED', 'payment', payment.id, null,
      { paymentNumber: payment.payment_number, razorpayPaymentId: validated.razorpayPaymentId, amount: Number(payment.amount) })

    // Recalculate financial clearance
    await getFinancialClearance(payment.student_id, validated.academicSessionId)

    return { success: true, receiptNumber }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to verify Razorpay payment' }
  }
}

// ============================================================
// Fix #2: Refund — Duplicate Refund Protection
// ============================================================
export async function requestRefundAction(input: RequestRefundInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) {
      return { success: false, error: 'Forbidden' }
    }

    const validated = requestRefundSchema.parse(input)
    const supabase = (await createClient()) as any

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', validated.paymentId)
      .eq('school_id', authState.user.schoolId)
      .single()

    if (!payment || payment.status !== 'successful') {
      return { success: false, error: 'Valid successful payment required for refund' }
    }

    if (validated.amount > Number(payment.amount)) {
      return { success: false, error: 'Refund amount cannot exceed original payment amount' }
    }

    // FIX #2: Check total already-refunded amount (non-rejected, non-cancelled)
    const { data: existingRefunds } = await supabase
      .from('refunds')
      .select('amount, status')
      .eq('payment_id', validated.paymentId)
      .eq('school_id', authState.user.schoolId)
      .not('status', 'in', '("rejected","cancelled")')

    let totalAlreadyRefunded = 0
    if (existingRefunds && existingRefunds.length > 0) {
      for (const r of existingRefunds) {
        totalAlreadyRefunded += Number(r.amount)
      }
    }

    const remainingRefundable = Number(payment.amount) - totalAlreadyRefunded
    if (validated.amount > remainingRefundable) {
      return {
        success: false,
        error: `Refund amount (₹${validated.amount}) exceeds remaining refundable amount (₹${remainingRefundable}). Already refunded: ₹${totalAlreadyRefunded}`,
      }
    }

    const refundNumber = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const { data: refund, error } = await supabase
      .from('refunds')
      .insert({
        school_id: authState.user.schoolId,
        payment_id: payment.id,
        student_id: payment.student_id,
        refund_number: refundNumber,
        amount: validated.amount,
        reason: validated.reason,
        status: 'requested',
        requested_by: authState.user.profileId,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Fix #8: Double-entry ledger for refund
    await writeBalancedLedgerEntry(supabase, {
      schoolId: authState.user.schoolId,
      academicSessionId: payment.academic_session_id,
      studentId: payment.student_id,
      paymentId: payment.id,
      transactionType: 'REFUND',
      debitAccount: 'Refund Expense',
      creditAccount: 'Cash/Bank (REFUND)',
      amount: validated.amount,
      description: `Refund Requested: ${refundNumber} — ${validated.reason}`,
      actorProfileId: authState.user.profileId,
    })

    // Fix #7: Audit log
    await writeAuditLog(supabase, authState.user.schoolId, authState.user.profileId,
      'REFUND_REQUESTED', 'refund', refund.id, null,
      { refundNumber, paymentId: payment.id, amount: validated.amount, reason: validated.reason,
        totalAlreadyRefunded, remainingAfter: remainingRefundable - validated.amount })

    return { success: true, data: refund }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to request refund' }
  }
}

// ============================================================
// Billing Adjustment
// ============================================================
export async function createAdjustmentAction(input: CreateAdjustmentInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) {
      return { success: false, error: 'Forbidden' }
    }

    const validated = createAdjustmentSchema.parse(input)
    const supabase = (await createClient()) as any

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', validated.invoiceId)
      .eq('school_id', authState.user.schoolId)
      .single()

    if (!invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    const { data: adjustment, error } = await supabase
      .from('adjustments')
      .insert({
        school_id: authState.user.schoolId,
        invoice_id: invoice.id,
        student_id: invoice.student_id,
        adjustment_type: validated.adjustmentType,
        amount: validated.amount,
        reason: validated.reason,
        actor_profile_id: authState.user.profileId,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    const sign = validated.adjustmentType === 'CREDIT' ? -1 : 1
    const newNet = Math.max(0, Number(invoice.net_amount) + sign * validated.amount)
    const newOutstanding = Math.max(0, newNet - Number(invoice.paid_amount))

    const oldData = { net_amount: Number(invoice.net_amount), outstanding_amount: Number(invoice.outstanding_amount) }

    await supabase
      .from('invoices')
      .update({
        net_amount: newNet,
        outstanding_amount: newOutstanding,
        status: newOutstanding === 0 ? 'paid' : 'adjusted',
      })
      .eq('id', invoice.id)

    // Fix #8: Double-entry ledger for adjustment
    const debitAcct = validated.adjustmentType === 'DEBIT' ? 'Accounts Receivable' : 'Adjustment Expense'
    const creditAcct = validated.adjustmentType === 'DEBIT' ? 'Adjustment Revenue' : 'Accounts Receivable'

    await writeBalancedLedgerEntry(supabase, {
      schoolId: authState.user.schoolId,
      academicSessionId: invoice.academic_session_id,
      studentId: invoice.student_id,
      invoiceId: invoice.id,
      transactionType: 'ADJUSTMENT',
      debitAccount: debitAcct,
      creditAccount: creditAcct,
      amount: validated.amount,
      description: `Billing Adjustment (${validated.adjustmentType}): ${validated.reason}`,
      actorProfileId: authState.user.profileId,
    })

    // Fix #7: Audit log
    await writeAuditLog(supabase, authState.user.schoolId, authState.user.profileId,
      'INVOICE_ADJUSTED', 'invoice', invoice.id, oldData,
      { net_amount: newNet, outstanding_amount: newOutstanding, adjustmentType: validated.adjustmentType, amount: validated.amount })

    await getFinancialClearance(invoice.student_id, invoice.academic_session_id)

    return { success: true, data: adjustment }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create adjustment' }
  }
}

// ============================================================
// Fix #6: Payment Allocation with Overpayment Tracking
// ============================================================
async function allocatePaymentToInvoice(
  supabase: any,
  schoolId: string,
  paymentId: string,
  invoiceId: string,
  amount: number,
  studentId: string,
  academicSessionId: string,
) {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return

  const outstanding = Number(invoice.outstanding_amount)
  const allocAmount = Math.min(amount, outstanding)
  const surplus = amount - allocAmount

  // Allocate to invoice
  await supabase.from('payment_allocations').insert({
    school_id: schoolId,
    payment_id: paymentId,
    invoice_id: invoiceId,
    amount: allocAmount,
  })

  const newPaid = Number(invoice.paid_amount) + allocAmount
  const newOutstanding = Math.max(0, Number(invoice.net_amount) - newPaid)
  const newStatus = newOutstanding === 0 ? 'paid' : 'partially_paid'

  await supabase
    .from('invoices')
    .update({
      paid_amount: newPaid,
      outstanding_amount: newOutstanding,
      status: newStatus,
    })
    .eq('id', invoiceId)

  // FIX #6: Track overpayment surplus as student credit
  if (surplus > 0) {
    await supabase.from('student_credits').insert({
      school_id: schoolId,
      academic_session_id: academicSessionId,
      student_id: studentId,
      source_payment_id: paymentId,
      amount: surplus,
      remaining_amount: surplus,
      description: `Overpayment surplus from payment allocated to invoice ${invoice.invoice_number}`,
    })
  }
}
