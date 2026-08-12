'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StudentAttendanceItem, AttendanceStatus, AttendanceSessionStatus } from '@/types/attendance'
import { submitAttendanceSessionAction } from '@/lib/attendance/actions'

interface AttendanceMarkingSheetProps {
  academicSessionId: string
  classId: string
  sectionId: string
  attendanceDate: string
  className: string
  sectionName: string
  sessionStatus: AttendanceSessionStatus
  initialStudents: StudentAttendanceItem[]
}

export function AttendanceMarkingSheet({
  academicSessionId,
  classId,
  sectionId,
  attendanceDate,
  className,
  sectionName,
  sessionStatus,
  initialStudents,
}: AttendanceMarkingSheetProps) {
  const router = useRouter()
  const [students, setStudents] = useState<StudentAttendanceItem[]>(initialStudents)
  const [correctionReason, setCorrectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isLocked = sessionStatus === 'locked'
  const isSubmitted = sessionStatus === 'submitted'

  // Summary counts
  const presentCount = students.filter((s) => s.status === 'present').length
  const absentCount = students.filter((s) => s.status === 'absent').length
  const lateCount = students.filter((s) => s.status === 'late').length
  const leaveCount = students.filter((s) => s.status === 'leave').length

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isLocked) return
    setStudents((prev) =>
      prev.map((st) => (st.studentId === studentId ? { ...st, status } : st))
    )
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (isLocked) return
    setStudents((prev) =>
      prev.map((st) => (st.studentId === studentId ? { ...st, remarks } : st))
    )
  }

  const handleMarkAllPresent = () => {
    if (isLocked) return
    setStudents((prev) => prev.map((st) => ({ ...st, status: 'present' })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return

    if (isSubmitted && correctionReason.trim().length < 3) {
      setErrorMessage('A correction reason (at least 3 characters) is required when modifying a submitted attendance session.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const result = await submitAttendanceSessionAction({
      academicSessionId,
      classId,
      sectionId,
      attendanceDate,
      correctionReason: isSubmitted ? correctionReason.trim() : undefined,
      records: students.map((s) => ({
        studentId: s.studentId,
        status: s.status,
        remarks: s.remarks,
      })),
    })

    setIsSubmitting(false)

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to submit attendance.')
    } else {
      setSuccessMessage('Attendance recorded successfully!')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {className} — Section {sectionName}
            </h1>
            {isLocked ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                LOCKED
              </span>
            ) : isSubmitted ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                SUBMITTED
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                DRAFT
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Attendance Date: <span className="font-medium text-slate-900">{attendanceDate}</span> • Total Enrolled Eligible: <span className="font-medium text-slate-900">{students.length}</span>
          </p>
        </div>

        {!isLocked && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Mark All Present
            </button>
          </div>
        )}
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-emerald-900">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">Present</p>
          <p className="text-2xl font-bold mt-1">{presentCount}</p>
        </div>
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 text-rose-900">
          <p className="text-xs font-medium uppercase tracking-wider text-rose-700">Absent</p>
          <p className="text-2xl font-bold mt-1">{absentCount}</p>
        </div>
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-amber-900">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-700">Late</p>
          <p className="text-2xl font-bold mt-1">{lateCount}</p>
        </div>
        <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 text-sky-900">
          <p className="text-xs font-medium uppercase tracking-wider text-sky-700">On Leave</p>
          <p className="text-2xl font-bold mt-1">{leaveCount}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Mandatory Correction Reason Field when editing a submitted sheet */}
      {isSubmitted && !isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <label htmlFor="correctionReason" className="block text-sm font-semibold text-amber-900">
            Correction Reason <span className="text-rose-600">*</span>
          </label>
          <input
            id="correctionReason"
            type="text"
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
            placeholder="e.g. Student arrived before final roll call"
            className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            required
          />
          <p className="text-xs text-amber-700">
            A correction reason is required whenever modifying an already submitted attendance session.
          </p>
        </div>
      )}

      {/* Student Attendance List */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Roll</th>
                  <th className="py-3.5 px-4">Admission No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                {students.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono text-slate-500">{st.rollNumber || '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{st.admissionNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {st.firstName} {st.lastName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleStatusChange(st.studentId, 'present')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                            st.status === 'present'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                          }`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleStatusChange(st.studentId, 'absent')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                            st.status === 'absent'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50'
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleStatusChange(st.studentId, 'late')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                            st.status === 'late'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50'
                          }`}
                        >
                          Late
                        </button>

                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleStatusChange(st.studentId, 'leave')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                            st.status === 'leave'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50'
                          }`}
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={st.remarks || ''}
                        onChange={(e) => handleRemarksChange(st.studentId, e.target.value)}
                        placeholder="Optional remarks"
                        className="w-full max-w-xs px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button */}
        {!isLocked && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isSubmitted ? 'Update Attendance' : 'Submit Attendance'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
