import { z } from 'zod'

export const applicationStatusEnum = z.enum([
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'withdrawn',
  'converted',
])

export type ApplicationStatus = z.infer<typeof applicationStatusEnum>

export const createApplicationSchema = z.object({
  academic_session_id: z.string().uuid('Invalid academic session'),
  applying_for_class_id: z.string().uuid('Invalid class selected'),
  applicant_first_name: z.string().min(1, 'First name is required').max(100),
  applicant_middle_name: z.string().max(100).optional().or(z.literal('')),
  applicant_last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z
    .string()
    .refine((val) => !val || new Date(val) <= new Date(), {
      message: 'Date of birth cannot be in the future',
    })
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  guardian_name: z.string().min(1, 'Guardian name is required').max(200),
  guardian_phone: z
    .string()
    .min(10, 'Guardian phone must be at least 10 digits')
    .max(15, 'Invalid phone number length'),
  guardian_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  status: z.enum(['draft', 'submitted']).default('draft'),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>

export const updateApplicationStatusSchema = z.object({
  status: applicationStatusEnum,
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>

export const convertApplicationSchema = z.object({
  section_id: z.string().uuid('Invalid section selected'),
  roll_number: z.string().max(50).optional().or(z.literal('')),
  admission_number: z.string().max(50).optional().or(z.literal('')),
})

export type ConvertApplicationInput = z.infer<typeof convertApplicationSchema>
