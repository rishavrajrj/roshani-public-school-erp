import { createClient } from '@/lib/supabase/server'
import { resolveUser } from '@/lib/auth/resolve-user'

export async function getCollectionRegister(filters?: { fromDate?: string, toDate?: string, paymentMethod?: string, staffId?: string }) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  let query = supabase
    .from('payments')
    .select('*, students(first_name, last_name, admission_number, classes(name), sections(name)), receipts(receipt_number), payment_allocations(invoice_id, invoices(invoice_number)), profiles(full_name)')
    .eq('school_id', authState.user.schoolId)

  if (filters?.fromDate) query = query.gte('payment_date', filters.fromDate)
  if (filters?.toDate) query = query.lte('payment_date', filters.toDate)
  if (filters?.paymentMethod) query = query.eq('payment_method', filters.paymentMethod)
  if (filters?.staffId) query = query.eq('received_by', filters.staffId)

  const { data, error } = await query
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}

export async function getDateRangeCollectionReport(fromDate: string, toDate: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return {
      totalCollection: 0, cash: 0, upi: 0, bankTransfer: 0, cheque: 0, pos: 0, razorpay: 0, refunds: 0, netCollection: 0
    }
  }

  const supabase = (await createClient()) as any
  const [{ data: payments }, { data: refunds }] = await Promise.all([
    supabase.from('payments').select('amount, payment_method').eq('school_id', authState.user.schoolId).eq('status', 'successful').gte('payment_date', fromDate).lte('payment_date', toDate),
    supabase.from('refunds').select('amount').eq('school_id', authState.user.schoolId).eq('status', 'processed').gte('processed_at', fromDate).lte('processed_at', toDate + 'T23:59:59.999Z')
  ])

  const report = {
    totalCollection: 0, cash: 0, upi: 0, bankTransfer: 0, cheque: 0, pos: 0, razorpay: 0, refunds: 0, netCollection: 0
  }

  if (payments) {
    for (const p of payments) {
      const amt = Number(p.amount) || 0
      report.totalCollection += amt
      if (p.payment_method === 'cash') report.cash += amt
      else if (p.payment_method === 'upi') report.upi += amt
      else if (p.payment_method === 'bank_transfer') report.bankTransfer += amt
      else if (p.payment_method === 'cheque') report.cheque += amt
      else if (p.payment_method === 'pos') report.pos += amt
      else if (p.payment_method === 'razorpay') report.razorpay += amt
    }
  }

  if (refunds) {
    for (const r of refunds) {
      report.refunds += Number(r.amount) || 0
    }
  }

  report.netCollection = report.totalCollection - report.refunds
  return report
}

export async function getStaffWiseCollectionReport(fromDate: string, toDate: string, staffId?: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  let query = supabase
    .from('payments')
    .select('amount, payment_method, received_by, profiles!inner(full_name, role)')
    .eq('school_id', authState.user.schoolId)
    .eq('status', 'successful')
    .gte('payment_date', fromDate)
    .lte('payment_date', toDate)

  if (staffId) query = query.eq('received_by', staffId)

  const { data } = await query
  if (!data) return []

  const staffMap = new Map<string, any>()
  for (const p of data) {
    const sId = p.received_by
    if (!sId) continue
    if (!staffMap.has(sId)) {
      staffMap.set(sId, {
        staffId: sId, staffName: p.profiles?.full_name || 'Unknown', staffRole: p.profiles?.role || 'Staff',
        cash: 0, upi: 0, bankTransfer: 0, cheque: 0, pos: 0, razorpay: 0, total: 0
      })
    }
    const rec = staffMap.get(sId)!
    const amt = Number(p.amount) || 0
    rec.total += amt
    if (p.payment_method === 'cash') rec.cash += amt
    else if (p.payment_method === 'upi') rec.upi += amt
    else if (p.payment_method === 'bank_transfer') rec.bankTransfer += amt
    else if (p.payment_method === 'cheque') rec.cheque += amt
    else if (p.payment_method === 'pos') rec.pos += amt
    else if (p.payment_method === 'razorpay') rec.razorpay += amt
  }

  return Array.from(staffMap.values())
}

export async function getPaymentModeReport(fromDate: string, toDate: string, method?: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const { data: payments } = await supabase.from('payments')
    .select('amount, payment_method')
    .eq('school_id', authState.user.schoolId)
    .eq('status', 'successful')
    .gte('payment_date', fromDate)
    .lte('payment_date', toDate)

  const modes = ['cash', 'upi', 'bank_transfer', 'cheque', 'pos', 'razorpay']
  const reportMap = new Map<string, any>()
  modes.forEach(m => reportMap.set(m, { method: m, transactionCount: 0, grossCollection: 0, refunds: 0, netCollection: 0 }))

  if (payments) {
    for (const p of payments) {
      if (method && p.payment_method !== method) continue
      const rec = reportMap.get(p.payment_method)
      if (rec) {
        rec.transactionCount++
        rec.grossCollection += Number(p.amount) || 0
      }
    }
  }
  
  // Apportion refunds across modes or just overall? The requirements say array of { method, ... refunds }.
  // Assuming refunds don't easily map to payment mode without joining payment, let's query refunds with payment join if we can. 
  // Let's refine refunds query if needed, but for now we will leave refunds at 0 if we can't map them, or re-query.
  const { data: refinedRefunds } = await supabase
      .from('refunds')
      .select('amount, payments!inner(payment_method)')
      .eq('school_id', authState.user.schoolId)
      .eq('status', 'processed')
      .gte('processed_at', fromDate)
      .lte('processed_at', toDate + 'T23:59:59.999Z')

  if (refinedRefunds) {
    for (const r of refinedRefunds) {
       const m = r.payments?.payment_method
       if (method && m !== method) continue
       const rec = reportMap.get(m)
       if (rec) {
         rec.refunds += Number(r.amount) || 0
       }
    }
  }

  for (const rec of reportMap.values()) {
    rec.netCollection = rec.grossCollection - rec.refunds
  }

  const result = Array.from(reportMap.values())
  return method ? result.filter(r => r.method === method) : result
}

