'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StudentAttendanceItem, AttendanceStatus, AttendanceSessionStatus } from '@/types/attendance'
import { submitAttendanceSessionAction } from '@/lib/attendance/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, UserCheck, UserX, Clock, CalendarOff } from 'lucide-react'

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
      setSuccessMessage('Attendance register saved successfully!')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
              {className} — Section {sectionName}
            </h1>
            <StatusBadge
              status={isLocked ? 'locked' : isSubmitted ? 'submitted' : 'draft'}
              size="sm"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Attendance Date: <span className="font-bold text-slate-900 font-mono">{attendanceDate}</span> &bull; Total Enrolled: <span className="font-bold text-slate-900">{students.length}</span>
          </p>
        </div>

        {!isLocked && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Mark All Present
            </Button>
          </div>
        )}
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 text-emerald-950 flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-700 font-mono">Present</p>
            <p className="text-2xl sm:text-3xl font-black mt-0.5 font-sans">{presentCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 text-rose-950 flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-rose-700 font-mono">Absent</p>
            <p className="text-2xl sm:text-3xl font-black mt-0.5 font-sans">{absentCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-amber-950 flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-800 font-mono">Late</p>
            <p className="text-2xl sm:text-3xl font-black mt-0.5 font-sans">{lateCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-4 text-sky-950 flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-sky-700 font-mono">On Leave</p>
            <p className="text-2xl sm:text-3xl font-black mt-0.5 font-sans">{leaveCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
            <CalendarOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold">
          {successMessage}
        </div>
      )}

      {/* Mandatory Correction Reason Field when editing a submitted sheet */}
      {isSubmitted && !isLocked && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 space-y-2 text-xs">
          <label htmlFor="correctionReason" className="block text-xs font-bold text-amber-900 uppercase font-mono">
            Correction Reason <span className="text-rose-600 font-bold">*</span>
          </label>
          <input
            id="correctionReason"
            type="text"
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
            placeholder="e.g. Student arrived before final morning roll call"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            required
          />
          <p className="text-[11px] text-amber-800">
            A correction justification is required whenever modifying an already submitted attendance session.
          </p>
        </div>
      )}

      {/* Student Attendance List */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-4">Roll</th>
                  <th className="py-3.5 px-4">Admission No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900 font-medium">
                {students.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{st.rollNumber || '—'}</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900">{st.admissionNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {st.firstName} {st.lastName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleStatusChange(st.studentId, 'present')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all duration-150 cursor-pointer shadow-2xs ${
                            st.status === 'present'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                          }`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleStatusChange(st.studentId, 'absent')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all duration-150 cursor-pointer shadow-2xs ${
                            st.status === 'absent'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50'
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleStatusChange(st.studentId, 'late')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all duration-150 cursor-pointer shadow-2xs ${
                            st.status === 'late'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50'
                          }`}
                        >
                          Late
                        </button>

                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleStatusChange(st.studentId, 'leave')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all duration-150 cursor-pointer shadow-2xs ${
                            st.status === 'leave'
                              ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-50'
                          }`}
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={st.remarks || ''}
                        onChange={(e) => handleRemarksChange(st.studentId, e.target.value)}
                        placeholder="Optional remarks"
                        className="w-full max-w-xs px-2.5 py-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1554C0] disabled:bg-slate-100 disabled:text-slate-400 font-medium"
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
            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting}
              loadingText="Saving Register..."
            >
              {isSubmitted ? 'Update Attendance Register' : 'Submit Attendance Register'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
