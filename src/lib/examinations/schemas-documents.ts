import { z } from 'zod'

export const generateReportCardSchema = z.object({
  examinationId: z.string().uuid(),
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
  templateId: z.string().uuid().optional().nullable(),
  teacherRemarks: z.string().trim().optional(),
})

export const batchGenerateReportCardsSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
  templateId: z.string().uuid().optional().nullable(),
})

export const updateTeacherRemarksSchema = z.object({
  reportCardId: z.string().uuid(),
  teacherRemarks: z.string().trim().min(1, 'Remarks text required'),
})

export const approveReportCardSchema = z.object({
  reportCardId: z.string().uuid(),
  principalRemarks: z.string().trim().optional(),
})

export const publishReportCardSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
})

export const correctReportCardSchema = z.object({
  reportCardId: z.string().uuid(),
  teacherRemarks: z.string().trim().optional(),
  principalRemarks: z.string().trim().optional(),
  reason: z.string().trim().min(3, 'A minimum 3-character correction reason is required'),
})

export const issueCertificateSchema = z.object({
  studentId: z.string().uuid(),
  certificateTypeCode: z.enum(['TC', 'BONAFIDE', 'CHARACTER', 'COMPLETION', 'STUDY']),
  academicYear: z.number().int().min(2020).max(2050),
  reason: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  conductRemarks: z.string().trim().optional(),
})

export const revokeCertificateSchema = z.object({
  certificateId: z.string().uuid(),
  reason: z.string().trim().min(5, 'A minimum 5-character reason is required for certificate revocation'),
})

export type GenerateReportCardInput = z.infer<typeof generateReportCardSchema>
export type BatchGenerateReportCardsInput = z.infer<typeof batchGenerateReportCardsSchema>
export type UpdateTeacherRemarksInput = z.infer<typeof updateTeacherRemarksSchema>
export type ApproveReportCardInput = z.infer<typeof approveReportCardSchema>
export type PublishReportCardInput = z.infer<typeof publishReportCardSchema>
export type CorrectReportCardInput = z.infer<typeof correctReportCardSchema>
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>
export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>
