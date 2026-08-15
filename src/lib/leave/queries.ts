import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import type { LeaveType, LeaveApplicationItem, StaffLeaveBalance } from '@/types/leave'

export const getLeaveTypes = cache(async function getLeaveTypes(category?: 'student' | 'staff') {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const user = authState.user
  const supabase = await createClient()

  let query = (supabase as any)
    .from('leave_types')
    .select('id, school_id, code, name, applicant_category, default_days_per_year, requires_document, active')
    .eq('school_id', user.schoolId)
    .eq('active', true)

  if (category) {
    query = query.in('applicant_category', [category, 'all'])
  }

  const { data } = await query
  if (!data) return []

  return (data as any[]).map((t: any) => ({
    id: t.id,
    schoolId: t.school_id,
    code: t.code,
    name: t.name,
    applicantCategory: t.applicant_category,
    defaultDaysPerYear: Number(t.default_days_per_year),
    requiresDocument: t.requires_document,
    active: t.active,
  })) as LeaveType[]
})

export const getUserLeaveApplications = cache(async function getUserLeaveApplications(studentId?: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const user = authState.user
  const supabase = await createClient()

  let query = (supabase as any)
    .from('leave_applications')
    .select(`
      id,
      school_id,
      academic_session_id,
      applicant_profile_id,
      applicant_role,
      student_id,
      leave_type_id,
      start_date,
      end_date,
      duration_type,
      calculated_days,
      reason,
      status,
      document_path,
      submitted_at,
      reviewed_at,
      approved_at,
      cancelled_at,
      rejection_reason,
      cancellation_reason,
      leave_types(name),
      students(first_name, last_name)
    `)
    .eq('school_id', user.schoolId)
    .order('created_at', { ascending: false })

  const isParent = hasAnyRole(user, ['Parent'])
  const isStudent = hasAnyRole(user, ['Student'])

  if (isStudent) {
    query = query.eq('applicant_profile_id', user.profileId)
  } else if (isParent) {
    if (studentId) {
      query = query.eq('student_id', studentId)
    } else {
      query = query.eq('applicant_profile_id', user.profileId)
    }
  } else if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
    // Teachers / Staff view own leave applications
    query = query.eq('applicant_profile_id', user.profileId)
  }

  const { data, error } = await query
  if (error || !data) return []

  return (data as any[]).map((item: any) => ({
    id: item.id,
    schoolId: item.school_id,
    academicSessionId: item.academic_session_id,
    applicantProfileId: item.applicant_profile_id,
    applicantName: item.applicant_profile_id === user.profileId ? user.fullName : (item.students ? `${item.students.first_name} ${item.students.last_name}` : 'Applicant'),
    applicantRole: item.applicant_role,
    studentId: item.student_id,
    studentName: item.students ? `${item.students.first_name} ${item.students.last_name}` : null,
    leaveTypeId: item.leave_type_id,
    leaveTypeName: item.leave_types?.name || 'Leave',
    startDate: item.start_date,
    endDate: item.end_date,
    durationType: item.duration_type,
    calculatedDays: Number(item.calculated_days),
    reason: item.reason,
    status: item.status,
    documentPath: item.document_path,
    submittedAt: item.submitted_at,
    reviewedAt: item.reviewed_at,
    approvedAt: item.approved_at,
    cancelledAt: item.cancelled_at,
    rejectionReason: item.rejection_reason,
    cancellationReason: item.cancellation_reason,
  })) as LeaveApplicationItem[]
})

export const getPendingApprovalsQueue = cache(async function getPendingApprovalsQueue() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const user = authState.user
  const supabase = await createClient()

  // Fetch leave approvals assigned to current user's profile or role
  const { data: approvalsData, error } = await (supabase as any)
    .from('leave_approvals')
    .select(`
      id,
      leave_application_id,
      step_order,
      approver_profile_id,
      approver_role,
      status,
      leave_applications (
        id,
        applicant_profile_id,
        applicant_role,
        student_id,
        start_date,
        end_date,
        duration_type,
        calculated_days,
        reason,
        status,
        leave_types(name),
        students(first_name, last_name)
      )
    `)
    .eq('school_id', user.schoolId)
    .eq('approver_profile_id', user.profileId)
    .eq('status', 'pending')

  if (error || !approvalsData) return []

  return (approvalsData as any[]).map((app: any) => {
    const la = app.leave_applications
    return {
      approvalId: app.id,
      stepOrder: app.step_order,
      approverRole: app.approver_role,
      leaveApplicationId: la?.id,
      applicantName: la?.students ? `${la.students.first_name} ${la.students.last_name}` : (la?.applicant_profile_id === user.profileId ? user.fullName : 'Applicant'),
      applicantRole: la?.applicant_role,
      studentName: la?.students ? `${la.students.first_name} ${la.students.last_name}` : null,
      leaveTypeName: la?.leave_types?.name || 'Leave',
      startDate: la?.start_date,
      endDate: la?.end_date,
      durationType: la?.duration_type,
      calculatedDays: Number(la?.calculated_days || 0),
      reason: la?.reason,
      status: la?.status,
    }
  })
})

export async function getStaffLeaveBalances(academicSessionId: string, profileId?: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const user = authState.user
  const supabase = await createClient()
  const targetProfileId = profileId || user.profileId

  const { data } = await (supabase as any)
    .from('leave_entitlements')
    .select(`
      leave_type_id,
      entitlement_days,
      used_days,
      remaining_days,
      leave_types(name)
    `)
    .eq('school_id', user.schoolId)
    .eq('academic_session_id', academicSessionId)
    .eq('profile_id', targetProfileId)

  if (!data) return []

  return (data as any[]).map((item: any) => ({
    leaveTypeId: item.leave_type_id,
    leaveTypeName: item.leave_types?.name || 'Leave',
    entitlementDays: Number(item.entitlement_days),
    usedDays: Number(item.used_days),
    remainingDays: Number(item.remaining_days),
  })) as StaffLeaveBalance[]
}
