import { z } from 'zod'

export const leaveDurationTypeEnum = z.enum(['full_day', 'half_day_morning', 'half_day_afternoon'])

export const createLeaveApplicationSchema = z
  .object({
    academicSessionId: z.string().uuid('Invalid academic session ID').optional(),
    studentId: z.string().uuid('Invalid student ID').optional().nullable(),
    leaveTypeId: z.string().uuid('Invalid leave type ID'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format'),
    durationType: leaveDurationTypeEnum.default('full_day'),
    reason: z.string().min(3, 'Reason must be at least 3 characters'),
    documentPath: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return start <= end
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['endDate'],
    }
  )

export const processLeaveApprovalSchema = z.object({
  leaveApplicationId: z.string().uuid('Invalid leave application ID'),
  approved: z.boolean(),
  comments: z.string().max(500, 'Comments must not exceed 500 characters').optional().nullable(),
  rejectionReason: z.string().min(3, 'Rejection reason must be at least 3 characters').optional().nullable(),
}).refine(
  (data) => data.approved || (typeof data.rejectionReason === 'string' && data.rejectionReason.trim().length >= 3),
  {
    message: 'A non-empty rejection reason is required when rejecting a leave application',
    path: ['rejectionReason'],
  }
)

export const cancelLeaveSchema = z.object({
  leaveApplicationId: z.string().uuid('Invalid leave application ID'),
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters'),
})

export const withdrawLeaveSchema = z.object({
  leaveApplicationId: z.string().uuid('Invalid leave application ID'),
})

export type CreateLeaveApplicationInput = z.infer<typeof createLeaveApplicationSchema>
export type ProcessLeaveApprovalInput = z.infer<typeof processLeaveApprovalSchema>
export type CancelLeaveInput = z.infer<typeof cancelLeaveSchema>
