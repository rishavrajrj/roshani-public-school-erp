import { describe, it, expect } from 'vitest'
import {
  createDirectStudentSchema,
  changeStudentStatusSchema,
  linkGuardianSchema,
} from '@/lib/students/schemas'

describe('Students Zod Schemas Validation', () => {
  it('validates direct student creation input', () => {
    const result = createDirectStudentSchema.safeParse({
      first_name: 'Priya',
      last_name: 'Singh',
      date_of_birth: '2017-08-14',
      gender: 'female',
      academic_session_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      class_id: 'c100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      section_id: 'd100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      guardian_name: 'Amit Singh',
      guardian_phone: '9876543212',
      guardian_relationship: 'father',
    })

    expect(result.success).toBe(true)
  })

  it('rejects short guardian phone numbers', () => {
    const result = createDirectStudentSchema.safeParse({
      first_name: 'Priya',
      last_name: 'Singh',
      academic_session_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      class_id: 'c100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      section_id: 'd100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      guardian_name: 'Amit Singh',
      guardian_phone: '123',
      guardian_relationship: 'father',
    })

    expect(result.success).toBe(false)
  })

  it('validates student status changes', () => {
    const validStatuses = ['active', 'inactive', 'alumni', 'transferred', 'withdrawn']
    for (const status of validStatuses) {
      const res = changeStudentStatusSchema.safeParse({ status, reason: 'Valid status' })
      expect(res.success).toBe(true)
    }
  })

  it('validates guardian link schema', () => {
    const result = linkGuardianSchema.safeParse({
      full_name: 'Sunita Devi',
      relationship: 'mother',
      phone: '9876543211',
      is_primary: false,
    })

    expect(result.success).toBe(true)
  })
})
