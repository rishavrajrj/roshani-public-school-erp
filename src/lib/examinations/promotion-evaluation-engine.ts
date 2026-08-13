import { createClient } from '@/lib/supabase/server'
import { getFinancialClearance } from '@/lib/fees/clearance-service'
import type { PromotionEvaluationResult, PromotionDecision } from '@/types/promotion'

export async function evaluateStudentPromotionEngine(
  schoolId: string,
  sourceSessionId: string,
  examinationId: string,
  studentId: string,
  sourceClassId: string
): Promise<PromotionEvaluationResult | null> {
  const supabase = (await createClient()) as any

  // 1. Fetch Student Metadata
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, admission_number')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .single()

  if (!student) return null

  // 2. Fetch Academic History for Session
  const { data: history } = await supabase
    .from('student_academic_history')
    .select('id')
    .eq('student_id', studentId)
    .eq('academic_session_id', sourceSessionId)
    .eq('class_id', sourceClassId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (!history) return null

  // 3. Fetch Final Result Record
  const { data: result } = await supabase
    .from('student_results')
    .select('*')
    .eq('examination_id', examinationId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .neq('status', 'revoked')
    .maybeSingle()

  // 4. Fetch Subject Marks for Failed Count
  const { data: marks } = await supabase
    .from('student_marks')
    .select('is_pass')
    .eq('examination_id', examinationId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)

  const failedCount = marks ? marks.filter((m: any) => m.is_pass === false).length : 0

  // 5. Fetch Active Promotion Policy
  const { data: policy } = await supabase
    .from('promotion_policies')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .maybeSingle()

  // 6. Fetch Class Progression Mapping
  const { data: prog } = await supabase
    .from('class_progressions')
    .select('target_class_id, is_final_class')
    .eq('school_id', schoolId)
    .eq('source_class_id', sourceClassId)
    .maybeSingle()

  const isFinalClass = prog ? Boolean(prog.is_final_class) : false
  const targetClassId = prog ? prog.target_class_id : null

  // 7. Check Financial Clearance if Policy Enabled
  let clearanceStatus = 'CLEAR'
  if (policy?.require_fee_clearance) {
    const clearance = await getFinancialClearance(studentId, sourceSessionId)
    clearanceStatus = clearance.status
  }

  // 8. Determine Recommended Decision
  const overallStatus = result ? result.result_status : 'FAIL'
  const percentage = result ? Number(result.percentage) : 0
  const isExamPass = overallStatus === 'PASS'

  let decision: PromotionDecision = 'REPEAT'

  if (isFinalClass && isExamPass) {
    decision = 'PASSED_OUT'
  } else if (isExamPass && (!policy?.require_fee_clearance || clearanceStatus === 'CLEAR' || clearanceStatus === 'WAIVED')) {
    decision = 'PROMOTED'
  } else if (!isExamPass && policy?.allow_supplementary && failedCount <= (policy?.max_supplementary_subjects || 2)) {
    decision = 'SUPPLEMENTARY'
  } else if (!isExamPass && policy?.allow_conditional_promotion) {
    decision = 'CONDITIONAL_PROMOTION'
  } else {
    decision = 'REPEAT'
  }

  const sName = `${student.first_name || ''} ${student.last_name || ''}`.trim()

  return {
    studentId,
    studentName: sName,
    admissionNumber: student.admission_number || 'N/A',
    sourceAcademicHistoryId: history.id,
    sourceClassId,
    resultId: result?.id || null,
    percentage,
    overallResultStatus: overallStatus,
    failedSubjectsCount: failedCount,
    financialClearanceStatus: clearanceStatus,
    recommendedDecision: decision,
    targetClassId,
    isFinalClass,
  }
}
