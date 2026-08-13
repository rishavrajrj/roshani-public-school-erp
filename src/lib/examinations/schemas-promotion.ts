import { z } from 'zod'

export const promotionDecisionEnum = z.enum([
  'PROMOTED',
  'REPEAT',
  'SUPPLEMENTARY',
  'CONDITIONAL_PROMOTION',
  'PASSED_OUT',
  'TRANSFERRED',
  'WITHDRAWN',
])

export const recommendPromotionSchema = z.object({
  studentId: z.string().uuid(),
  sourceAcademicHistoryId: z.string().uuid(),
  sourceAcademicSessionId: z.string().uuid(),
  targetAcademicSessionId: z.string().uuid(),
  sourceClassId: z.string().uuid(),
  targetClassId: z.string().uuid().optional().nullable(),
  targetSectionId: z.string().uuid().optional().nullable(),
  sourceResultId: z.string().uuid().optional().nullable(),
  decision: promotionDecisionEnum,
  conditional: z.boolean().default(false),
  conditionDescription: z.string().trim().optional(),
  reason: z.string().trim().optional(),
})

export const batchRecommendPromotionSchema = z.object({
  sourceAcademicSessionId: z.string().uuid(),
  targetAcademicSessionId: z.string().uuid(),
  sourceClassId: z.string().uuid(),
  recommendations: z.array(recommendPromotionSchema).min(1),
})

export const approvePromotionSchema = z.object({
  promotionRecordId: z.string().uuid(),
})

export const batchApprovePromotionSchema = z.object({
  promotionRecordIds: z.array(z.string().uuid()).min(1),
})

export const executePromotionSchema = z.object({
  promotionRecordId: z.string().uuid(),
})

export const batchExecutePromotionSchema = z.object({
  promotionRecordIds: z.array(z.string().uuid()).min(1),
})

export const updateStudentLifecycleSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(['active', 'graduated', 'transferred', 'withdrawn', 'expelled']),
  reason: z.string().trim().min(3, 'A minimum 3-character reason is required'),
})

export type RecommendPromotionInput = z.infer<typeof recommendPromotionSchema>
export type BatchRecommendPromotionInput = z.infer<typeof batchRecommendPromotionSchema>
export type ApprovePromotionInput = z.infer<typeof approvePromotionSchema>
export type ExecutePromotionInput = z.infer<typeof executePromotionSchema>
export type BatchExecutePromotionInput = z.infer<typeof batchExecutePromotionSchema>
export type UpdateStudentLifecycleInput = z.infer<typeof updateStudentLifecycleSchema>
