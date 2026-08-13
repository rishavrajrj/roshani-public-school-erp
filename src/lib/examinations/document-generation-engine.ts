import { createClient } from '@/lib/supabase/server'

export interface ReportCardSnapshotPayload {
  studentId: string
  examinationId: string
  classId: string
  sectionId?: string | null
  academicSessionId: string
  studentAcademicHistoryId?: string | null
  resultId?: string | null
  templateId?: string | null
  attendanceDays: number
  presentDays: number
  absentDays: number
  leaveDays: number
  attendancePercentage: number
  overallPercentage: number
  overallGrade: string
  resultStatus: string
  promotionStatus: string
}

export async function generateReportCardSnapshotEngine(
  schoolId: string,
  examinationId: string,
  studentId: string,
  classId: string,
  templateId?: string | null
): Promise<ReportCardSnapshotPayload | null> {
  const supabase = (await createClient()) as any

  // 1. Fetch Final Exam Master
  const { data: exam } = await supabase
    .from('examinations')
    .select('academic_session_id')
    .eq('id', examinationId)
    .eq('school_id', schoolId)
    .single()

  if (!exam) return null

  const sessionId = exam.academic_session_id

  // 2. Fetch Academic History
  const { data: history } = await supabase
    .from('student_academic_history')
    .select('id, section_id')
    .eq('student_id', studentId)
    .eq('academic_session_id', sessionId)
    .eq('class_id', classId)
    .eq('school_id', schoolId)
    .maybeSingle()

  // 3. Fetch Authoritative Final Result
  const { data: result } = await supabase
    .from('student_results')
    .select('*')
    .eq('examination_id', examinationId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .neq('status', 'revoked')
    .maybeSingle()

  if (!result) return null

  // 4. Fetch Executed / Approved Promotion Decision
  const { data: promotion } = await supabase
    .from('promotion_records')
    .select('decision')
    .eq('student_id', studentId)
    .eq('source_academic_session_id', sessionId)
    .eq('school_id', schoolId)
    .maybeSingle()

  const promotionStatus = promotion ? promotion.decision : (result.result_status === 'PASS' ? 'PROMOTED' : 'REPEAT')

  // 5. Compute Attendance Summary from Authoritative Attendance Records
  const { data: attRecords } = await supabase
    .from('attendance_records')
    .select('status')
    .eq('student_id', studentId)
    .eq('academic_session_id', sessionId)
    .eq('school_id', schoolId)

  let attendanceDays = 0
  let presentDays = 0
  let absentDays = 0
  let leaveDays = 0
  let attendancePct = 0

  if (attRecords && attRecords.length > 0) {
    attendanceDays = attRecords.length
    for (const r of attRecords) {
      if (r.status === 'present' || r.status === 'late') presentDays++
      else if (r.status === 'absent') absentDays++
      else if (r.status === 'leave') leaveDays++
    }
    attendancePct = Number(((presentDays / attendanceDays) * 100).toFixed(2))
  } else {
    attendanceDays = 0
    presentDays = 0
    absentDays = 0
    leaveDays = 0
    attendancePct = 0
  }

  return {
    studentId,
    examinationId,
    classId,
    sectionId: history?.section_id || null,
    academicSessionId: sessionId,
    studentAcademicHistoryId: history?.id || null,
    resultId: result.id,
    templateId: templateId || null,
    attendanceDays,
    presentDays,
    absentDays,
    leaveDays,
    attendancePercentage: attendancePct,
    overallPercentage: Number(result.percentage),
    overallGrade: result.grade || '—',
    resultStatus: result.result_status,
    promotionStatus,
  }
}
