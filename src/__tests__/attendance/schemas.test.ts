import { describe, it, expect } from 'vitest'
import {
  submitAttendanceSchema,
  lockAttendanceSchema,
  assignTeacherSchema,
} from '@/lib/attendance/schemas'

describe('Attendance Zod Schemas', () => {
  it('validates a valid submit attendance payload', () => {
    const payload = {
      academicSessionId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      classId: 'c100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      sectionId: 'd100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      attendanceDate: '2026-08-12',
      records: [
        {
          studentId: 'f200bc99-0001-4ef8-bb6d-6bb9bd380a11',
          status: 'present',
          remarks: 'On time',
        },
        {
          studentId: 'f200bc99-0002-4ef8-bb6d-6bb9bd380a11',
          status: 'absent',
          remarks: null,
        },
      ],
    }

    const res = submitAttendanceSchema.safeParse(payload)
    expect(res.success).toBe(true)
  })

  it('rejects invalid status values in records', () => {
    const payload = {
      academicSessionId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      classId: 'c100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      sectionId: 'd100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      attendanceDate: '2026-08-12',
      records: [
        {
          studentId: 'f200bc99-0001-4ef8-bb6d-6bb9bd380a11',
          status: 'UNKNOWN_STATUS',
        },
      ],
    }

    const res = submitAttendanceSchema.safeParse(payload)
    expect(res.success).toBe(false)
  })

  it('rejects invalid attendance date format', () => {
    const payload = {
      academicSessionId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      classId: 'c100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      sectionId: 'd100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      attendanceDate: '12/08/2026',
      records: [
        {
          studentId: 'f200bc99-0001-4ef8-bb6d-6bb9bd380a11',
          status: 'present',
        },
      ],
    }

    const res = submitAttendanceSchema.safeParse(payload)
    expect(res.success).toBe(false)
  })

  it('validates lock attendance schema', () => {
    const valid = lockAttendanceSchema.safeParse({
      sessionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      locked: true,
    })
    expect(valid.success).toBe(true)
  })

  it('validates teacher assignment schema', () => {
    const valid = assignTeacherSchema.safeParse({
      teacherProfileId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      academicSessionId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      classId: 'c100bc99-0004-4ef8-bb6d-6bb9bd380a11',
      sectionId: 'd100bc99-0004-4ef8-bb6d-6bb9bd380a11',
    })
    expect(valid.success).toBe(true)
  })
})
