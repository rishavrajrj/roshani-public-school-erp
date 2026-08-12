import { describe, it, expect } from 'vitest'
import { calculateAttendanceSummary } from '@/lib/attendance/calculations'
import type { AttendanceStatus } from '@/types/attendance'

describe('Attendance Calculation Logic', () => {
  it('returns N/A when total school days = 0', () => {
    const summary = calculateAttendanceSummary([])
    expect(summary.totalSchoolDays).toBe(0)
    expect(summary.attendancePercentage).toBe('N/A')
  })

  it('calculates standard percentage correctly (present + late)', () => {
    const statuses: AttendanceStatus[] = ['present', 'present', 'late', 'absent']
    const summary = calculateAttendanceSummary(statuses)
    expect(summary.totalSchoolDays).toBe(4)
    expect(summary.presentCount).toBe(2)
    expect(summary.lateCount).toBe(1)
    expect(summary.absentCount).toBe(1)
    expect(summary.attendedDays).toBe(3)
    expect(summary.eligibleDays).toBe(4)
    expect(summary.attendancePercentage).toBe(75)
  })

  it('handles default leave policy (exclude_from_eligible)', () => {
    const statuses: AttendanceStatus[] = ['present', 'present', 'leave', 'absent']
    const summary = calculateAttendanceSummary(statuses, 'exclude_from_eligible')
    expect(summary.totalSchoolDays).toBe(4)
    expect(summary.leaveCount).toBe(1)
    expect(summary.eligibleDays).toBe(3) // 4 total - 1 leave
    expect(summary.attendedDays).toBe(2)
    expect(summary.attendancePercentage).toBe(66.7)
  })

  it('handles count_as_attended leave policy', () => {
    const statuses: AttendanceStatus[] = ['present', 'leave', 'absent', 'absent']
    const summary = calculateAttendanceSummary(statuses, 'count_as_attended')
    expect(summary.eligibleDays).toBe(4)
    expect(summary.attendedDays).toBe(2) // 1 present + 1 leave
    expect(summary.attendancePercentage).toBe(50)
  })

  it('handles count_as_absent leave policy', () => {
    const statuses: AttendanceStatus[] = ['present', 'leave', 'absent', 'absent']
    const summary = calculateAttendanceSummary(statuses, 'count_as_absent')
    expect(summary.eligibleDays).toBe(4)
    expect(summary.attendedDays).toBe(1) // only 1 present
    expect(summary.attendancePercentage).toBe(25)
  })

  it('returns N/A if all days are excused leave under exclude_from_eligible policy', () => {
    const statuses: AttendanceStatus[] = ['leave', 'leave']
    const summary = calculateAttendanceSummary(statuses, 'exclude_from_eligible')
    expect(summary.totalSchoolDays).toBe(2)
    expect(summary.eligibleDays).toBe(0)
    expect(summary.attendancePercentage).toBe('N/A')
  })
})
