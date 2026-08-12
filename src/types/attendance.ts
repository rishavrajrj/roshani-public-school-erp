export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave'
export type AttendanceSessionStatus = 'draft' | 'submitted' | 'locked'

export interface TeacherAssignment {
  id: string
  schoolId: string
  teacherProfileId: string
  academicSessionId: string
  classId: string
  sectionId: string
  assignedAt: string
  assignedBy: string | null
  active: boolean
  teacherName?: string
  className?: string
  sectionName?: string
  sessionName?: string
}

export interface AttendanceSession {
  id: string
  schoolId: string
  academicSessionId: string
  classId: string
  sectionId: string
  attendanceDate: string
  status: AttendanceSessionStatus
  markedBy: string
  markedAt: string
  lockedAt: string | null
  lockedBy: string | null
  markedByName?: string
  lockedByName?: string
}

export interface StudentAttendanceItem {
  studentId: string
  firstName: string
  lastName: string
  admissionNumber: string
  rollNumber: string | null
  status: AttendanceStatus
  remarks?: string | null
  recordId?: string
}

export interface SubmitAttendancePayload {
  academicSessionId: string
  classId: string
  sectionId: string
  attendanceDate: string
  records: Array<{
    studentId: string
    status: AttendanceStatus
    remarks?: string | null
  }>
}

export interface AttendanceSummary {
  totalSchoolDays: number
  presentCount: number
  absentCount: number
  lateCount: number
  leaveCount: number
  attendedDays: number // present + late
  attendancePercentage: number
}
