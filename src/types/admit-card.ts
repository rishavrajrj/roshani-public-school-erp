export type AdmitCardStatus =
  | 'draft'
  | 'eligible'
  | 'blocked'
  | 'override_released'
  | 'published'
  | 'revoked'
  | 'superseded'

export type CandidateEligibilityStatus = 'eligible' | 'ineligible'

export type ReplacementReason =
  | 'Exam Date Changed'
  | 'Exam Room Changed'
  | 'Subject Added'
  | 'Subject Removed'
  | 'Student Information Corrected'
  | 'Photograph Updated'
  | 'Administrative Correction'
  | 'Other'

export interface AdmitCard {
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
  motherName?: string
  dateOfBirth?: string | null
  gender?: string | null
  house?: string | null
  examinationCenter?: string
  examCenterRoom?: string
  issueDate?: string
  photoUrl?: string | null
  studentAcademicHistoryId?: string | null
  admitCardNumber: string
  version: number
  documentFingerprint: string
  verificationToken: string
  status: AdmitCardStatus
  financialClearanceStatus: 'CLEAR' | 'PARTIAL' | 'OUTSTANDING' | 'WAIVED' | 'ON_HOLD'
  financialOutstandingAmount: number
  financialOverride: boolean
  overrideReason?: string | null
  overrideBy?: string | null
  overrideByName?: string | null
  overrideAt?: string | null
  candidateEligibilityStatus: CandidateEligibilityStatus
  eligibilityRemarks?: string | null
  publishedAt?: string | null
  publishedBy?: string | null
  publishedByName?: string | null
  revokedAt?: string | null
  revokedBy?: string | null
  revocationReason?: string | null
  supersededAt?: string | null
  supersededBy?: string | null
  replacementReason?: string | null
  previousAdmitCardId?: string | null
  dataSnapshot?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  timetable?: Array<{
    sNo?: number
    date: string
    day?: string
    subjectName: string
    subjectCode: string
    subjectType?: string
    startTime: string
    endTime: string
    durationMinutes: number
    room?: string | null
    venue?: string | null
    maximumMarks: number
    status?: string
  }>
}

export interface CandidateEligibilityResult {
  isEligible: boolean
  studentId: string
  studentName: string
  admissionNumber: string
  className: string
  sectionName?: string
  academicHistoryId?: string
  reasons: string[]
  financialClearanceStatus: 'CLEAR' | 'PARTIAL' | 'OUTSTANDING' | 'WAIVED' | 'ON_HOLD'
  totalOutstanding: number
}

export interface BulkGenerationSummary {
  totalProcessed: number
  generatedEligible: number
  generatedBlocked: number
  skippedAlreadyPublished: number
  ineligibleCount: number
  results: Array<{
    studentId: string
    studentName: string
    admissionNumber: string
    status: AdmitCardStatus
    financialClearanceStatus: string
    outstandingAmount: number
    message: string
  }>
}

export interface AdmitCardOverridePayload {
  admitCardId: string
  reason: string
}

export interface ReissueAdmitCardPayload {
  admitCardId: string
  replacementReason: ReplacementReason
  customReasonExplanation?: string
}
