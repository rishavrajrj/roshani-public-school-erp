import type { AttendanceStatus, AttendanceSummary } from '@/types/attendance'

/**
 * Calculates attendance summary metrics given a list of record statuses.
 * Formula:
 * - Attended Days = Present + Late
 * - Attendance Percentage = (Attended Days / Total Days) * 100
 *   If Total Days is 0, defaults to 100.0%
 */
export function calculateAttendanceSummary(statuses: AttendanceStatus[]): AttendanceSummary {
  const totalSchoolDays = statuses.length

  let presentCount = 0
  let absentCount = 0
  let lateCount = 0
  let leaveCount = 0

  for (const status of statuses) {
    switch (status) {
      case 'present':
        presentCount++
        break
      case 'absent':
        absentCount++
        break
      case 'late':
        lateCount++
        break
      case 'leave':
        leaveCount++
        break
    }
  }

  const attendedDays = presentCount + lateCount
  const percentage = totalSchoolDays > 0 ? (attendedDays / totalSchoolDays) * 100 : 100.0

  return {
    totalSchoolDays,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    attendedDays,
    attendancePercentage: Math.round(percentage * 10) / 10,
  }
}
