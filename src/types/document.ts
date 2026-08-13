import type { StudentMark } from './result'

export type ReportCardStatus =
  | 'draft'
  | 'generated'
  | 'review_required'
  | 'approved'
  | 'published'
  | 'revoked'

export type CertificateStatusCode = 'ISSUED' | 'REVOKED'
export type CertificateTypeCode = 'TC' | 'BONAFIDE' | 'CHARACTER' | 'COMPLETION' | 'STUDY'

export interface ReportCardTemplate {
  id: string
  schoolId: string
  name: string
  title: string
  schoolNameOverride?: string | null
  headerAddress?: string | null
  affiliationText?: string | null
  principalTitle?: string | null
  teacherSignatureLabel?: string | null
  principalSignatureLabel?: string | null
  showAttendance: boolean
  showRemarks: boolean
  isDefault: boolean
}

export interface ReportCard {
  id: string
  schoolId: string
  academicSessionId: string
  academicSessionName?: string
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
  examinationId: string
  examinationName?: string
  resultId?: string | null
  templateId?: string | null
  version: number
  previousReportCardId?: string | null
  status: ReportCardStatus
  attendanceDays: number
  presentDays: number
  absentDays: number
  leaveDays: number
  attendancePercentage: number
  overallPercentage: number
  overallGrade?: string | null
  resultStatus: string
  promotionStatus: string
  teacherRemarks?: string | null
  principalRemarks?: string | null
  correctionReason?: string | null
  verificationToken: string
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

export interface CertificateType {
  id: string
  schoolId: string
  code: CertificateTypeCode
  name: string
  prefix: string
  description?: string | null
}

export interface Certificate {
  id: string
  schoolId: string
  studentId: string
  studentName?: string
  admissionNumber?: string
  className?: string
  sectionName?: string
  fatherName?: string
  studentAcademicHistoryId?: string | null
  certificateTypeId: string
  certificateTypeCode?: CertificateTypeCode
  certificateTypeName?: string
  certificateNumber: string
  issueDate: string
  status: CertificateStatusCode
  revocationReason?: string | null
  dataSnapshot: Record<string, any>
  verificationToken: string
  issuedBy: string
  issuedByName?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentVerificationPayload {
  isValid: boolean
  documentType: 'REPORT_CARD' | 'CERTIFICATE'
  schoolName: string
  studentName: string
  admissionNumber: string
  academicSessionName?: string
  className?: string
  examinationName?: string
  certificateNumber?: string
  issueDate?: string
  version?: number
  status: string
}
