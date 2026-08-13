import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import type { AdmitCard } from '@/types/admit-card'

export async function getAdmitCardsForAdmin(examinationId: string, _classId?: string): Promise<AdmitCard[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher', 'Accountant'])) return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  // Fetch Schedules for examination to construct timetable
  const { data: schedules } = await supabase
    .from('examination_schedules')
    .select('*, subjects(name, code), classes(name), sections(name)')
    .eq('examination_id', examinationId)
    .eq('school_id', schoolId)
    .order('exam_date', { ascending: true })
    .order('start_time', { ascending: true })

  const timetable = schedules?.map((s: any) => ({
    date: s.exam_date,
    day: new Date(s.exam_date).toLocaleDateString('en-US', { weekday: 'short' }),
    subjectName: s.subjects?.name || 'Subject',
    subjectCode: s.subjects?.code || '',
    startTime: s.start_time,
    endTime: s.end_time,
    durationMinutes: s.duration_minutes,
    room: s.room,
    venue: s.venue,
    maximumMarks: Number(s.maximum_marks),
  })) || []

  // Fetch Admit Cards
  const query = supabase
    .from('admit_cards')
    .select('*, students(first_name, last_name, admission_number, roll_number, father_name, avatar_url, classes(name), sections(name)), examinations(name, code), academic_sessions(name)')
    .eq('examination_id', examinationId)
    .eq('school_id', schoolId)

  const { data } = await query
  if (!data) return []

  return data.map((d: any) => {
    const sName = d.students ? `${d.students.first_name || ''} ${d.students.last_name || ''}`.trim() : 'Student'
    return {
      id: d.id,
      schoolId: d.school_id,
      academicSessionId: d.academic_session_id,
      academicSessionName: d.academic_sessions?.name,
      examinationId: d.examination_id,
      examinationName: d.examinations?.name,
      examinationCode: d.examinations?.code,
      studentId: d.student_id,
      studentName: sName,
      admissionNumber: d.students?.admission_number || 'N/A',
      rollNumber: d.students?.roll_number || 'N/A',
      className: d.students?.classes?.name || 'Class',
      sectionName: d.students?.sections?.name || '',
      fatherName: d.students?.father_name || 'N/A',
      photoUrl: d.students?.avatar_url || null,
      studentAcademicHistoryId: d.student_academic_history_id,
      admitCardNumber: d.admit_card_number,
      verificationToken: d.verification_token,
      status: d.status,
      financialClearanceStatus: d.financial_clearance_status,
      financialOutstandingAmount: Number(d.financial_outstanding_amount || 0),
      financialOverride: d.financial_override,
      overrideReason: d.override_reason,
      overrideBy: d.override_by,
      overrideAt: d.override_at,
      candidateEligibilityStatus: d.candidate_eligibility_status,
      eligibilityRemarks: d.eligibility_remarks,
      publishedAt: d.published_at,
      publishedBy: d.published_by,
      revokedAt: d.revoked_at,
      revokedBy: d.revoked_by,
      revocationReason: d.revocation_reason,
      previousAdmitCardId: d.previous_admit_card_id,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      timetable,
    }
  })
}

export async function getStudentAdmitCard(studentId: string, examinationId: string): Promise<AdmitCard | null> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data: card } = await supabase
    .from('admit_cards')
    .select('*, students(first_name, last_name, admission_number, roll_number, father_name, avatar_url, classes(name), sections(name)), examinations(name, code), academic_sessions(name)')
    .eq('examination_id', examinationId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'published') // ONLY published cards visible to student/parent
    .maybeSingle()

  if (!card) return null

  // Fetch Schedules for timetable
  const { data: schedules } = await supabase
    .from('examination_schedules')
    .select('*, subjects(name, code)')
    .eq('examination_id', examinationId)
    .eq('school_id', schoolId)
    .eq('status', 'scheduled')
    .order('exam_date', { ascending: true })

  const timetable = schedules?.map((s: any) => ({
    date: s.exam_date,
    day: new Date(s.exam_date).toLocaleDateString('en-US', { weekday: 'short' }),
    subjectName: s.subjects?.name || 'Subject',
    subjectCode: s.subjects?.code || '',
    startTime: s.start_time,
    endTime: s.end_time,
    durationMinutes: s.duration_minutes,
    room: s.room,
    venue: s.venue,
    maximumMarks: Number(s.maximum_marks),
  })) || []

  const sName = card.students ? `${card.students.first_name || ''} ${card.students.last_name || ''}`.trim() : 'Student'

  return {
    id: card.id,
    schoolId: card.school_id,
    academicSessionId: card.academic_session_id,
    academicSessionName: card.academic_sessions?.name,
    examinationId: card.examination_id,
    examinationName: card.examinations?.name,
    examinationCode: card.examinations?.code,
    studentId: card.student_id,
    studentName: sName,
    admissionNumber: card.students?.admission_number || 'N/A',
    rollNumber: card.students?.roll_number || 'N/A',
    className: card.students?.classes?.name || 'Class',
    sectionName: card.students?.sections?.name || '',
    fatherName: card.students?.father_name || 'N/A',
    photoUrl: card.students?.avatar_url || null,
    studentAcademicHistoryId: card.student_academic_history_id,
    admitCardNumber: card.admit_card_number,
    verificationToken: card.verification_token,
    status: card.status,
    financialClearanceStatus: 'CLEAR', // Hidden/sanitized for student document output
    financialOutstandingAmount: 0,
    financialOverride: card.financial_override,
    candidateEligibilityStatus: card.candidate_eligibility_status,
    publishedAt: card.published_at,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
    timetable,
  }
}

export async function getAdmitCardByToken(verificationToken: string): Promise<Record<string, unknown> | null> {
  const supabase = (await createClient()) as any

  const { data: card } = await supabase
    .from('admit_cards')
    .select('admit_card_number, status, published_at, students(first_name, last_name, admission_number, classes(name), sections(name)), examinations(name, code), schools(name)')
    .eq('verification_token', verificationToken)
    .single()

  if (!card) return null

  const sName = card.students ? `${card.students.first_name || ''} ${card.students.last_name || ''}`.trim() : 'Student'

  return {
    isValid: card.status === 'published',
    admitCardNumber: card.admit_card_number,
    status: card.status,
    publishedAt: card.published_at,
    studentName: sName,
    admissionNumber: card.students?.admission_number,
    className: card.students?.classes?.name,
    sectionName: card.students?.sections?.name,
    examinationName: card.examinations?.name,
    schoolName: card.schools?.name,
  }
}
