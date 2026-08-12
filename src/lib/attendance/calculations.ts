import type { AttendanceStatus, AttendanceSummary, LeavePolicy } from '@/types/attendance'

/**
 * Calculates attendance summary metrics given a list of record statuses.
 * 
 * Rules:
 * - If totalSchoolDays === 0 or eligibleDays <= 0: attendancePercentage returns 'N/A'
 * - LeavePolicy controls treatment of leave days:
 *   - 'exclude_from_eligible' (DEFAULT): Leave is an excused absence.
 *     Eligible Days = Total Days - Leave Days. Attended Days = Present + Late.
 *   - 'count_as_attended': Leave is counted as attended.
 *   - 'count_as_absent': Leave is counted as absent.
 */
export function calculateAttendanceSummary(
  statuses: AttendanceStatus[],
  policy: LeavePolicy = 'exclude_from_eligible'
): AttendanceSummary {
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

  let attendedDays = presentCount + lateCount
  let eligibleDays = totalSchoolDays

  if (policy === 'exclude_from_eligible') {
    eligibleDays = totalSchoolDays - leaveCount
  } else if (policy === 'count_as_attended') {
    attendedDays += leaveCount
  }

  let attendancePercentage: number | 'N/A' = 'N/A'

  if (totalSchoolDays > 0 && eligibleDays > 0) {
    const pct = (attendedDays / eligibleDays) * 100
    attendancePercentage = Math.round(pct * 10) / 10
  }

  return {
    totalSchoolDays,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    attendedDays,
    eligibleDays,
    attendancePercentage,
  }
}
