import { createClient } from '@/lib/supabase/server'
import { getFinancialClearance } from '@/lib/fees/clearance-service'
import type { CandidateEligibilityResult } from '@/types/admit-card'

const EXITED_STATUSES = ['graduated', 'transferred', 'withdrawn', 'left_other', 'expelled']

/**
 * Server-Side Candidate Eligibility Verification Service.
 * Verifies academic session enrollment, class applicability, exited student exclusion,
 * repeating student context, subject configs, and financial clearance gate.
 */
export async function checkCandidateEligibility(
  studentId: string,
  examinationId: string
): Promise<CandidateEligibilityResult> {
  const supabase = (await createClient()) as any

  const reasons: string[] = []

  // 1. Fetch Examination Master
  const { data: exam, error: examError } = await supabase
    .from('examinations')
    .select('*, academic_sessions(id, name, school_id)')
    .eq('id', examinationId)
    .single()

  if (examError || !exam) {
    return {
      isEligible: false,
      studentId,
      studentName: 'Unknown',
      admissionNumber: 'N/A',
      className: 'N/A',
      reasons: ['Examination master record not found'],
      financialClearanceStatus: 'OUTSTANDING',
      totalOutstanding: 0,
    }
  }

  // 2. Fetch Student Profile & Current Status
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*, profiles(full_name)')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    return {
      isEligible: false,
      studentId,
      studentName: 'Unknown',
      admissionNumber: 'N/A',
      className: 'N/A',
      reasons: ['Student record not found'],
      financialClearanceStatus: 'OUTSTANDING',
      totalOutstanding: 0,
    }
  }

  const studentName = student.first_name ? `${student.first_name} ${student.last_name || ''}`.trim() : student.profiles?.full_name || 'Student'
  const admissionNumber = student.admission_number || 'N/A'

  // Check 1: School Isolation
  if (student.school_id !== exam.school_id) {
    reasons.push('Student does not belong to the examination school')
  }

  // Check 2: Exited Student Exclusion
  if (EXITED_STATUSES.includes(student.status?.toLowerCase())) {
    reasons.push(`Student enrollment status is '${student.status}'. Exited students cannot receive current Admit Cards.`)
  }

  // Check 3: Session Enrollment & Academic History (Authoritative)
  const { data: academicHistory } = await supabase
    .from('student_academic_history')
    .select('*, classes(name), sections(name)')
    .eq('student_id', studentId)
    .eq('academic_session_id', exam.academic_session_id)
    .eq('school_id', exam.school_id)
    .single()

  if (!academicHistory) {
    reasons.push(`No active academic enrollment history found for student in academic session ${exam.academic_sessions?.name}`)
  }

  const className = academicHistory?.classes?.name || 'Unassigned'
  const sectionName = academicHistory?.sections?.name || 'Unassigned'
  const classId = academicHistory?.class_id

  // Check 4: Class Applicability in Examination
  if (classId) {
    const { data: examClass } = await supabase
      .from('examination_classes')
      .select('id')
      .eq('examination_id', examinationId)
      .eq('class_id', classId)
      .single()

    if (!examClass) {
      reasons.push(`Examination '${exam.name}' is not applicable to Class '${className}'`)
    }
  }

  // Check 5: Examination Status
  if (exam.status === 'cancelled') {
    reasons.push('Examination has been cancelled')
  }

  // Check 6: Subject Configurations Exist for Class
  if (classId) {
    const { data: subjectConfigs } = await supabase
      .from('examination_subject_configs')
      .select('id')
      .eq('examination_id', examinationId)
      .eq('class_id', classId)

    if (!subjectConfigs || subjectConfigs.length === 0) {
      reasons.push(`No subject marking rules configured for Class '${className}' in this examination`)
    }
  }

  // Check Financial Clearance Gate using authoritative clearance service
  const clearance = await getFinancialClearance(studentId, exam.academic_session_id)

  const isEligible = reasons.length === 0

  return {
    isEligible,
    studentId,
    studentName,
    admissionNumber,
    className,
    sectionName,
    academicHistoryId: academicHistory?.id,
    reasons,
    financialClearanceStatus: clearance.status,
    totalOutstanding: clearance.totalOutstanding,
  }
}
