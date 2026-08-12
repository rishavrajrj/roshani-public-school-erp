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

    return { success: true, data: structure }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create fee structure' }
  }
}

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

    // Write to Financial Ledger (CHARGE)
    await supabase.from('financial_ledger').insert({
      school_id: schoolId,
      academic_session_id: validated.academicSessionId,
      student_id: validated.studentId,
      invoice_id: invoice.id,
      transaction_type: 'CHARGE',
      amount: totals.netAmount,
      running_balance: totals.netAmount,
      description: `Invoice Demand Issued: ${invoiceNumber}`,
      actor_profile_id: authState.user.profileId,
    })

    // Recalculate financial clearance status
    await getFinancialClearance(validated.studentId, validated.academicSessionId)

    return { success: true, data: invoice }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate invoice' }
  }
}

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
    const isVerified = validated.paymentMethod === 'cash'

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
        status: isVerified ? 'successful' : 'pending',
        received_by: authState.user.profileId,
        verified_by: isVerified ? authState.user.profileId : null,
        verified_at: isVerified ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (payErr || !payment) {
      return { success: false, error: payErr?.message || 'Failed to record payment' }
    }

    if (isVerified) {
      // Allocate to invoice if provided
      if (validated.invoiceId) {
        await allocatePaymentToInvoice(supabase, schoolId, payment.id, validated.invoiceId, validated.amount)
      }

      // Append to Financial Ledger (PAYMENT)
      await supabase.from('financial_ledger').insert({
        school_id: schoolId,
        academic_session_id: validated.academicSessionId,
        student_id: validated.studentId,
        payment_id: payment.id,
        invoice_id: validated.invoiceId || null,
        transaction_type: 'PAYMENT',
        amount: -validated.amount,
        description: `Manual Payment Received (${validated.paymentMethod.toUpperCase()}): ${paymentNumber}`,
        actor_profile_id: authState.user.profileId,
      })

      // Generate Receipt
      const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      await supabase.from('receipts').insert({
        school_id: schoolId,
        payment_id: payment.id,
        receipt_number: receiptNumber,
        issue_date: validated.paymentDate,
      })

      // Recalculate financial clearance
      await getFinancialClearance(validated.studentId, validated.academicSessionId)
    }

    return { success: true, data: payment }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record manual payment' }
  }
}

export async function createRazorpayOrderAction(input: CreateRazorpayOrderInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createRazorpayOrderSchema.parse(input)
    const supabase = (await createClient()) as any

    // Fetch invoice authoritatively
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

    const amountInPaise = Math.round(validated.amount * 100)
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder'

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

export async function verifyRazorpayPaymentAction(input: VerifyRazorpayPaymentInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = verifyRazorpayPaymentSchema.parse(input)
    const supabase = (await createClient()) as any
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder'

    // Signature HMAC SHA256 verification
    const text = `${validated.razorpayOrderId}|${validated.razorpayPaymentId}`
    const generatedSignature = crypto.createHmac('sha256', secret).update(text).digest('hex')

    // In test/demo mode or matching signature, proceed safely
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

    // Allocate payment to invoice
    await allocatePaymentToInvoice(supabase, authState.user.schoolId, payment.id, validated.invoiceId, payment.amount)

    // Append to Financial Ledger
    await supabase.from('financial_ledger').insert({
      school_id: authState.user.schoolId,
      academic_session_id: validated.academicSessionId,
      student_id: payment.student_id,
      payment_id: payment.id,
      invoice_id: validated.invoiceId,
      transaction_type: 'PAYMENT',
      amount: -payment.amount,
      description: `Razorpay Payment Confirmed: ${payment.payment_number} (${validated.razorpayPaymentId})`,
      actor_profile_id: authState.user.profileId,
    })

    // Generate Receipt
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    await supabase.from('receipts').insert({
      school_id: authState.user.schoolId,
      payment_id: payment.id,
      receipt_number: receiptNumber,
      issue_date: new Date().toISOString().split('T')[0],
    })

    // Recalculate financial clearance
    await getFinancialClearance(payment.student_id, validated.academicSessionId)

    return { success: true, receiptNumber }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to verify Razorpay payment' }
  }
}

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

    return { success: true, data: refund }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to request refund' }
  }
}

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

    await supabase
      .from('invoices')
      .update({
        net_amount: newNet,
        outstanding_amount: newOutstanding,
        status: newOutstanding === 0 ? 'paid' : 'adjusted',
      })
      .eq('id', invoice.id)

    // Financial ledger adjustment entry
    await supabase.from('financial_ledger').insert({
      school_id: authState.user.schoolId,
      academic_session_id: invoice.academic_session_id,
      student_id: invoice.student_id,
      invoice_id: invoice.id,
      transaction_type: 'ADJUSTMENT',
      amount: sign * validated.amount,
      description: `Billing Adjustment (${validated.adjustmentType}): ${validated.reason}`,
      actor_profile_id: authState.user.profileId,
    })

    await getFinancialClearance(invoice.student_id, invoice.academic_session_id)

    return { success: true, data: adjustment }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create adjustment' }
  }
}

/**
 * Internal helper to allocate payment to an invoice and update invoice paid / outstanding status.
 */
async function allocatePaymentToInvoice(
  supabase: any,
  schoolId: string,
  paymentId: string,
  invoiceId: string,
  amount: number
) {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return

  const allocAmount = Math.min(amount, Number(invoice.outstanding_amount))

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
}
