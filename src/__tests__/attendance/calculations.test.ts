import { describe, it, expect } from 'vitest'
import { calculateAttendanceSummary } from '@/lib/attendance/calculations'
import type { AttendanceStatus } from '@/types/attendance'

describe('Attendance Calculation Helpers', () => {
  it('handles empty list of statuses (0 days)', () => {
    const summary = calculateAttendanceSummary([])
    expect(summary.totalSchoolDays).toBe(0)
    expect(summary.attendedDays).toBe(0)
    expect(summary.attendancePercentage).toBe(100.0)
  })

  it('correctly calculates 100% attendance when all present', () => {
    const statuses: AttendanceStatus[] = ['present', 'present', 'present', 'present']
    const summary = calculateAttendanceSummary(statuses)
    expect(summary.totalSchoolDays).toBe(4)
    expect(summary.presentCount).toBe(4)
    expect(summary.absentCount).toBe(0)
    expect(summary.attendedDays).toBe(4)
    expect(summary.attendancePercentage).toBe(100.0)
  })

  it('counts late as attended days in attendance percentage', () => {
    // 8 present, 1 late, 1 absent = 9 attended out of 10 = 90.0%
    const statuses: AttendanceStatus[] = [
      'present', 'present', 'present', 'present',
      'present', 'present', 'present', 'present',
      'late', 'absent'
    ]
    const summary = calculateAttendanceSummary(statuses)
    expect(summary.totalSchoolDays).toBe(10)
    expect(summary.presentCount).toBe(8)
    expect(summary.lateCount).toBe(1)
    expect(summary.absentCount).toBe(1)
    expect(summary.attendedDays).toBe(9)
    expect(summary.attendancePercentage).toBe(90.0)
  })

  it('handles leave days correctly', () => {
    const statuses: AttendanceStatus[] = ['present', 'leave', 'absent']
    const summary = calculateAttendanceSummary(statuses)
    expect(summary.totalSchoolDays).toBe(3)
    expect(summary.leaveCount).toBe(1)
    expect(summary.attendedDays).toBe(1) // 1 present out of 3
    expect(summary.attendancePercentage).toBe(33.3)
  })
})
