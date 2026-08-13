import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import type { ReportCard, Certificate, DocumentVerificationPayload } from '@/types/document'
import type { StudentMark } from '@/types/result'

export async function getReportCardsForAdmin(examinationId: string, classId: string): Promise<ReportCard[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher', 'Accountant'])) return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data } = await supabase
    .from('report_cards')
    .select('*, students(first_name, last_name, admission_number, roll_number, father_name, classes(name), sections(name)), examinations(name), academic_sessions(name)')
    .eq('examination_id', examinationId)
    .eq('class_id', classId)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (!data) return []

  return data.map((d: any) => {
    const sName = d.students ? `${d.students.first_name || ''} ${d.students.last_name || ''}`.trim() : 'Student'
    return {
      id: d.id,
      schoolId: d.school_id,
      academicSessionId: d.academic_session_id,
      academicSessionName: d.academic_sessions?.name,
      studentId: d.student_id,
      studentName: sName,
      admissionNumber: d.students?.admission_number || 'N/A',
      rollNumber: d.students?.roll_number || 'N/A',
      className: d.students?.classes?.name || 'Class',
      sectionName: d.students?.sections?.name || '',
      fatherName: d.students?.father_name || 'N/A',
      studentAcademicHistoryId: d.student_academic_history_id,
      classId: d.class_id,
      sectionId: d.section_id,
      examinationId: d.examination_id,
      examinationName: d.examinations?.name,
      resultId: d.result_id,
      templateId: d.template_id,
      version: d.version || 1,
      previousReportCardId: d.previous_report_card_id,
      status: d.status,
      attendanceDays: d.attendance_days || 0,
      presentDays: d.present_days || 0,
      absentDays: d.absent_days || 0,
      leaveDays: d.leave_days || 0,
      attendancePercentage: Number(d.attendance_percentage || 0),
      overallPercentage: Number(d.overall_percentage || 0),
      overallGrade: d.overall_grade,
      resultStatus: d.result_status,
      promotionStatus: d.promotion_status,
      teacherRemarks: d.teacher_remarks,
      principalRemarks: d.principal_remarks,
      correctionReason: d.correction_reason,
      verificationToken: d.verification_token,
      approvedBy: d.approved_by,
      approvedAt: d.approved_at,
      publishedBy: d.published_by,
      publishedAt: d.published_at,
      revokedBy: d.revoked_by,
      revocationReason: d.revocation_reason,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }
  })
}

export async function getStudentReportCard(studentId: string, examinationId: string): Promise<ReportCard | null> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data: card } = await supabase
    .from('report_cards')
    .select('*, students(first_name, last_name, admission_number, roll_number, father_name, classes(name), sections(name)), examinations(name), academic_sessions(name)')
    .eq('examination_id', examinationId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'published') // ONLY published report cards visible to student/parent
    .maybeSingle()

  if (!card) return null

  // Fetch subject marks breakdown
  const { data: subjectMarksData } = await supabase
    .from('student_marks')
    .select('*, subjects(name, code), examination_subject_configs(maximum_marks, passing_marks)')
    .eq('examination_id', examinationId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)

  const subjectMarks: StudentMark[] = subjectMarksData?.map((sm: any) => ({
    id: sm.id,
    schoolId: sm.school_id,
    academicSessionId: sm.academic_session_id,
    examinationId: sm.examination_id,
    studentId: sm.student_id,
    classId: sm.class_id,
    sectionId: sm.section_id,
    subjectId: sm.subject_id,
    subjectName: sm.subjects?.name || 'Subject',
    subjectCode: sm.subjects?.code || '',
    attendanceStatus: sm.attendance_status,
    theoryMarksObtained: Number(sm.theory_marks_obtained || 0),
    practicalMarksObtained: Number(sm.practical_marks_obtained || 0),
    internalMarksObtained: Number(sm.internal_marks_obtained || 0),
    totalMarksObtained: Number(sm.total_marks_obtained || 0),
    maximumMarks: sm.examination_subject_configs ? Number(sm.examination_subject_configs.maximum_marks) : 100,
    passingMarks: sm.examination_subject_configs ? Number(sm.examination_subject_configs.passing_marks) : 33,
    isPass: sm.is_pass,
    status: sm.status,
    createdBy: sm.created_by,
  })) || []

  const sName = card.students ? `${card.students.first_name || ''} ${card.students.last_name || ''}`.trim() : 'Student'

  return {
    id: card.id,
    schoolId: card.school_id,
    academicSessionId: card.academic_session_id,
    academicSessionName: card.academic_sessions?.name,
    studentId: card.student_id,
    studentName: sName,
    admissionNumber: card.students?.admission_number || 'N/A',
    rollNumber: card.students?.roll_number || 'N/A',
    className: card.students?.classes?.name || 'Class',
    sectionName: card.students?.sections?.name || '',
    fatherName: card.students?.father_name || 'N/A',
    studentAcademicHistoryId: card.student_academic_history_id,
    classId: card.class_id,
    sectionId: card.section_id,
    examinationId: card.examination_id,
    examinationName: card.examinations?.name,
    resultId: card.result_id,
    templateId: card.template_id,
    version: card.version || 1,
    previousReportCardId: card.previous_report_card_id,
    status: card.status,
    attendanceDays: card.attendance_days || 0,
    presentDays: card.present_days || 0,
    absentDays: card.absent_days || 0,
    leaveDays: card.leave_days || 0,
    attendancePercentage: Number(card.attendance_percentage || 0),
    overallPercentage: Number(card.overall_percentage || 0),
    overallGrade: card.overall_grade,
    resultStatus: card.result_status,
    promotionStatus: card.promotion_status,
    teacherRemarks: card.teacher_remarks,
    principalRemarks: card.principal_remarks,
    verificationToken: card.verification_token,
    publishedAt: card.published_at,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
    subjectMarks,
  }
}

