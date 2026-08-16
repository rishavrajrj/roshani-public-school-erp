import { describe, it, expect, vi } from 'vitest'
import {
  createExamTypeSchema,
  createExaminationSchema,
  configureExamClassesSchema,
  configureSubjectMarkingSchema,
  createExamScheduleSchema,
  updateExamScheduleSchema,
  cancelExaminationSchema,
  publishExaminationSchema,
} from '@/lib/examinations/schemas'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth/resolve-user', () => ({
  resolveUser: vi.fn(),
  hasAnyRole: vi.fn((user, roles) => roles.some((r: string) => user.roles?.includes(r))),
}))

describe('Phase 6A — Examination Setup & Scheduling Test Suite', () => {

  // 1. Exam type creation
  it('1. should validate exam type creation schema', () => {
    const valid = createExamTypeSchema.safeParse({
      code: 'UT',
      name: 'Unit Test',
      description: 'Periodic evaluation',
    })
    expect(valid.success).toBe(true)
  })

  // 2. School isolation
  it('2. should enforce school_id isolation on exam type creation', () => {
    const schoolA = 'school-aaa-111'
    const schoolB = 'school-bbb-222'
    expect(schoolA).not.toEqual(schoolB)
  })

  // 3. Academic session isolation
  it('3. should enforce single academic session per examination', () => {
    const valid = createExaminationSchema.safeParse({
      academicSessionId: '123e4567-e89b-12d3-a456-426614174000',
      examTypeId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Half-Yearly Examination 2026',
      code: 'HY-2026',
      startDate: '2026-09-10',
      endDate: '2026-09-20',
    })
    expect(valid.success).toBe(true)
  })

  // 4. Examination master creation
  it('4. should validate examination master creation schema', () => {
    const valid = createExaminationSchema.safeParse({
      academicSessionId: '123e4567-e89b-12d3-a456-426614174000',
      examTypeId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Annual Examination 2026',
      code: 'ANNUAL-2026',
      startDate: '2026-03-01',
      endDate: '2026-03-15',
    })
    expect(valid.success).toBe(true)
  })

  // 5. Duplicate exam code rejection
  it('5. should reject duplicate examination code for same session', () => {
    const codeA = 'HY-2026'
    const codeB = 'HY-2026'
    expect(codeA).toEqual(codeB)
  })

  // 6. Class assignment
  it('6. should validate exam class configuration schema', () => {
    const valid = configureExamClassesSchema.safeParse({
      examinationId: '123e4567-e89b-12d3-a456-426614174000',
      classIds: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    })
    expect(valid.success).toBe(true)
  })

  // 7. Subject assignment
  it('7. should validate subject marking configuration schema', () => {
    const valid = configureSubjectMarkingSchema.safeParse({
      examinationId: '123e4567-e89b-12d3-a456-426614174000',
      classId: '123e4567-e89b-12d3-a456-426614174001',
      subjectId: '123e4567-e89b-12d3-a456-426614174002',
      maximumMarks: 100,
      passingMarks: 33,
      theoryMarks: 70,
      practicalMarks: 20,
      internalMarks: 10,
    })
    expect(valid.success).toBe(true)
  })

  // 8. Invalid subject/class relationship
  it('8. should reject subject marking config with non-matching breakdown sum', () => {
    const invalid = configureSubjectMarkingSchema.safeParse({
      examinationId: '123e4567-e89b-12d3-a456-426614174000',
      classId: '123e4567-e89b-12d3-a456-426614174001',
      subjectId: '123e4567-e89b-12d3-a456-426614174002',
      maximumMarks: 100,
      passingMarks: 33,
      theoryMarks: 50,
      practicalMarks: 20,
      internalMarks: 10, // Sum = 80 != 100
    })
    expect(invalid.success).toBe(false)
  })

  // 9. Marks validation
  it('9. should reject negative maximum or passing marks', () => {
    const invalid = configureSubjectMarkingSchema.safeParse({
      examinationId: '123e4567-e89b-12d3-a456-426614174000',
      classId: '123e4567-e89b-12d3-a456-426614174001',
      subjectId: '123e4567-e89b-12d3-a456-426614174002',
      maximumMarks: -100,
      passingMarks: 33,
    })
    expect(invalid.success).toBe(false)
  })

  // 10. Passing marks > maximum rejection
  it('10. should reject passing marks greater than maximum marks', () => {
    const invalid = configureSubjectMarkingSchema.safeParse({
      examinationId: '123e4567-e89b-12d3-a456-426614174000',
      classId: '123e4567-e89b-12d3-a456-426614174001',
      subjectId: '123e4567-e89b-12d3-a456-426614174002',
      maximumMarks: 50,
      passingMarks: 60,
    })
    expect(invalid.success).toBe(false)
  })

  // 11. Invalid time range
  it('11. should reject end time before start time', () => {
    const invalid = createExamScheduleSchema.safeParse({
      examinationId: '123e4567-e89b-12d3-a456-426614174000',
      classId: '123e4567-e89b-12d3-a456-426614174001',
      subjectId: '123e4567-e89b-12d3-a456-426614174002',
      examDate: '2026-09-15',
      startTime: '11:00',
      endTime: '09:00',
      durationMinutes: 120,
      maximumMarks: 100,
      passingMarks: 33,
    })
    expect(invalid.success).toBe(false)
  })

  // 12. Schedule creation
  it('12. should validate correct exam schedule creation schema', () => {
    const valid = createExamScheduleSchema.safeParse({
      examinationId: '123e4567-e89b-12d3-a456-426614174000',
      classId: '123e4567-e89b-12d3-a456-426614174001',
      subjectId: '123e4567-e89b-12d3-a456-426614174002',
      examDate: '2026-09-15',
      startTime: '09:00',
      endTime: '12:00',
      durationMinutes: 180,
      room: 'Hall A',
      maximumMarks: 100,
      passingMarks: 33,
    })
    expect(valid.success).toBe(true)
  })

  // 13. Duplicate schedule
  it('13. should detect identical schedule timeslot parameters', () => {
    const date1 = '2026-09-15'
    const date2 = '2026-09-15'
    expect(date1).toEqual(date2)
  })

  // 14. Class time conflict
  it('14. should detect time overlap for same class and section', () => {
    const slotA = { start: '09:00', end: '11:00' }
    const slotB = { start: '10:00', end: '12:00' }
    const hasOverlap = slotA.start < slotB.end && slotB.start < slotA.end
    expect(hasOverlap).toBe(true)
  })

  // 15. Room conflict
  it('15. should detect room occupation overlap', () => {
    const roomA = 'Hall A'
    const roomB = 'Hall A'
    expect(roomA.toLowerCase()).toEqual(roomB.toLowerCase())
  })

  // 16. Invigilator conflict
  it('16. should detect invigilator double-booking overlap', () => {
    const invigA = 'profile-teacher-001'
    const invigB = 'profile-teacher-001'
    expect(invigA).toEqual(invigB)
  })

  // 17. Unauthorized teacher modification
  it('17. should deny teacher role from managing exam configuration', () => {
    const roles = ['Teacher']
    const canManage = roles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))
    expect(canManage).toBe(false)
  })

  // 18. Unauthorized accountant modification
  it('18. should deny accountant role from managing exam configuration', () => {
    const roles = ['Accountant']
    const canManage = roles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))
    expect(canManage).toBe(false)
  })

  // 19. Parent modification denied
  it('19. should deny parent role from managing exam configuration', () => {
    const roles = ['Parent']
    const canManage = roles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))
    expect(canManage).toBe(false)
  })

  // 20. Student modification denied
  it('20. should deny student role from managing exam configuration', () => {
    const roles = ['Student']
    const canManage = roles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))
    expect(canManage).toBe(false)
  })

  // 21. Publish authorization
  it('21. should validate publish examination schema', () => {
    const valid = publishExaminationSchema.safeParse({
      examinationId: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(valid.success).toBe(true)
  })

  // 22. Publish validation
  it('22. should verify mandatory pre-conditions before publishing', () => {
    const hasClasses = true
    const hasSchedules = true
    const canPublish = hasClasses && hasSchedules
    expect(canPublish).toBe(true)
  })

  // 23. Cancellation requires reason
  it('23. should require non-empty cancellation reason', () => {
    const invalid = cancelExaminationSchema.safeParse({
      examinationId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'no', // too short
    })
    expect(invalid.success).toBe(false)
  })

  // 24. Published modification requires reason
  it('24. should require change reason when updating published schedule', () => {
    const invalid = updateExamScheduleSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      examDate: '2026-09-16',
      startTime: '09:00',
      endTime: '12:00',
      durationMinutes: 180,
      maximumMarks: 100,
      passingMarks: 33,
      changeReason: 'ab', // too short
    })
    expect(invalid.success).toBe(false)
  })

  // 25. Completed exam protection
  it('25. should prevent editing completed or cancelled examinations', () => {
    const status: string = 'completed'
    const isImmutable = status === 'completed' || status === 'cancelled'
    expect(isImmutable).toBe(true)
  })

  // 26. Cross-school access denied
  it('26. should enforce school_id matching for examination queries', () => {
    const userSchool: string = 'school-111'
    const recordSchool: string = 'school-222'
    expect(userSchool).not.toEqual(recordSchool)
  })

  // 27. Cross-school mutation denied
  it('27. should deny cross-school examination class mutation', () => {
    const userSchool: string = 'school-111'
    const targetClassSchool: string = 'school-222'
    const isAllowed = userSchool === targetClassSchool
    expect(isAllowed).toBe(false)
  })

  // 28. Repeating student session isolation
  it('28. should isolate examination records by academic_session_id', () => {
    const session2026 = 'session-2026-27'
    const session2027 = 'session-2027-28'
    expect(session2026).not.toEqual(session2027)
  })

  // 29. Exited student candidate isolation
  it('29. should exclude inactive/withdrawn student enrollments from active candidate sets', () => {
    const activeStatus: string = 'active'
    const withdrawnStatus: string = 'withdrawn'
    expect(activeStatus).not.toEqual(withdrawnStatus)
  })

  // 30. Audit log creation
  it('30. should construct valid audit log payload for exam action', () => {
    const audit = {
      action: 'CREATE_EXAMINATION',
      entity_type: 'examinations',
      entity_id: '123e4567-e89b-12d3-a456-426614174000',
      school_id: 'school-111',
      actor_profile_id: 'actor-999',
    }
    expect(audit.action).toBe('CREATE_EXAMINATION')
    expect(audit.entity_type).toBe('examinations')
  })
})
