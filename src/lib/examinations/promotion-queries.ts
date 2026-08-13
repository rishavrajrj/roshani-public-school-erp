import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import type { PromotionRecord, PromotionPolicy, ClassProgression } from '@/types/promotion'

export async function getPromotionWorkspaceData(
  sourceSessionId: string,
  targetSessionId: string,
  sourceClassId: string
): Promise<PromotionRecord[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher', 'Accountant'])) return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data } = await supabase
    .from('promotion_records')
    .select('*, students(first_name, last_name, admission_number), source_class:classes!source_class_id(name), target_class:classes!target_class_id(name), source_session:academic_sessions!source_academic_session_id(name), target_session:academic_sessions!target_academic_session_id(name)')
    .eq('source_academic_session_id', sourceSessionId)
    .eq('target_academic_session_id', targetSessionId)
    .eq('source_class_id', sourceClassId)
    .eq('school_id', schoolId)

  if (!data) return []

  return data.map((d: any) => {
    const sName = d.students ? `${d.students.first_name || ''} ${d.students.last_name || ''}`.trim() : 'Student'
    return {
      id: d.id,
      schoolId: d.school_id,
      studentId: d.student_id,
      studentName: sName,
      admissionNumber: d.students?.admission_number || 'N/A',
      sourceAcademicHistoryId: d.source_academic_history_id,
      sourceAcademicSessionId: d.source_academic_session_id,
      sourceAcademicSessionName: d.source_session?.name,
      targetAcademicSessionId: d.target_academic_session_id,
      targetAcademicSessionName: d.target_session?.name,
      sourceClassId: d.source_class_id,
      sourceClassName: d.source_class?.name,
      targetClassId: d.target_class_id,
      targetClassName: d.target_class?.name || 'N/A',
      targetSectionId: d.target_section_id,
      sourceResultId: d.source_result_id,
      decision: d.decision,
      conditional: d.conditional,
      conditionDescription: d.condition_description,
      reason: d.reason,
      recommendedBy: d.recommended_by,
      recommendedAt: d.recommended_at,
      approvedBy: d.approved_by,
      approvedAt: d.approved_at,
      executedBy: d.executed_by,
      executedAt: d.executed_at,
      status: d.status,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }
  })
}

export async function getStudentPromotionStatus(studentId: string): Promise<{ activeHistory: any; promotionHistory: PromotionRecord[] }> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return { activeHistory: null, promotionHistory: [] }

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  // Fetch active history
  const { data: activeHistory } = await supabase
    .from('student_academic_history')
    .select('*, classes(name), sections(name), academic_sessions(name)')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .maybeSingle()

  // Fetch executed promotion records
  const { data: records } = await supabase
    .from('promotion_records')
    .select('*, source_class:classes!source_class_id(name), target_class:classes!target_class_id(name), source_session:academic_sessions!source_academic_session_id(name), target_session:academic_sessions!target_academic_session_id(name)')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'executed')
    .order('created_at', { ascending: false })

  const promotionHistory: PromotionRecord[] = records?.map((d: any) => ({
    id: d.id,
    schoolId: d.school_id,
    studentId: d.student_id,
    sourceAcademicHistoryId: d.source_academic_history_id,
    sourceAcademicSessionId: d.source_academic_session_id,
    sourceAcademicSessionName: d.source_session?.name,
    targetAcademicSessionId: d.target_academic_session_id,
    targetAcademicSessionName: d.target_session?.name,
    sourceClassId: d.source_class_id,
    sourceClassName: d.source_class?.name,
    targetClassId: d.target_class_id,
    targetClassName: d.target_class?.name,
    decision: d.decision,
    conditional: d.conditional,
    conditionDescription: d.condition_description,
    reason: d.reason,
    status: d.status,
    executedAt: d.executed_at,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  })) || []

  return { activeHistory, promotionHistory }
}

export async function getPromotionPolicies(): Promise<PromotionPolicy | null> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = (await createClient()) as any
  const { data } = await supabase
    .from('promotion_policies')
    .select('*')
    .eq('school_id', authState.user.schoolId)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    schoolId: data.school_id,
    name: data.name,
    minOverallPercentage: Number(data.min_overall_percentage),
    minPassedSubjects: data.min_passed_subjects,
    maxFailedSubjectsAllowed: data.max_failed_subjects_allowed,
    allowSupplementary: data.allow_supplementary,
    maxSupplementarySubjects: data.max_supplementary_subjects,
    allowConditionalPromotion: data.allow_conditional_promotion,
    requireAttendance: data.require_attendance,
    minAttendancePercentage: data.min_attendance_percentage ? Number(data.min_attendance_percentage) : null,
    requireFeeClearance: data.require_fee_clearance,
    requirePrincipalApproval: data.require_principal_approval,
    isActive: data.is_active,
  }
}

export async function getClassProgressions(): Promise<ClassProgression[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const { data } = await supabase
    .from('class_progressions')
    .select('*, source_class:classes!source_class_id(name), target_class:classes!target_class_id(name)')
    .eq('school_id', authState.user.schoolId)

  if (!data) return []

  return data.map((d: any) => ({
    id: d.id,
    schoolId: d.school_id,
    sourceClassId: d.source_class_id,
    sourceClassName: d.source_class?.name,
    targetClassId: d.target_class_id,
    targetClassName: d.target_class?.name,
    isFinalClass: d.is_final_class,
  }))
}