export async function getReportCardByToken(token: string): Promise<DocumentVerificationPayload | null> {
  const supabase = (await createClient()) as any

  const { data: card } = await supabase
    .from('report_cards')
    .select('*, schools(name), students(first_name, last_name, admission_number, classes(name)), examinations(name), academic_sessions(name)')
    .eq('verification_token', token)
    .maybeSingle()

  if (!card || card.status !== 'published') return null

  const sName = card.students ? `${card.students.first_name || ''} ${card.students.last_name || ''}`.trim() : 'Student'

  return {
    isValid: true,
    documentType: 'REPORT_CARD',
    schoolName: card.schools?.name || 'Roshani Public School',
    studentName: sName,
    admissionNumber: card.students?.admission_number || 'N/A',
    academicSessionName: card.academic_sessions?.name,
    className: card.students?.classes?.name,
    examinationName: card.examinations?.name,
    version: card.version || 1,
    status: card.status,
  }
}

export async function getCertificatesForAdmin(): Promise<Certificate[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher', 'Accountant'])) return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data } = await supabase
    .from('certificates')
    .select('*, students(first_name, last_name, admission_number, father_name, classes(name), sections(name)), certificate_types(code, name), profiles!issued_by(full_name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (!data) return []

  return data.map((d: any) => {
    const sName = d.students ? `${d.students.first_name || ''} ${d.students.last_name || ''}`.trim() : 'Student'
    return {
      id: d.id,
      schoolId: d.school_id,
      studentId: d.student_id,
      studentName: sName,
      admissionNumber: d.students?.admission_number || 'N/A',
      className: d.students?.classes?.name || 'Class',
      sectionName: d.students?.sections?.name || '',
      fatherName: d.students?.father_name || 'N/A',
      studentAcademicHistoryId: d.student_academic_history_id,
      certificateTypeId: d.certificate_type_id,
      certificateTypeCode: d.certificate_types?.code,
      certificateTypeName: d.certificate_types?.name,
      certificateNumber: d.certificate_number,
      issueDate: d.issue_date,
      status: d.status,
      revocationReason: d.revocation_reason,
      dataSnapshot: d.data_snapshot || {},
      verificationToken: d.verification_token,
      issuedBy: d.issued_by,
      issuedByName: d.profiles?.full_name || 'Admin',
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }
  })
}

export async function getStudentCertificates(studentId: string): Promise<Certificate[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data } = await supabase
    .from('certificates')
    .select('*, students(first_name, last_name, admission_number, father_name, classes(name), sections(name)), certificate_types(code, name)')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'ISSUED') // ONLY issued certificates visible to student/parent
    .order('created_at', { ascending: false })

  if (!data) return []

  return data.map((d: any) => {
    const sName = d.students ? `${d.students.first_name || ''} ${d.students.last_name || ''}`.trim() : 'Student'
    return {
      id: d.id,
      schoolId: d.school_id,
      studentId: d.student_id,
      studentName: sName,
      admissionNumber: d.students?.admission_number || 'N/A',
      className: d.students?.classes?.name || 'Class',
      sectionName: d.students?.sections?.name || '',
      fatherName: d.students?.father_name || 'N/A',
      studentAcademicHistoryId: d.student_academic_history_id,
      certificateTypeId: d.certificate_type_id,
      certificateTypeCode: d.certificate_types?.code,
      certificateTypeName: d.certificate_types?.name,
      certificateNumber: d.certificate_number,
      issueDate: d.issue_date,
      status: d.status,
      dataSnapshot: d.data_snapshot || {},
      verificationToken: d.verification_token,
      issuedBy: d.issued_by,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }
  })
}

export async function getCertificateByToken(token: string): Promise<DocumentVerificationPayload | null> {
  const supabase = (await createClient()) as any

  const { data: cert } = await supabase
    .from('certificates')
    .select('*, schools(name), certificate_types(name)')
    .eq('verification_token', token)
    .maybeSingle()

  if (!cert || cert.status !== 'ISSUED') return null

  const snapshot = cert.data_snapshot || {}

  return {
    isValid: true,
    documentType: 'CERTIFICATE',
    schoolName: cert.schools?.name || 'Roshani Public School',
    studentName: snapshot.studentName || 'Student',
    admissionNumber: snapshot.admissionNumber || 'N/A',
    className: snapshot.className,
    certificateNumber: cert.certificate_number,
    issueDate: cert.issue_date,
    status: cert.status,
  }
}
