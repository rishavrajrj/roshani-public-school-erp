import { createClient } from '@/lib/supabase/server'
import { resolveUser } from '@/lib/auth/resolve-user'
import type {
  FeeHead,
  FeeStructure,
  Invoice,
  Payment,
  FinancialLedgerEntry,
  RefundRequest,
  FeeDashboardSummary,
} from '@/types/fees'

export async function getFeeHeads(): Promise<FeeHead[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const { data, error } = await supabase
    .from('fee_heads')
    .select('*')
    .eq('school_id', authState.user.schoolId)
    .order('name')

  if (error || !data) return []

  return data.map((item: any) => ({
    id: item.id,
    schoolId: item.school_id,
    code: item.code,
    name: item.name,
    description: item.description,
    active: item.active,
    createdAt: item.created_at,
  }))
}

export async function getFeeStructures(classId?: string): Promise<FeeStructure[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  let query = supabase
    .from('fee_structures')
    .select('*, fee_structure_items(*, fee_heads(*))')
    .eq('school_id', authState.user.schoolId)

  if (classId) {
    query = query.eq('class_id', classId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error || !data) return []

  return data.map((item: any) => ({
    id: item.id,
    schoolId: item.school_id,
    academicSessionId: item.academic_session_id,
    classId: item.class_id,
    sectionId: item.section_id,
    name: item.name,
    description: item.description,
    version: item.version,
    isActive: item.is_active,
    effectiveFrom: item.effective_from,
    effectiveTo: item.effective_to,
    createdAt: item.created_at,
    items: (item.fee_structure_items || []).map((it: any) => ({
      id: it.id,
      schoolId: it.school_id,
      feeStructureId: it.fee_structure_id,
      feeHeadId: it.fee_head_id,
      feeHeadName: it.fee_heads?.name || 'Fee Head',
      feeHeadCode: it.fee_heads?.code || '',
      amount: Number(it.amount),
      frequency: it.frequency,
      dueDay: it.due_day,
      isMandatory: it.is_mandatory,
      createdAt: it.created_at,
    })),
  }))
}

export async function getInvoices(studentId?: string): Promise<Invoice[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  let query = supabase
    .from('invoices')
    .select('*, students(first_name, last_name, admission_number), invoice_items(*, fee_heads(name))')
    .eq('school_id', authState.user.schoolId)

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data, error } = await query.order('issue_date', { ascending: false })
  if (error || !data) return []

  return data.map((item: any) => ({
    id: item.id,
    schoolId: item.school_id,
    academicSessionId: item.academic_session_id,
    studentId: item.student_id,
    studentName: item.students ? `${item.students.first_name} ${item.students.last_name}` : 'Student',
    admissionNumber: item.students?.admission_number || '',
    invoiceNumber: item.invoice_number,
    issueDate: item.issue_date,
    dueDate: item.due_date,
    grossAmount: Number(item.gross_amount),
    discountAmount: Number(item.discount_amount),
    concessionAmount: Number(item.concession_amount),
    lateFeeAmount: Number(item.late_fee_amount),
    previousBalanceAmount: Number(item.previous_balance_amount),
    netAmount: Number(item.net_amount),
    paidAmount: Number(item.paid_amount),
    outstandingAmount: Number(item.outstanding_amount),
    status: item.status,
    createdAt: item.created_at,
    items: (item.invoice_items || []).map((it: any) => ({
      id: it.id,
      schoolId: it.school_id,
      invoiceId: it.invoice_id,
      feeHeadId: it.fee_head_id,
      feeHeadName: it.fee_heads?.name || 'Item',
      description: it.description,
      amount: Number(it.amount),
      discountAmount: Number(it.discount_amount),
      netAmount: Number(it.net_amount),
      createdAt: it.created_at,
    })),
  }))
}

export async function getPayments(studentId?: string): Promise<Payment[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  let query = supabase
    .from('payments')
    .select('*, students(first_name, last_name, admission_number), payment_allocations(*)')
    .eq('school_id', authState.user.schoolId)

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data, error } = await query.order('payment_date', { ascending: false })
  if (error || !data) return []

  return data.map((item: any) => ({
    id: item.id,
    schoolId: item.school_id,
    academicSessionId: item.academic_session_id,
    studentId: item.student_id,
    studentName: item.students ? `${item.students.first_name} ${item.students.last_name}` : 'Student',
    admissionNumber: item.students?.admission_number || '',
    paymentNumber: item.payment_number,
    paymentDate: item.payment_date,
    paymentMethod: item.payment_method,
    amount: Number(item.amount),
    currency: item.currency,
    razorpayOrderId: item.razorpay_order_id,
    razorpayPaymentId: item.razorpay_payment_id,
    transactionReference: item.transaction_reference,
    chequeNumber: item.cheque_number,
    bankName: item.bank_name,
    status: item.status,
    receivedBy: item.received_by,
    verifiedBy: item.verified_by,
    verifiedAt: item.verified_at,
    createdAt: item.created_at,
    allocations: (item.payment_allocations || []).map((alloc: any) => ({
      id: alloc.id,
      schoolId: alloc.school_id,
      paymentId: alloc.payment_id,
      invoiceId: alloc.invoice_id,
      amount: Number(alloc.amount),
      allocatedAt: alloc.allocated_at,
    })),
  }))
}

