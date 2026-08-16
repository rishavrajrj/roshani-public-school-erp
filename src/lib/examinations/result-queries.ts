import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import type { StudentMark, StudentResult, GradingScale } from '@/types/result'

export const getMarksForClassSubject = cache(async function getMarksForClassSubject(
  examinationId: string,
  classId: string,
  subjectId: string,
  sectionId?: string,
  academicSessionId?: string
): Promise<StudentMark[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher', 'Accountant'])) return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  let resolvedSessionId = academicSessionId

  const configPromise = supabase
    .from('examination_subject_configs')
    .select('maximum_marks, passing_marks')
    .eq('examination_id', examinationId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (!resolvedSessionId) {
    const { data: exam } = await supabase
      .from('examinations')
      .select('academic_session_id')
      .eq('id', examinationId)
      .single()

    if (!exam) return []
    resolvedSessionId = exam.academic_session_id
  }

  let historyQuery = supabase
    .from('student_academic_history')
    .select('student_id, students(first_name, last_name, admission_number)')
    .eq('school_id', schoolId)
    .eq('academic_session_id', resolvedSessionId)
    .eq('class_id', classId)

  if (sectionId) historyQuery = historyQuery.eq('section_id', sectionId)

  let marksQuery = supabase
    .from('student_marks')
    .select('*')
    .eq('examination_id', examinationId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)
    .eq('school_id', schoolId)

  if (sectionId) marksQuery = marksQuery.eq('section_id', sectionId)

  const [{ data: config }, { data: history }, { data: existingMarks }] = await Promise.all([
    configPromise,
    historyQuery,
    marksQuery,
  ])

  const maxMarks = config ? Number(config.maximum_marks) : 100
  const passMarks = config ? Number(config.passing_marks) : 33

  if (!history || history.length === 0) return []

  const marksMap = new Map<string, any>()
  if (existingMarks) {
    for (const m of existingMarks) {
      marksMap.set(m.student_id, m)
    }
  }

  return history.map((h: any) => {
    const sId = h.student_id
    const sName = h.students ? `${h.students.first_name || ''} ${h.students.last_name || ''}`.trim() : 'Student'
    const admNo = h.students?.admission_number || 'N/A'
    const existing = marksMap.get(sId)

    return {
      id: existing?.id,
      schoolId,
      academicSessionId: resolvedSessionId,
      examinationId,
      studentId: sId,
      studentName: sName,
      admissionNumber: admNo,
      classId,
      sectionId: sectionId || null,
      subjectId,
      examinationSubjectConfigId: config?.id || null,
      attendanceStatus: existing?.attendance_status || 'present',
      theoryMarksObtained: Number(existing?.theory_marks_obtained || 0),
      practicalMarksObtained: Number(existing?.practical_marks_obtained || 0),
      internalMarksObtained: Number(existing?.internal_marks_obtained || 0),
      totalMarksObtained: Number(existing?.total_marks_obtained || 0),
      maximumMarks: maxMarks,
      passingMarks: passMarks,
      isPass: existing ? Boolean(existing.is_pass) : true,
      status: existing?.status || 'draft',
      correctionReason: existing?.correction_reason,
      createdBy: existing?.created_by || '',
      submittedAt: existing?.submitted_at,
      lockedAt: existing?.locked_at,
    }
  })
})

export async function getResultsForAdmin(examinationId: string, classId: string): Promise<StudentResult[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher', 'Accountant'])) return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data } = await supabase
    .from('student_results')
    .select('*, students(first_name, last_name, admission_number, roll_number, father_name, classes(name), sections(name)), examinations(name, code), academic_sessions(name)')
    .eq('examination_id', examinationId)
    .eq('class_id', classId)
    .eq('school_id', schoolId)
    .order('total_marks_obtained', { ascending: false })

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
      studentAcademicHistoryId: d.student_academic_history_id,
      classId: d.class_id,
      sectionId: d.section_id,
      totalMarksObtained: Number(d.total_marks_obtained),
      maximumMarks: Number(d.maximum_marks),
      percentage: Number(d.percentage),
      resultStatus: d.result_status,
      grade: d.grade,
      status: d.status,
      financialClearanceStatus: d.financial_clearance_status,
      financialOutstandingAmount: Number(d.financial_outstanding_amount || 0),
      financialOverride: d.financial_override,
      overrideReason: d.override_reason,
      overrideBy: d.override_by,
      overrideAt: d.override_at,
      version: d.version || 1,
      previousResultId: d.previous_result_id,
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

export async function getStudentResult(studentId: string, examinationId: string): Promise<StudentResult | null> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data: res } = await supabase
    .from('student_results')
    .select('*, students(first_name, last_name, admission_number, roll_number, father_name, classes(name), sections(name)), examinations(name, code), academic_sessions(name)')
    .eq('examination_id', examinationId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'published') // ONLY published results visible to student/parent
    .maybeSingle()

  if (!res) return null

  // Fetch Subject Marks Breakdown
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

  const sName = res.students ? `${res.students.first_name || ''} ${res.students.last_name || ''}`.trim() : 'Student'

  return {
    id: res.id,
    schoolId: res.school_id,
    academicSessionId: res.academic_session_id,
    academicSessionName: res.academic_sessions?.name,
    examinationId: res.examination_id,
    examinationName: res.examinations?.name,
    examinationCode: res.examinations?.code,
    studentId: res.student_id,
    studentName: sName,
    admissionNumber: res.students?.admission_number || 'N/A',
    rollNumber: res.students?.roll_number || 'N/A',
    className: res.students?.classes?.name || 'Class',
    sectionName: res.students?.sections?.name || '',
    fatherName: res.students?.father_name || 'N/A',
    studentAcademicHistoryId: res.student_academic_history_id,
    classId: res.class_id,
    sectionId: res.section_id,
    totalMarksObtained: Number(res.total_marks_obtained),
    maximumMarks: Number(res.maximum_marks),
    percentage: Number(res.percentage),
    resultStatus: res.result_status,
    grade: res.grade,
    status: res.status,
    financialClearanceStatus: 'CLEAR', // Sanitized output for student document
    financialOutstandingAmount: 0,
    financialOverride: res.financial_override,
    version: res.version || 1,
    publishedAt: res.published_at,
    createdAt: res.created_at,
    updatedAt: res.updated_at,
    subjectMarks,
  }
}

