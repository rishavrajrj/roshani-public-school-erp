import { describe, it, expect } from 'vitest'
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
  convertApplicationSchema,
} from '@/lib/admissions/schemas'

describe('Admissions Zod Schemas Validation', () => {
  it('validates a correct admission application input', () => {
    const result = createApplicationSchema.safeParse({
      academic_session_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      applying_for_class_id: 'c100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      applicant_first_name: 'Aarav',
      applicant_last_name: 'Sharma',
      date_of_birth: '2016-05-10',
      gender: 'male',
      guardian_name: 'Rajesh Sharma',
      guardian_phone: '+919876543210',
      guardian_email: 'rajesh@example.com',
      address: 'Turkauliya, Bihar',
    })

    expect(result.success).toBe(true)
  })

  it('rejects future date of birth', () => {
    const futureDate = new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0]
    const result = createApplicationSchema.safeParse({
      academic_session_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      applying_for_class_id: 'c100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      applicant_first_name: 'Test',
      applicant_last_name: 'User',
      date_of_birth: futureDate,
      guardian_name: 'Parent Name',
      guardian_phone: '9876543210',
    })

    expect(result.success).toBe(false)
  })

  it('validates update application status input', () => {
    const result = updateApplicationStatusSchema.safeParse({
      status: 'approved',
      notes: 'Passed entrance test with high marks.',
    })

    expect(result.success).toBe(true)
  })

  it('validates convert application input', () => {
    const result = convertApplicationSchema.safeParse({
      section_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      roll_number: '12',
      admission_number: 'RPS-2026-099',
    })

    expect(result.success).toBe(true)
  })
})