export async function getFinancialLedger(studentId?: string): Promise<FinancialLedgerEntry[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  let query = supabase
    .from('financial_ledger')
    .select('*, students(first_name, last_name), profiles(full_name)')
    .eq('school_id', authState.user.schoolId)

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error || !data) return []

  return data.map((item: any) => ({
    id: item.id,
    schoolId: item.school_id,
    academicSessionId: item.academic_session_id,
    studentId: item.student_id,
    studentName: item.students ? `${item.students.first_name} ${item.students.last_name}` : 'Student',
    invoiceId: item.invoice_id,
    paymentId: item.payment_id,
    transactionType: item.transaction_type,
    amount: Number(item.amount),
    runningBalance: Number(item.running_balance),
    description: item.description,
    actorProfileId: item.actor_profile_id,
    actorName: item.profiles?.full_name || 'System',
    createdAt: item.created_at,
  }))
}

export async function getRefundRequests(): Promise<RefundRequest[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const { data, error } = await supabase
    .from('refunds')
    .select('*, students(first_name, last_name)')
    .eq('school_id', authState.user.schoolId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((item: any) => ({
    id: item.id,
    schoolId: item.school_id,
    paymentId: item.payment_id,
    studentId: item.student_id,
    studentName: item.students ? `${item.students.first_name} ${item.students.last_name}` : 'Student',
    refundNumber: item.refund_number,
    amount: Number(item.amount),
    reason: item.reason,
    status: item.status,
    requestedBy: item.requested_by,
    approvedBy: item.approved_by,
    processedAt: item.processed_at,
    createdAt: item.created_at,
  }))
}

export async function getFeeDashboardSummary(): Promise<FeeDashboardSummary> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return {
      totalBilled: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      todayCollection: 0,
      monthlyCollection: 0,
      pendingVerificationCount: 0,
      methodBreakdown: { razorpay: 0, cash: 0, bank_transfer: 0, cheque: 0 },
    }
  }

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const [{ data: invData }, { data: payData }] = await Promise.all([
    supabase.from('invoices').select('net_amount, paid_amount, outstanding_amount, status, due_date').eq('school_id', schoolId),
    supabase.from('payments').select('amount, payment_method, status, payment_date, verified_by').eq('school_id', schoolId),
  ])

  let totalBilled = 0
  let totalOutstanding = 0
  let totalOverdue = 0
  const todayStr = new Date().toISOString().split('T')[0]
  const currentMonthStr = todayStr.substring(0, 7)

  if (invData) {
    for (const inv of invData) {
      if (inv.status !== 'cancelled') {
        totalBilled += Number(inv.net_amount) || 0
        const out = Number(inv.outstanding_amount) || 0
        totalOutstanding += out
        if (inv.due_date < todayStr && out > 0) {
          totalOverdue += out
        }
      }
    }
  }

  let totalCollected = 0
  let todayCollection = 0
  let monthlyCollection = 0
  let pendingVerificationCount = 0
  const methodBreakdown = { razorpay: 0, cash: 0, bank_transfer: 0, cheque: 0 }

  if (payData) {
    for (const p of payData) {
      if (p.status === 'successful') {
        const amt = Number(p.amount) || 0
        totalCollected += amt

        if (p.payment_date === todayStr) todayCollection += amt
        if (p.payment_date.startsWith(currentMonthStr)) monthlyCollection += amt

        const method = p.payment_method as keyof typeof methodBreakdown
        if (methodBreakdown[method] !== undefined) {
          methodBreakdown[method] += amt
        }
      } else if (p.status === 'pending' && ['bank_transfer', 'cheque'].includes(p.payment_method)) {
        pendingVerificationCount++
      }
    }
  }

  return {
    totalBilled: Number(totalBilled.toFixed(2)),
    totalCollected: Number(totalCollected.toFixed(2)),
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    totalOverdue: Number(totalOverdue.toFixed(2)),
    todayCollection: Number(todayCollection.toFixed(2)),
    monthlyCollection: Number(monthlyCollection.toFixed(2)),
    pendingVerificationCount,
    methodBreakdown: {
      razorpay: Number(methodBreakdown.razorpay.toFixed(2)),
      cash: Number(methodBreakdown.cash.toFixed(2)),
      bank_transfer: Number(methodBreakdown.bank_transfer.toFixed(2)),
      cheque: Number(methodBreakdown.cheque.toFixed(2)),
    },
  }
}
