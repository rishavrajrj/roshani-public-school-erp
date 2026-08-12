import { z } from 'zod'

export const attendanceStatusEnum = z.enum(['present', 'absent', 'late', 'leave'])
export const attendanceSessionStatusEnum = z.enum(['draft', 'submitted', 'locked'])

export const singleStudentAttendanceSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  status: attendanceStatusEnum,
  remarks: z.string().max(255, 'Remarks must not exceed 255 characters').optional().nullable(),
})

export const submitAttendanceSchema = z.object({
  academicSessionId: z.string().uuid('Invalid academic session ID'),
  classId: z.string().uuid('Invalid class ID'),
  sectionId: z.string().uuid('Invalid section ID'),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  records: z.array(singleStudentAttendanceSchema).min(1, 'At least one student record is required'),
})

export const lockAttendanceSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  locked: z.boolean(),
})

export const assignTeacherSchema = z.object({
  teacherProfileId: z.string().uuid('Invalid teacher profile ID'),
  academicSessionId: z.string().uuid('Invalid academic session ID'),
  classId: z.string().uuid('Invalid class ID'),
  sectionId: z.string().uuid('Invalid section ID'),
})

export const updateAttendanceRecordSchema = z.object({
  recordId: z.string().uuid('Invalid record ID'),
  status: attendanceStatusEnum,
  remarks: z.string().max(255).optional().nullable(),
})

export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>
export type LockAttendanceInput = z.infer<typeof lockAttendanceSchema>
export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>
