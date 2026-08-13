export type PromotionDecision =
  | 'PROMOTED'
  | 'REPEAT'
  | 'SUPPLEMENTARY'
  | 'CONDITIONAL_PROMOTION'
  | 'PASSED_OUT'
  | 'TRANSFERRED'
  | 'WITHDRAWN'

export type PromotionWorkflowStatus = 'recommended' | 'approved' | 'executed' | 'rejected'

export interface PromotionPolicy {
  id: string
  schoolId: string
  name: string
  minOverallPercentage: number
  minPassedSubjects: number
  maxFailedSubjectsAllowed: number
  allowSupplementary: boolean
  maxSupplementarySubjects: number
  allowConditionalPromotion: boolean
  requireAttendance: boolean
  minAttendancePercentage?: number | null
  requireFeeClearance: boolean
  requirePrincipalApproval: boolean
  isActive: boolean
}

export interface ClassProgression {
  id: string
  schoolId: string
  sourceClassId: string
  sourceClassName?: string
  targetClassId?: string | null
  targetClassName?: string | null
  isFinalClass: boolean
}

export interface PromotionRecord {
  id: string
  schoolId: string
  studentId: string
  studentName?: string
  admissionNumber?: string
  sourceAcademicHistoryId: string
  sourceAcademicSessionId: string
  sourceAcademicSessionName?: string
  targetAcademicSessionId: string
  targetAcademicSessionName?: string
  sourceClassId: string
  sourceClassName?: string
  targetClassId?: string | null
  targetClassName?: string | null
  targetSectionId?: string | null
  targetSectionName?: string | null
  sourceResultId?: string | null
  decision: PromotionDecision
  conditional: boolean
  conditionDescription?: string | null
  reason?: string | null
  recommendedBy?: string | null
  recommendedByName?: string | null
  recommendedAt?: string | null
  approvedBy?: string | null
  approvedByName?: string | null
  approvedAt?: string | null
  executedBy?: string | null
  executedAt?: string | null
  status: PromotionWorkflowStatus
  createdAt: string
  updatedAt: string
}

export interface PromotionEvaluationResult {
  studentId: string
  studentName: string
  admissionNumber: string
  sourceAcademicHistoryId: string
  sourceClassId: string
  resultId?: string | null
  percentage: number
  overallResultStatus: 'PASS' | 'FAIL' | 'COMPARTMENT' | 'WITHHELD'
  failedSubjectsCount: number
  attendancePercentage?: number | null
  financialClearanceStatus?: string
  recommendedDecision: PromotionDecision
  targetClassId?: string | null
  isFinalClass: boolean
}
