import { z } from 'zod'

export const studentStatusEnum = z.enum([
  'active',
  'inactive',
  'alumni',
  'transferred',
  'withdrawn',
])

export type StudentStatus = z.infer<typeof studentStatusEnum>

export const createDirectStudentSchema = z.object({
  admission_number: z.string().max(50).optional().nullable().or(z.literal('')),
  first_name: z.string().min(1, 'First name is required').max(100),
  middle_name: z.string().max(100).optional().nullable().or(z.literal('')),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z
    .string()
    .refine((val) => !val || new Date(val) <= new Date(), {
      message: 'Date of birth cannot be in the future',
    })
    .optional()
    .nullable()
    .or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  phone: z.string().max(15).optional().nullable().or(z.literal('')),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable().or(z.literal('')),
  city: z.string().max(100).optional().nullable().or(z.literal('')),
  state: z.string().max(100).optional().nullable().or(z.literal('')),

  // Academic Assignment
  academic_session_id: z.string().uuid('Invalid academic session'),
  class_id: z.string().uuid('Invalid class'),
  section_id: z.string().uuid('Invalid section'),
  roll_number: z.string().max(50).optional().nullable().or(z.literal('')),

  // Guardian Information
  guardian_name: z.string().min(1, 'Guardian name is required').max(200),
  guardian_phone: z
    .string()
    .min(10, 'Guardian phone must be at least 10 digits')
    .max(15),
  guardian_relationship: z.string().min(1, 'Guardian relationship is required').max(50),
  guardian_email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
})

export type CreateDirectStudentInput = z.infer<typeof createDirectStudentSchema>

export const updateStudentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  middle_name: z.string().max(100).optional().or(z.literal('')),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z
    .string()
    .refine((val) => !val || new Date(val) <= new Date(), {
      message: 'Date of birth cannot be in the future',
    })
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  phone: z.string().max(15).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  photo_url: z.string().max(1000).optional().or(z.literal('')),
})

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>

export const changeStudentStatusSchema = z.object({
  status: studentStatusEnum,
  reason: z.string().max(500).optional().or(z.literal('')),
})

export type ChangeStudentStatusInput = z.infer<typeof changeStudentStatusSchema>

export const linkGuardianSchema = z.object({
  guardian_id: z.string().uuid().optional(),
  full_name: z.string().min(1, 'Guardian full name is required').max(200).optional(),
  relationship: z.string().min(1, 'Relationship is required').max(50),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  is_primary: z.boolean().default(false),
})

export type LinkGuardianInput = z.infer<typeof linkGuardianSchema>
