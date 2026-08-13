'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import crypto from 'node:crypto'
import {
  applyStudentCreditSchema,
  clearChequeSchema,
  bounceChequeSchema,
  createCashMovementSchema,
  submitReconciliationSchema,
  reviewReconciliationSchema,
  lockReconciliationSchema,
  initializeOpeningBalanceSchema,
  approveRefundSchema,
  processRefundSchema,
  type ApplyStudentCreditInput,
  type ClearChequeInput,
  type BounceChequeInput,
  type CreateCashMovementInput,
  type SubmitReconciliationInput,
  type ReviewReconciliationInput,
  type LockReconciliationInput,
  type InitializeOpeningBalanceInput,
  type ApproveRefundInput,
  type ProcessRefundInput,
} from './collection-schemas'

// Helper: Audit Log
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

// Helper: Allocate payment to invoice
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

export async function applyStudentCreditAction(input: ApplyStudentCreditInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) return { success: false, error: 'Forbidden' }

    const validated = applyStudentCreditSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: credit } = await supabase.from('student_credits').select('*').eq('id', validated.studentCreditId).eq('school_id', schoolId).single()
    if (!credit) return { success: false, error: 'Credit not found' }
    if (Number(credit.remaining_amount) < validated.amount) return { success: false, error: 'Insufficient credit balance' }

    const { data: invoice } = await supabase.from('invoices').select('*').eq('id', validated.invoiceId).eq('school_id', schoolId).single()
    if (!invoice) return { success: false, error: 'Invoice not found' }
    if (Number(invoice.outstanding_amount) < validated.amount) return { success: false, error: 'Amount exceeds invoice outstanding' }

    const { error: allocErr } = await supabase.from('credit_allocations').insert({
      school_id: schoolId,
      student_credit_id: credit.id,
      invoice_id: invoice.id,
      amount: validated.amount,
      allocated_by: authState.user.profileId
    })
    if (allocErr) return { success: false, error: allocErr.message }

    const newPaid = Number(invoice.paid_amount) + validated.amount
    const newOutstanding = Math.max(0, Number(invoice.net_amount) - newPaid)
    const newStatus = newOutstanding === 0 ? 'paid' : 'partially_paid'

    await supabase.from('invoices').update({
      paid_amount: newPaid,
      outstanding_amount: newOutstanding,
      status: newStatus
    }).eq('id', invoice.id)

    await supabase.rpc('create_balanced_journal', {
      p_school_id: schoolId,
      p_academic_session_id: invoice.academic_session_id,
      p_student_id: invoice.student_id,
      p_invoice_id: invoice.id,
      p_payment_id: null,
      p_transaction_type: 'CREDIT_APPLIED',
      p_description: `Applied credit to invoice ${invoice.invoice_number}`,
      p_actor_profile_id: authState.user.profileId,
      p_entries: [
        { account: 'Student Credits', debit: validated.amount, credit: 0 },
        { account: 'Accounts Receivable', credit: validated.amount, debit: 0 }
      ]
    })

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CREDIT_APPLIED', 'student_credit', credit.id, null, { amount: validated.amount, invoiceId: invoice.id })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function clearChequeAction(input: ClearChequeInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) return { success: false, error: 'Forbidden' }

    const validated = clearChequeSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: payment } = await supabase.from('payments').select('*').eq('id', validated.paymentId).eq('school_id', schoolId).single()
    if (!payment) return { success: false, error: 'Payment not found' }

    await supabase.from('payments').update({
      cheque_status: 'cleared',
      status: 'successful',
      verified_by: authState.user.profileId,
      verified_at: new Date().toISOString()
    }).eq('id', payment.id)

    if (validated.invoiceId) {
      await allocatePaymentToInvoice(supabase, schoolId, payment.id, validated.invoiceId, Number(payment.amount), payment.student_id, payment.academic_session_id)
    } else {
      const { data: invoices } = await supabase.from('invoices')
        .select('*')
        .eq('student_id', payment.student_id)
        .eq('status', 'issued')
        .order('due_date', { ascending: true })
        .limit(1)
      if (invoices && invoices.length > 0) {
        await allocatePaymentToInvoice(supabase, schoolId, payment.id, invoices[0].id, Number(payment.amount), payment.student_id, payment.academic_session_id)
      }
    }

    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    await supabase.from('receipts').insert({
      school_id: schoolId,
      payment_id: payment.id,
      receipt_number: receiptNumber,
      issue_date: new Date().toISOString().split('T')[0],
    })

    await supabase.rpc('create_balanced_journal', {
      p_school_id: schoolId,
      p_academic_session_id: payment.academic_session_id,
      p_student_id: payment.student_id,
      p_invoice_id: validated.invoiceId || null,
      p_payment_id: payment.id,
      p_transaction_type: 'PAYMENT',
      p_description: `Cheque Cleared: ${payment.payment_number}`,
      p_actor_profile_id: authState.user.profileId,
      p_entries: [
        { account: 'Cash/Bank (CHEQUE)', debit: Number(payment.amount), credit: 0 },
        { account: 'Accounts Receivable', credit: Number(payment.amount), debit: 0 }
      ]
    })

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CHEQUE_CLEARED', 'payment', payment.id, null, { paymentNumber: payment.payment_number })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function bounceChequeAction(input: BounceChequeInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) return { success: false, error: 'Forbidden' }

    const validated = bounceChequeSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: payment } = await supabase.from('payments').select('*').eq('id', validated.paymentId).eq('school_id', schoolId).single()
    if (!payment) return { success: false, error: 'Payment not found' }

    await supabase.from('payments').update({
      cheque_status: 'bounced',
      status: 'failed',
      verified_by: authState.user.profileId,
      verified_at: new Date().toISOString()
    }).eq('id', payment.id)

    const { data: allocations } = await supabase.from('payment_allocations').select('*').eq('payment_id', payment.id)
    for (const alloc of allocations || []) {
      const { data: inv } = await supabase.from('invoices').select('*').eq('id', alloc.invoice_id).single()
      if (inv) {
        const newPaid = Math.max(0, Number(inv.paid_amount) - Number(alloc.amount))
        const newOutstanding = Number(inv.net_amount) - newPaid
        const newStatus = newOutstanding === 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : 'issued'
        
        await supabase.from('invoices').update({
          paid_amount: newPaid,
          outstanding_amount: newOutstanding,
          status: newStatus
        }).eq('id', inv.id)
      }
      await supabase.from('payment_allocations').delete().eq('id', alloc.id)
    }

    await supabase.rpc('create_balanced_journal', {
      p_school_id: schoolId,
      p_academic_session_id: payment.academic_session_id,
      p_student_id: payment.student_id,
      p_invoice_id: null,
      p_payment_id: payment.id,
      p_transaction_type: 'PAYMENT_REVERSAL',
      p_description: `Cheque Bounced: ${payment.payment_number}. Reason: ${validated.reason}`,
      p_actor_profile_id: authState.user.profileId,
      p_entries: [
        { account: 'Accounts Receivable', debit: Number(payment.amount), credit: 0 },
        { account: 'Cash/Bank (CHEQUE)', credit: Number(payment.amount), debit: 0 }
      ]
    })

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CHEQUE_BOUNCED', 'payment', payment.id, null, { reason: validated.reason })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function createCashMovementAction(input: CreateCashMovementInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) return { success: false, error: 'Forbidden' }

    const validated = createCashMovementSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: movement, error } = await supabase.from('cash_movements').insert({
      school_id: schoolId,
      movement_date: validated.movementDate,
      source_account_code: validated.sourceAccountCode,
      destination_account_code: validated.destinationAccountCode,
      amount: validated.amount,
      reason: validated.reason,
      reference: validated.reference,
      recorded_by: authState.user.profileId
    }).select().single()

    if (error) return { success: false, error: error.message }

    const journalId = crypto.randomUUID()
    
    await supabase.from('cash_movements').update({ journal_id: journalId }).eq('id', movement.id)
    
    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CASH_MOVEMENT_CREATED', 'cash_movement', movement.id, null, { amount: validated.amount })
    return { success: true, data: movement }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function submitReconciliationAction(input: SubmitReconciliationInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) return { success: false, error: 'Forbidden' }

    const validated = submitReconciliationSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: rec, error } = await supabase.from('daily_cash_reconciliations').insert({
      school_id: schoolId,
      reconciliation_date: validated.reconciliationDate,
      physical_cash: validated.physicalCash,
      opening_balance: validated.openingBalance || 0,
      reason: validated.reason,
      status: 'submitted',
      submitted_by: authState.user.profileId
    }).select().single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'RECONCILIATION_SUBMITTED', 'daily_cash_reconciliation', rec.id, null, { date: validated.reconciliationDate })

    return { success: true, data: rec }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function reviewReconciliationAction(input: ReviewReconciliationInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin'])) return { success: false, error: 'Forbidden' }

    const validated = reviewReconciliationSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: rec, error } = await supabase.from('daily_cash_reconciliations').update({
      status: 'reviewed',
      reviewed_by: authState.user.profileId,
      reviewed_at: new Date().toISOString()
    }).eq('id', validated.reconciliationId).eq('school_id', schoolId).select().single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'RECONCILIATION_REVIEWED', 'daily_cash_reconciliation', rec.id)
    return { success: true, data: rec }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function lockReconciliationAction(input: LockReconciliationInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin'])) return { success: false, error: 'Forbidden' }

    const validated = lockReconciliationSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: rec, error } = await supabase.from('daily_cash_reconciliations').update({
      status: 'locked'
    }).eq('id', validated.reconciliationId).eq('school_id', schoolId).select().single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'RECONCILIATION_LOCKED', 'daily_cash_reconciliation', rec.id)
    return { success: true, data: rec }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function initializeOpeningBalanceAction(input: InitializeOpeningBalanceInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin'])) return { success: false, error: 'Forbidden' }

    const validated = initializeOpeningBalanceSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: rec, error } = await supabase.from('daily_cash_reconciliations').insert({
      school_id: schoolId,
      reconciliation_date: validated.date,
      physical_cash: validated.amount,
      opening_balance: validated.amount,
      reason: validated.reason,
      status: 'locked',
      submitted_by: authState.user.profileId
    }).select().single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'OPENING_BALANCE_INITIALIZED', 'daily_cash_reconciliation', rec.id, null, { amount: validated.amount })
    return { success: true, data: rec }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function approveRefundAction(input: ApproveRefundInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin'])) return { success: false, error: 'Forbidden' }

    const validated = approveRefundSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: refund, error } = await supabase.from('refunds').update({
      status: 'approved',
      approved_by: authState.user.profileId
    }).eq('id', validated.refundId).eq('school_id', schoolId).select().single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'REFUND_APPROVED', 'refund', refund.id)
    return { success: true, data: refund }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function processRefundAction(input: ProcessRefundInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) return { success: false, error: 'Forbidden' }

    const validated = processRefundSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: refund, error } = await supabase.from('refunds').update({
      status: 'processed',
      processed_by: authState.user.profileId,
      processed_at: new Date().toISOString()
    }).eq('id', validated.refundId).eq('school_id', schoolId).select().single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'REFUND_PROCESSED', 'refund', refund.id)
    return { success: true, data: refund }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
