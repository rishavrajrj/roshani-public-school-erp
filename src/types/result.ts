export type MarkAttendanceStatus = 'present' | 'absent' | 'excused' | 'not_appeared'
export type MarkWorkflowStatus = 'draft' | 'submitted' | 'verified' | 'locked'
export type ResultStatus = 'PASS' | 'FAIL' | 'COMPARTMENT' | 'WITHHELD'
export type ResultLifecycleStatus =
  | 'draft'
  | 'calculated'
  | 'pending_approval'
  | 'approved'
  | 'blocked'
  | 'override_released'
  | 'published'
  | 'withheld'
  | 'revoked'

export interface GradingScale {
  id: string
  schoolId: string
  name: string
  minPercentage: number
  maxPercentage: number
  grade: string
  gradePoint: number
  description?: string | null
}

export interface StudentMark {
  id?: string
  schoolId: string
  academicSessionId: string
  examinationId: string
  studentId: string
  studentName?: string
  admissionNumber?: string
  studentAcademicHistoryId?: string | null
  classId: string
  sectionId?: string | null
  subjectId: string
  subjectName?: string
  subjectCode?: string
  examinationSubjectConfigId?: string | null
  attendanceStatus: MarkAttendanceStatus
  theoryMarksObtained: number
  practicalMarksObtained: number
  internalMarksObtained: number
  totalMarksObtained: number
  maximumMarks?: number
  passingMarks?: number
  isPass: boolean
  status: MarkWorkflowStatus
  correctionReason?: string | null
  createdBy: string
  updatedBy?: string | null
  submittedBy?: string | null
  submittedAt?: string | null
  verifiedBy?: string | null
  verifiedAt?: string | null
  lockedBy?: string | null
  lockedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface StudentResult {
  id: string
  schoolId: string
  academicSessionId: string
  academicSessionName?: string
  examinationId: string
  examinationName?: string
  examinationCode?: string
  studentId: string
  studentName?: string
  admissionNumber?: string
  rollNumber?: string
  className?: string
  sectionName?: string
  fatherName?: string
  studentAcademicHistoryId?: string | null
  classId: string
  sectionId?: string | null
  totalMarksObtained: number
  maximumMarks: number
  percentage: number
  resultStatus: ResultStatus
  grade?: string | null
  status: ResultLifecycleStatus
  financialClearanceStatus: 'CLEAR' | 'PARTIAL' | 'OUTSTANDING' | 'WAIVED' | 'ON_HOLD'
  financialOutstandingAmount: number
  financialOverride: boolean
  overrideReason?: string | null
  overrideBy?: string | null
  overrideAt?: string | null
  version: number
  previousResultId?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  publishedBy?: string | null
  publishedAt?: string | null
  revokedBy?: string | null
  revocationReason?: string | null
  createdAt: string
  updatedAt: string
  subjectMarks?: StudentMark[]
}

export interface ResultCalculationSummary {
  totalStudents: number
  calculatedCount: number
  passedCount: number
  failedCount: number
  blockedCount: number
  results: StudentResult[]
}
