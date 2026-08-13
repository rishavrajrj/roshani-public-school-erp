import { z } from 'zod'

export const createExamTypeSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(20).toUpperCase(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().trim().optional(),
})

export const updateExamTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']),
})

export const createExaminationSchema = z.object({
  academicSessionId: z.string().uuid('Valid Academic Session ID required'),
  examTypeId: z.string().uuid('Valid Exam Type ID required'),
  name: z.string().trim().min(3, 'Examination name required').max(150),
  code: z.string().trim().min(2, 'Examination code required').max(30).toUpperCase(),
  description: z.string().trim().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date required (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid end date required (YYYY-MM-DD)'),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
})

export const updateExaminationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(3).max(150),
  description: z.string().trim().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  changeReason: z.string().trim().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
})

export const configureExamClassesSchema = z.object({
  examinationId: z.string().uuid(),
  classIds: z.array(z.string().uuid()).min(1, 'At least 1 class must be selected'),
})

export const configureSubjectMarkingSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  maximumMarks: z.number().positive('Maximum marks must be positive'),
  passingMarks: z.number().min(0, 'Passing marks cannot be negative'),
  theoryMarks: z.number().min(0).default(0),
  practicalMarks: z.number().min(0).default(0),
  internalMarks: z.number().min(0).default(0),
}).refine((data) => data.passingMarks <= data.maximumMarks, {
  message: 'Passing marks cannot exceed maximum marks',
  path: ['passingMarks'],
}).refine((data) => {
  const sum = data.theoryMarks + data.practicalMarks + data.internalMarks
  return sum === 0 || sum === data.maximumMarks
}, {
  message: 'Sum of theory, practical, and internal marks must equal maximum marks',
  path: ['maximumMarks'],
})

export const createExamScheduleSchema = z.object({
  examinationId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Valid start time required (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Valid end time required (HH:MM)'),
  durationMinutes: z.number().positive('Duration must be positive'),
  venue: z.string().trim().optional(),
  room: z.string().trim().optional(),
  maximumMarks: z.number().positive('Maximum marks required'),
  passingMarks: z.number().min(0, 'Passing marks required'),
  invigilatorProfileIds: z.array(z.string().uuid()).optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine((data) => data.passingMarks <= data.maximumMarks, {
  message: 'Passing marks cannot exceed maximum marks',
  path: ['passingMarks'],
})

export const updateExamScheduleSchema = z.object({
  id: z.string().uuid(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
  durationMinutes: z.number().positive(),
  venue: z.string().trim().optional(),
  room: z.string().trim().optional(),
  maximumMarks: z.number().positive(),
  passingMarks: z.number().min(0),
  changeReason: z.string().trim().min(3, 'A reason (at least 3 characters) is required when modifying a schedule'),
  invigilatorProfileIds: z.array(z.string().uuid()).optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

export const cancelExaminationSchema = z.object({
  examinationId: z.string().uuid(),
  reason: z.string().trim().min(5, 'A detailed cancellation reason (at least 5 characters) is required'),
})

export const publishExaminationSchema = z.object({
  examinationId: z.string().uuid(),
})

export type CreateExamTypeInput = z.infer<typeof createExamTypeSchema>
export type UpdateExamTypeInput = z.infer<typeof updateExamTypeSchema>
export type CreateExaminationInput = z.infer<typeof createExaminationSchema>
export type UpdateExaminationInput = z.infer<typeof updateExaminationSchema>
export type ConfigureExamClassesInput = z.infer<typeof configureExamClassesSchema>
export type ConfigureSubjectMarkingInput = z.infer<typeof configureSubjectMarkingSchema>
export type CreateExamScheduleInput = z.infer<typeof createExamScheduleSchema>
export type UpdateExamScheduleInput = z.infer<typeof updateExamScheduleSchema>
export type CancelExaminationInput = z.infer<typeof cancelExaminationSchema>
export type PublishExaminationInput = z.infer<typeof publishExaminationSchema>