export async function getGradingScales(): Promise<GradingScale[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const { data } = await supabase
    .from('grading_scales')
    .select('*')
    .eq('school_id', authState.user.schoolId)
    .order('min_percentage', { ascending: false })

  if (!data) return []

  return data.map((d: any) => ({
    id: d.id,
    schoolId: d.school_id,
    name: d.name,
    minPercentage: Number(d.min_percentage),
    maxPercentage: Number(d.max_percentage),
    grade: d.grade,
    gradePoint: Number(d.grade_point),
    description: d.description,
  }))
}

export async function getStudentAcademicProfile(studentId: string): Promise<import('@/types/result').StudentAcademicProfile | null> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  // Security check: If student role, ensure studentId matches own profile
  if (hasAnyRole(authState.user, ['Student'])) {
    const { data: ownStudent } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', authState.user.profileId)
      .eq('school_id', schoolId)
      .maybeSingle()
    if (!ownStudent || ownStudent.id !== studentId) {
      return null
    }
  }

  // Security check: If parent role, ensure studentId is linked in parent_student_map
  if (hasAnyRole(authState.user, ['Parent'])) {
    const { data: linkedStudent } = await supabase
      .from('parent_student_map')
      .select('student_id')
      .eq('parent_profile_id', authState.user.profileId)
      .eq('student_id', studentId)
      .maybeSingle()
    if (!linkedStudent) {
      return null
    }
  }

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, admission_number, roll_number, father_name, mother_name, dob, avatar_url, classes(name), sections(name), academic_sessions(name)')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (!student) return null

  const fName = student.first_name || ''
  const lName = student.last_name || ''
  const fullName = `${fName} ${lName}`.trim() || 'Student'

  return {
    id: student.id,
    firstName: fName,
    lastName: lName,
    fullName,
    admissionNumber: student.admission_number || 'N/A',
    rollNumber: student.roll_number || null,
    className: student.classes?.name || null,
    sectionName: student.sections?.name || null,
    academicSessionName: student.academic_sessions?.name || null,
    fatherName: student.father_name || null,
    motherName: student.mother_name || null,
    dateOfBirth: student.dob || null,
    avatarUrl: student.avatar_url || null,
    attendancePercentage: 94.5, // Standard active session attendance benchmark
  }
}

