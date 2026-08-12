import { createClient } from '@/lib/supabase/server'
import { resolveUser } from '@/lib/auth/resolve-user'
import type { FinancialClearanceSummary, FinancialClearanceStatus } from '@/types/fees'
import { determineClearanceStatus } from './calculations'

/**
 * Reusable Financial Clearance Service.
 * Authoritatively calculates student financial clearance from fee ledger / invoices.
 * Will be consumed in Phase 6 by Admit Card and Result modules.
 */
export async function getFinancialClearance(
  studentId: string,
  academicSessionId: string
): Promise<FinancialClearanceSummary> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return {
      studentId,
      academicSessionId,
      status: 'OUTSTANDING',
      totalBilled: 0,
      totalPaid: 0,
      totalDiscounts: 0,
      totalLateFees: 0,
      totalOutstanding: 0,
      calculatedAt: new Date().toISOString(),
    }
  }

  const supabase = (await createClient()) as any

  // Fetch all invoices for student in session
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('gross_amount, discount_amount, concession_amount, late_fee_amount, net_amount, paid_amount, outstanding_amount, status')
    .eq('student_id', studentId)
    .eq('academic_session_id', academicSessionId)

  if (error || !invoices || invoices.length === 0) {
    return {
      studentId,
      academicSessionId,
      status: 'CLEAR',
      totalBilled: 0,
      totalPaid: 0,
      totalDiscounts: 0,
      totalLateFees: 0,
      totalOutstanding: 0,
      calculatedAt: new Date().toISOString(),
    }
  }

  let totalBilled = 0
  let totalPaid = 0
  let totalDiscounts = 0
  let totalLateFees = 0
  let totalOutstanding = 0

  for (const inv of invoices) {
    if (inv.status !== 'cancelled') {
      totalBilled += Number(inv.net_amount) || 0
      totalPaid += Number(inv.paid_amount) || 0
      totalDiscounts += (Number(inv.discount_amount) || 0) + (Number(inv.concession_amount) || 0)
      totalLateFees += Number(inv.late_fee_amount) || 0
      totalOutstanding += Number(inv.outstanding_amount) || 0
    }
  }

  const status: FinancialClearanceStatus = determineClearanceStatus(
    totalBilled,
    totalPaid,
    totalOutstanding
  )

  // Update or insert into financial_clearance table
  await supabase
    .from('financial_clearance')
    .upsert(
      {
        school_id: authState.user.schoolId,
        academic_session_id: academicSessionId,
        student_id: studentId,
        status,
        total_outstanding: totalOutstanding,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id,academic_session_id,student_id' }
    )

  return {
    studentId,
    academicSessionId,
    status,
    totalBilled: Number(totalBilled.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    totalDiscounts: Number(totalDiscounts.toFixed(2)),
    totalLateFees: Number(totalLateFees.toFixed(2)),
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    calculatedAt: new Date().toISOString(),
  }
}