export async function getDailyReconciliation(date: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = (await createClient()) as any
  const { data } = await supabase
    .from('daily_reconciliations')
    .select('*, preparer:profiles!preparer_id(full_name), reviewer:profiles!reviewer_id(full_name)')
    .eq('school_id', authState.user.schoolId)
    .eq('reconciliation_date', date)
    .single()
  
  return data
}

export async function getReconciliationHistory(fromDate: string, toDate: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const { data } = await supabase
    .from('daily_reconciliations')
    .select('*, preparer:profiles!preparer_id(full_name), reviewer:profiles!reviewer_id(full_name)')
    .eq('school_id', authState.user.schoolId)
    .gte('reconciliation_date', fromDate)
    .lte('reconciliation_date', toDate)
    .order('reconciliation_date', { ascending: false })
  
  return data || []
}

export async function getStudentCredits(studentId?: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  let query = supabase
    .from('student_credits')
    .select('*, students(first_name, last_name, admission_number)')
    .eq('school_id', authState.user.schoolId)
    .gt('remaining_amount', 0)

  if (studentId) query = query.eq('student_id', studentId)

  const { data } = await query.order('created_at', { ascending: false })
  return data || []
}

export async function getFinancialAccounts() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const { data } = await supabase
    .from('financial_accounts')
    .select('*')
    .eq('school_id', authState.user.schoolId)
    .order('name')
  
  return data || []
}

export async function getEnhancedDashboardSummary() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const todayStr = new Date().toISOString().split('T')[0]
  const currentMonthStr = todayStr.substring(0, 7)
  const firstDayOfMonth = currentMonthStr + '-01'
  
  // We can fetch fee dashboard summary as base
  const [{ data: invData }, { data: payData }, { data: creditsData }, { data: refundsData }] = await Promise.all([
    supabase.from('invoices').select('net_amount, paid_amount, outstanding_amount, status, due_date').eq('school_id', schoolId),
    supabase.from('payments').select('amount, payment_method, status, payment_date, verified_by, received_by, profiles!inner(full_name)').eq('school_id', schoolId),
    supabase.from('student_credits').select('remaining_amount').eq('school_id', schoolId).gt('remaining_amount', 0),
    supabase.from('refunds').select('amount').eq('school_id', schoolId).eq('status', 'processed').gte('processed_at', firstDayOfMonth)
  ])

  let totalBilled = 0, totalOutstanding = 0, totalOverdue = 0
  if (invData) {
    for (const inv of invData) {
      if (inv.status !== 'cancelled') {
        totalBilled += Number(inv.net_amount) || 0
        const out = Number(inv.outstanding_amount) || 0
        totalOutstanding += out
        if (inv.due_date < todayStr && out > 0) totalOverdue += out
      }
    }
  }

  let totalCollected = 0, todayCollection = 0, monthlyCollection = 0
  let todayCashCollection = 0, todayDigitalCollection = 0
  let pendingVerificationCount = 0
  let chequePendingCount = 0, chequePendingAmount = 0
  const methodBreakdown = { razorpay: 0, cash: 0, bank_transfer: 0, cheque: 0, upi: 0, pos: 0 }
  
  const staffMap = new Map<string, {name: string, amount: number}>()

  if (payData) {
    for (const p of payData) {
      const amt = Number(p.amount) || 0
      
      if (p.status === 'successful') {
        totalCollected += amt
        if (p.payment_date === todayStr) {
          todayCollection += amt
          if (p.payment_method === 'cash') todayCashCollection += amt
          else todayDigitalCollection += amt
        }
        if (p.payment_date.startsWith(currentMonthStr)) monthlyCollection += amt
        
        const method = p.payment_method as keyof typeof methodBreakdown
        if (methodBreakdown[method] !== undefined) methodBreakdown[method] += amt

        if (p.received_by) {
           const staffRec = staffMap.get(p.received_by) || { name: p.profiles?.full_name || 'Unknown', amount: 0 }
           staffRec.amount += amt
           staffMap.set(p.received_by, staffRec)
        }
      } else if (p.status === 'pending') {
        if (['bank_transfer', 'cheque'].includes(p.payment_method)) pendingVerificationCount++
        if (p.payment_method === 'cheque') {
           chequePendingCount++
           chequePendingAmount += amt
        }
      }
    }
  }

  let totalStudentCredits = 0
  if (creditsData) {
    totalStudentCredits = creditsData.reduce((sum: number, c: any) => sum + (Number(c.remaining_amount) || 0), 0)
  }

  let refundsThisMonth = 0
  if (refundsData) {
    refundsThisMonth = refundsData.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0)
  }

  const collectionByStaff = Array.from(staffMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return {
    totalBilled, totalCollected, totalOutstanding, totalOverdue,
    todayCollection, monthlyCollection, pendingVerificationCount, methodBreakdown,
    todayCashCollection, todayDigitalCollection,
    chequePendingCount, chequePendingAmount,
    totalStudentCredits, refundsThisMonth,
    collectionByStaff
  }
}