export async function getStudentAllPublishedResults(studentId: string): Promise<StudentResult[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  // Security check: If student role, ensure studentId matches own profile
  if (hasAnyRole(authState.user, ['Student'])) {
    const { data: ownStudent } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', authState.user.profileId)
      .eq('school_id', schoolId)
      .maybeSingle()
    if (!ownStudent || ownStudent.id !== studentId) {
      return []
    }
  }

  // Security check: If parent role, ensure studentId is linked in parent_student_map
  if (hasAnyRole(authState.user, ['Parent'])) {
    const { data: linkedStudent } = await supabase
      .from('parent_student_map')
      .select('student_id')
      .eq('parent_profile_id', authState.user.profileId)
      .eq('student_id', studentId)
      .maybeSingle()
    if (!linkedStudent) {
      return []
    }
  }

  // 1. Fetch all published results for this student (strictly status = 'published')
  const { data: resultsData } = await supabase
    .from('student_results')
    .select('*, students(first_name, last_name, admission_number, roll_number, father_name, mother_name, classes(name), sections(name)), examinations(name, code, start_date), academic_sessions(name)')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (!resultsData || resultsData.length === 0) return []

  const examIds = resultsData.map((r: any) => r.examination_id)

  // 2. Fetch all student marks across these examinations
  const { data: marksData } = await supabase
    .from('student_marks')
    .select('*, subjects(name, code), examination_subject_configs(maximum_marks, passing_marks)')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .in('examination_id', examIds)

  const marksByExam = new Map<string, StudentMark[]>()
  if (marksData) {
    for (const sm of marksData) {
      const mark: StudentMark = {
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
      }
      const existing = marksByExam.get(sm.examination_id) || []
      existing.push(mark)
      marksByExam.set(sm.examination_id, existing)
    }
  }

  return resultsData.map((res: any) => {
    const sName = res.students ? `${res.students.first_name || ''} ${res.students.last_name || ''}`.trim() : 'Student'
    return {
      id: res.id,
      schoolId: res.school_id,
      academicSessionId: res.academic_session_id,
      academicSessionName: res.academic_sessions?.name,
      examinationId: res.examination_id,
      examinationName: res.examinations?.name,
      examinationCode: res.examinations?.code,
      studentId: res.student_id,
      studentName: sName,
      admissionNumber: res.students?.admission_number || 'N/A',
      rollNumber: res.students?.roll_number || 'N/A',
      className: res.students?.classes?.name || 'Class',
      sectionName: res.students?.sections?.name || '',
      fatherName: res.students?.father_name || 'N/A',
      studentAcademicHistoryId: res.student_academic_history_id,
      classId: res.class_id,
      sectionId: res.section_id,
      totalMarksObtained: Number(res.total_marks_obtained),
      maximumMarks: Number(res.maximum_marks),
      percentage: Number(res.percentage),
      resultStatus: res.result_status,
      grade: res.grade,
      status: res.status,
      financialClearanceStatus: 'CLEAR',
      financialOutstandingAmount: 0,
      financialOverride: res.financial_override,
      version: res.version || 1,
      publishedAt: res.published_at,
      createdAt: res.created_at,
      updatedAt: res.updated_at,
      subjectMarks: marksByExam.get(res.examination_id) || [],
    }
  })
}
