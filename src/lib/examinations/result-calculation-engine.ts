import { createClient } from '@/lib/supabase/server'
import type { StudentMark, ResultStatus } from '@/types/result'

export interface CalculationResultPayload {
  studentId: string
  examinationId: string
  classId: string
  sectionId?: string | null
  academicHistoryId?: string | null
  totalMarksObtained: number
  maximumMarks: number
  percentage: number
  resultStatus: ResultStatus
  grade: string
  subjectMarks: StudentMark[]
}

/**
 * Deterministic Result Calculation Engine.
 * Evaluates subject totals, percentage, subject pass/fail, overall percentage,
 * pass/fail status, and resolves letter grade from grading_scales.
 * STRICT RULE: Does NOT promote students or alter enrollment.
 */
export async function calculateStudentResultEngine(
  schoolId: string,
  examinationId: string,
  studentId: string,
  classId: string
): Promise<CalculationResultPayload | null> {
  const supabase = (await createClient()) as any

  // 1. Fetch Subject Configurations for Class & Examination
  const { data: configs } = await supabase
    .from('examination_subject_configs')
    .select('*, subjects(id, name, code)')
    .eq('examination_id', examinationId)
    .eq('class_id', classId)
    .eq('school_id', schoolId)

  if (!configs || configs.length === 0) return null

  // 2. Fetch Student Academic History for Session
  const { data: history } = await supabase
    .from('student_academic_history')
    .select('id, section_id')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .eq('school_id', schoolId)
    .maybeSingle()

  // 3. Fetch Entered Marks for Student in Exam
  const { data: rawMarks } = await supabase
    .from('student_marks')
    .select('*')
    .eq('examination_id', examinationId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)

  const marksMap = new Map<string, any>()
  if (rawMarks) {
    for (const m of rawMarks) {
      marksMap.set(m.subject_id, m)
    }
  }

  // 4. Fetch Grading Scale for School
  const { data: scales } = await supabase
    .from('grading_scales')
    .select('*')
    .eq('school_id', schoolId)
    .order('min_percentage', { ascending: false })

  let totalObtained = 0
  let totalMaximum = 0
  let hasFailedSubject = false
  const evaluatedMarks: StudentMark[] = []

  for (const cfg of configs) {
    const sId = cfg.subject_id
    const maxMarks = Number(cfg.maximum_marks) || 100
    const passMarks = Number(cfg.passing_marks) || 33

    totalMaximum += maxMarks

    const markEntry = marksMap.get(sId)
    let obtained = 0
    let attendance: any = 'not_appeared'
    let isPass = false
    let theory = 0
    let practical = 0
    let internal = 0

    if (markEntry) {
      attendance = markEntry.attendance_status || 'present'
      if (attendance === 'present') {
        theory = Number(markEntry.theory_marks_obtained) || 0
        practical = Number(markEntry.practical_marks_obtained) || 0
        internal = Number(markEntry.internal_marks_obtained) || 0
        obtained = Number(markEntry.total_marks_obtained) || (theory + practical + internal)
        isPass = obtained >= passMarks
      } else {
        obtained = 0
        isPass = false
      }
    } else {
      attendance = 'not_appeared'
      obtained = 0
      isPass = false
    }

    if (!isPass) {
      hasFailedSubject = true
    }

    totalObtained += obtained

    evaluatedMarks.push({
      id: markEntry?.id,
      schoolId,
      academicSessionId: cfg.academic_session_id || '',
      examinationId,
      studentId,
      studentAcademicHistoryId: history?.id,
      classId,
      sectionId: history?.section_id,
      subjectId: sId,
      subjectName: cfg.subjects?.name,
      subjectCode: cfg.subjects?.code,
      examinationSubjectConfigId: cfg.id,
      attendanceStatus: attendance,
      theoryMarksObtained: theory,
      practicalMarksObtained: practical,
      internalMarksObtained: internal,
      totalMarksObtained: obtained,
      maximumMarks: maxMarks,
      passingMarks: passMarks,
      isPass,
      status: markEntry?.status || 'draft',
      createdBy: markEntry?.created_by || '',
    })
  }

  const percentage = totalMaximum > 0 ? Number(((totalObtained / totalMaximum) * 100).toFixed(2)) : 0

  // Determine Overall Pass/Fail Status
  const resultStatus: ResultStatus = hasFailedSubject ? 'FAIL' : 'PASS'

  // Resolve Grade from grading_scales
  let grade = 'E'
  if (scales && scales.length > 0) {
    for (const sc of scales) {
      if (percentage >= Number(sc.min_percentage) && percentage <= Number(sc.max_percentage)) {
        grade = sc.grade
        break
      }
    }
  } else {
    if (percentage >= 90) grade = 'A1'
    else if (percentage >= 80) grade = 'A2'
    else if (percentage >= 70) grade = 'B1'
    else if (percentage >= 60) grade = 'B2'
    else if (percentage >= 50) grade = 'C1'
    else if (percentage >= 40) grade = 'C2'
    else if (percentage >= 33) grade = 'D'
    else grade = 'E'
  }

  return {
    studentId,
    examinationId,
    classId,
    sectionId: history?.section_id || null,
    academicHistoryId: history?.id || null,
    totalMarksObtained: totalObtained,
    maximumMarks: totalMaximum,
    percentage,
    resultStatus,
    grade,
    subjectMarks: evaluatedMarks,
  }
}
