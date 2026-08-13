import { z } from 'zod'

export const generateAdmitCardSchema = z.object({
  examinationId: z.string().uuid('Valid Examination ID required'),
  studentId: z.string().uuid('Valid Student ID required'),
})

export const bulkGenerateAdmitCardsSchema = z.object({
  examinationId: z.string().uuid('Valid Examination ID required'),
  classId: z.string().uuid('Valid Class ID required'),
  sectionId: z.string().uuid().optional().nullable(),
})

export const overrideFinancialHoldSchema = z.object({
  admitCardId: z.string().uuid('Valid Admit Card ID required'),
  reason: z.string().trim().min(3, 'A minimum 3-character reason is required for financial override'),
})

export const publishAdmitCardSchema = z.object({
  admitCardId: z.string().uuid('Valid Admit Card ID required'),
})

export const bulkPublishAdmitCardsSchema = z.object({
  examinationId: z.string().uuid('Valid Examination ID required'),
  classId: z.string().uuid().optional(),
})

export const revokeAdmitCardSchema = z.object({
  admitCardId: z.string().uuid('Valid Admit Card ID required'),
  reason: z.string().trim().min(5, 'A minimum 5-character reason is required for revocation'),
})

export const regenerateAdmitCardSchema = z.object({
  oldAdmitCardId: z.string().uuid('Valid Admit Card ID required'),
  reason: z.string().trim().min(3, 'A reason is required for Admit Card regeneration'),
})

export type GenerateAdmitCardInput = z.infer<typeof generateAdmitCardSchema>
export type BulkGenerateAdmitCardsInput = z.infer<typeof bulkGenerateAdmitCardsSchema>
export type OverrideFinancialHoldInput = z.infer<typeof overrideFinancialHoldSchema>
export type PublishAdmitCardInput = z.infer<typeof publishAdmitCardSchema>
export type BulkPublishAdmitCardsInput = z.infer<typeof bulkPublishAdmitCardsSchema>
export type RevokeAdmitCardInput = z.infer<typeof revokeAdmitCardSchema>
export type RegenerateAdmitCardInput = z.infer<typeof regenerateAdmitCardSchema>
