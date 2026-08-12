'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AttendanceSessionStatus } from '@/types/attendance'
import { lockAttendanceSessionAction } from '@/lib/attendance/actions'

interface OverviewItem {
  classId: string
  className: string
  sectionId: string
  sectionName: string
  sessionId: string | null
  status: AttendanceSessionStatus | 'pending'
  markedAt: string | null
  lockedAt: string | null
}

interface AdminAttendanceDashboardProps {
  academicSessionId: string
  attendanceDate: string
  overview: OverviewItem[]
}

export function AdminAttendanceDashboard({
  academicSessionId,
  attendanceDate,
  overview,
}: AdminAttendanceDashboardProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(attendanceDate)
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [unlockReasonModal, setUnlockReasonModal] = useState<{ sessionId: string } | null>(null)
  const [unlockReason, setUnlockReason] = useState('')

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    router.push(`?date=${newDate}`)
  }

  const handleLockToggle = async (sessionId: string, currentStatus: string) => {
    if (currentStatus === 'locked') {
      // Opening unlock prompt
      setUnlockReasonModal({ sessionId })
      setUnlockReason('')
      return
    }

    setLoadingSessionId(sessionId)
    setErrorMessage(null)

    const result = await lockAttendanceSessionAction({
      sessionId,
      locked: true,
    })

    setLoadingSessionId(null)

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to lock session.')
    } else {
      router.refresh()
    }
  }

  const handleConfirmUnlock = async () => {
    if (!unlockReasonModal) return
    if (unlockReason.trim().length < 3) {
      setErrorMessage('A reason (at least 3 characters) is required to unlock a session.')
      return
    }

    setLoadingSessionId(unlockReasonModal.sessionId)
    setErrorMessage(null)

    const result = await lockAttendanceSessionAction({
      sessionId: unlockReasonModal.sessionId,
      locked: false,
      reason: unlockReason.trim(),
    })

    setLoadingSessionId(null)
    setUnlockReasonModal(null)

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to unlock session.')
    } else {
      router.refresh()
    }
  }

  const handleMarkSheetNavigate = (classId: string, sectionId: string) => {
    router.push(
      `/erp/teacher/attendance/mark?sessionId=${academicSessionId}&classId=${classId}&sectionId=${sectionId}&date=${selectedDate}`
    )
  }

  const totalSections = overview.length
  const submittedCount = overview.filter((o) => o.status === 'submitted').length
  const lockedCount = overview.filter((o) => o.status === 'locked').length
  const pendingCount = overview.filter((o) => o.status === 'pending' || o.status === 'draft').length

  return (
    <div className="space-y-6">
      {/* Header & Date Picker */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">School Attendance Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor, correct, and lock daily section attendance sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="attendanceDate" className="text-sm font-semibold text-slate-700">
            Date:
          </label>
          <input
            id="attendanceDate"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Sections</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalSections}</p>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-emerald-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Submitted</p>
          <p className="text-2xl font-bold mt-1">{submittedCount}</p>
        </div>
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 text-rose-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Locked</p>
          <p className="text-2xl font-bold mt-1">{lockedCount}</p>
        </div>
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-amber-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending / Draft</p>
          <p className="text-2xl font-bold mt-1">{pendingCount}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Overview Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Section</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Marked</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {overview.map((item) => (
                <tr key={`${item.classId}_${item.sectionId}`} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{item.className}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{item.sectionName}</td>
                  <td className="py-3.5 px-4">
                    {item.status === 'locked' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                        LOCKED
                      </span>
                    ) : item.status === 'submitted' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        SUBMITTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {item.markedAt ? new Date(item.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkSheetNavigate(item.classId, item.sectionId)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                      >
                        {item.status === 'locked' ? 'View Sheet' : 'Edit / Mark'}
                      </button>

                      {item.sessionId && (
                        <button
                          type="button"
                          disabled={loadingSessionId === item.sessionId}
                          onClick={() => handleLockToggle(item.sessionId!, item.status)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                            item.status === 'locked'
                              ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          {loadingSessionId === item.sessionId
                            ? '...'
                            : item.status === 'locked'
                            ? 'Unlock'
                            : 'Lock'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unlock Reason Modal */}
      {unlockReasonModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Unlock Attendance Session</h3>
            <p className="text-sm text-slate-600">
              Please provide a clear reason for unlocking this finalized attendance session. An audit log will be created.
            </p>
            <textarea
              rows={3}
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              placeholder="e.g. Principal approved correction for late arrival"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUnlockReasonModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
              >
                Confirm Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
