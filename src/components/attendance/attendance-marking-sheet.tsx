'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { submitAttendanceSessionAction, lockAttendanceSessionAction } from '@/lib/attendance/actions'
import type { AttendanceStatus, AttendanceSessionStatus } from '@/types/attendance'

interface StudentRecordState {
  studentId: string
  firstName: string
  lastName: string
  admissionNumber: string
  rollNumber: string | null
  status: AttendanceStatus
  remarks: string
}

interface Props {
  academicSessionId: string
  classId: string
  sectionId: string
  className: string
  sectionName: string
  attendanceDate: string
  initialStatus: AttendanceSessionStatus
  students: Array<{
    studentId: string
    firstName: string
    lastName: string
    admissionNumber: string
    rollNumber: string | null
    status: AttendanceStatus
    remarks?: string | null
  }>
  isAdmin: boolean
}

export function AttendanceMarkingSheet({
  academicSessionId,
  classId,
  sectionId,
  className,
  sectionName,
  attendanceDate,
  initialStatus,
  students: initialStudents,
  isAdmin,
}: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(attendanceDate)
  const [sessionStatus, setSessionStatus] = useState<AttendanceSessionStatus>(initialStatus)
  const [studentStates, setStudentStates] = useState<StudentRecordState[]>(
    initialStudents.map((s) => ({
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      admissionNumber: s.admissionNumber,
      rollNumber: s.rollNumber,
      status: s.status || 'present',
      remarks: s.remarks || '',
    }))
  )

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLocking, setIsLocking] = useState(false)

  const isLocked = sessionStatus === 'locked' && !isAdmin

  // Calculate live counts
  const counts = studentStates.reduce(
    (acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
    },
    { present: 0, absent: 0, late: 0, leave: 0 } as Record<AttendanceStatus, number>
  )

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    if (isLocked) return
    setStudentStates((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    )
  }

  const handleRemarksChange = (studentId: string, newRemarks: string) => {
    if (isLocked) return
    setStudentStates((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks: newRemarks } : s))
    )
  }

  const handleMarkAllPresent = () => {
    if (isLocked) return
    setStudentStates((prev) => prev.map((s) => ({ ...s, status: 'present' as AttendanceStatus })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (isLocked) {
      setError('This attendance session is locked and cannot be edited.')
      return
    }

    setIsSubmitting(true)

    const res = await submitAttendanceSessionAction({
      academicSessionId,
      classId,
      sectionId,
      attendanceDate: selectedDate,
      records: studentStates.map((s) => ({
        studentId: s.studentId,
        status: s.status,
        remarks: s.remarks || null,
      })),
    })

    setIsSubmitting(false)

    if (!res.success) {
      setError(res.error || 'Failed to submit attendance.')
    } else {
      setSuccess('Attendance submitted and verified successfully.')
      setSessionStatus('submitted')
      router.refresh()
    }
  }

  const handleToggleLock = async () => {
    setError(null)
    setIsLocking(true)

    const shouldLock = sessionStatus !== 'locked'
    const res = await lockAttendanceSessionAction({
      sessionId: academicSessionId, // Note: action uses sessionId lookup or updates session
      locked: shouldLock,
    })

    setIsLocking(false)

    if (!res.success) {
      setError(res.error || 'Failed to update lock status.')
    } else {
      setSessionStatus(shouldLock ? 'locked' : 'submitted')
      setSuccess(`Attendance session ${shouldLock ? 'locked' : 'unlocked'}.`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <Link
              href="/erp/teacher/attendance"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              ← Back to Portal
            </Link>
            <span className="text-slate-300">•</span>
            <span
              className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                sessionStatus === 'locked'
                  ? 'bg-rose-100 text-rose-800'
                  : sessionStatus === 'submitted'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {sessionStatus === 'locked' ? 'Locked' : sessionStatus === 'submitted' ? 'Submitted' : 'Pending'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {className} — Section {sectionName}
          </h1>
          <p className="text-xs text-slate-500">Attendance Sheet for {selectedDate}</p>
        </div>

        <div className="flex items-center space-x-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const d = e.target.value
                setSelectedDate(d)
                router.push(
                  `/erp/teacher/attendance/mark?sessionId=${academicSessionId}&classId=${classId}&sectionId=${sectionId}&date=${d}`
                )
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!isLocked && (
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="mt-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md transition"
            >
              Mark All Present
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={handleToggleLock}
              disabled={isLocking}
              className={`mt-5 text-xs font-semibold px-3 py-2 rounded-md transition text-white ${
                sessionStatus === 'locked' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-800 hover:bg-slate-900'
              }`}
            >
              {isLocking ? 'Updating...' : sessionStatus === 'locked' ? 'Unlock Session' : 'Lock Session'}
            </button>
          )}
        </div>
      </div>

      {/* Lock Notice */}
      {isLocked && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-sm flex items-center justify-between">
          <div>
            <span className="font-semibold">Attendance Session Locked:</span> This attendance record has been locked by school administration and cannot be modified by teachers.
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
          {success}
        </div>
      )}

      {/* Summary Count Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Enrolled</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{studentStates.length}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm text-center">
          <div className="text-xs font-semibold text-emerald-800 uppercase">Present</div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{counts.present}</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-sm text-center">
          <div className="text-xs font-semibold text-rose-800 uppercase">Absent</div>
          <div className="text-2xl font-bold text-rose-900 mt-1">{counts.absent}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm text-center">
          <div className="text-xs font-semibold text-amber-800 uppercase">Late</div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{counts.late}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm text-center col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-blue-800 uppercase">On Leave</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{counts.leave}</div>
        </div>
      </div>

      {/* Student List Table & Mobile Cards */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3 text-center">Attendance Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentStates.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {st.rollNumber || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {st.firstName} {st.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {st.admissionNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center items-center space-x-1 sm:space-x-2">
                        {(['present', 'absent', 'late', 'leave'] as AttendanceStatus[]).map((status) => {
                          const isSelected = st.status === status
                          let activeClass = ''
                          if (status === 'present') activeClass = 'bg-emerald-600 text-white shadow-sm'
                          if (status === 'absent') activeClass = 'bg-rose-600 text-white shadow-sm'
                          if (status === 'late') activeClass = 'bg-amber-500 text-white shadow-sm'
                          if (status === 'leave') activeClass = 'bg-blue-600 text-white shadow-sm'

                          return (
                            <button
                              key={status}
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleStatusChange(st.studentId, status)}
                              className={`px-3 py-1.5 text-xs font-semibold capitalize rounded-md transition ${
                                isSelected
                                  ? activeClass
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              } disabled:opacity-60`}
                            >
                              {status}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Optional note"
                        value={st.remarks}
                        disabled={isLocked}
                        onChange={(e) => handleRemarksChange(st.studentId, e.target.value)}
                        className="w-full text-xs rounded border border-slate-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Action */}
        {!isLocked && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Attendance...' : 'Submit Section Attendance'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
