import { z } from 'zod'

export const singleMarkInputSchema = z.object({
  examinationId: z.string().uuid('Valid Examination ID required'),
  studentId: z.string().uuid('Valid Student ID required'),
  classId: z.string().uuid('Valid Class ID required'),
  sectionId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid('Valid Subject ID required'),
  examinationSubjectConfigId: z.string().uuid().optional().nullable(),
  attendanceStatus: z.enum(['present', 'absent', 'excused', 'not_appeared']),
  theoryMarksObtained: z.number().min(0, 'Theory marks cannot be negative').default(0),
  practicalMarksObtained: z.number().min(0, 'Practical marks cannot be negative').default(0),
  internalMarksObtained: z.number().min(0, 'Internal marks cannot be negative').default(0),
  correctionReason: z.string().trim().optional(),
})

export const batchSaveMarksSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid(),
  marks: z.array(singleMarkInputSchema).min(1, 'At least 1 student mark required'),
})

export const submitMarksSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid(),
})

export const correctSubmittedMarkSchema = z.object({
  markId: z.string().uuid('Valid Mark ID required'),
  attendanceStatus: z.enum(['present', 'absent', 'excused', 'not_appeared']),
  theoryMarksObtained: z.number().min(0),
  practicalMarksObtained: z.number().min(0),
  internalMarksObtained: z.number().min(0),
  reason: z.string().trim().min(3, 'A minimum 3-character correction reason is required'),
})

export const lockMarksSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
})

export const unlockMarksSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  reason: z.string().trim().min(3, 'A reason is required to unlock marks'),
})

export const calculateResultsSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
})

export const approveResultsSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
})

export const overrideResultFinancialHoldSchema = z.object({
  resultId: z.string().uuid('Valid Result ID required'),
  reason: z.string().trim().min(3, 'A minimum 3-character reason is required for financial override'),
})

export const publishResultsSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
})

export const revokeResultSchema = z.object({
  resultId: z.string().uuid('Valid Result ID required'),
  reason: z.string().trim().min(5, 'A minimum 5-character reason is required for result revocation'),
})

export type SingleMarkInput = z.infer<typeof singleMarkInputSchema>
export type BatchSaveMarksInput = z.infer<typeof batchSaveMarksSchema>
export type SubmitMarksInput = z.infer<typeof submitMarksSchema>
export type CorrectSubmittedMarkInput = z.infer<typeof correctSubmittedMarkSchema>
export type LockMarksInput = z.infer<typeof lockMarksSchema>
export type UnlockMarksInput = z.infer<typeof unlockMarksSchema>
export type CalculateResultsInput = z.infer<typeof calculateResultsSchema>
export type ApproveResultsInput = z.infer<typeof approveResultsSchema>
export type OverrideResultFinancialHoldInput = z.infer<typeof overrideResultFinancialHoldSchema>
export type PublishResultsInput = z.infer<typeof publishResultsSchema>
export type RevokeResultInput = z.infer<typeof revokeResultSchema>
