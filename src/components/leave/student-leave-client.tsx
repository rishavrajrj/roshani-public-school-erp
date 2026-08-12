'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LeaveType, LeaveApplicationItem, DurationType } from '@/types/leave'
import { createLeaveApplicationAction, cancelLeaveAction } from '@/lib/leave/actions'

interface StudentLeaveClientProps {
  leaveTypes: LeaveType[]
  applications: LeaveApplicationItem[]
}

export function StudentLeaveClient({ leaveTypes, applications }: StudentLeaveClientProps) {
  const router = useRouter()
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id || '')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [durationType, setDurationType] = useState<DurationType>('full_day')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim().length < 3) {
      setErrorMessage('A non-empty reason (at least 3 characters) is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const result = await createLeaveApplicationAction({
      leaveTypeId,
      startDate,
      endDate,
      durationType,
      reason: reason.trim(),
    })

    setIsSubmitting(false)

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to submit leave application.')
    } else {
      setSuccessMessage('Leave application submitted successfully!')
      setShowApplyModal(false)
      setReason('')
      router.refresh()
    }
  }

  const handleCancel = async (applicationId: string) => {
    const cancelReason = prompt('Please enter a reason for cancelling this leave application:')
    if (!cancelReason || cancelReason.trim().length < 3) {
      alert('Cancellation requires a reason of at least 3 characters.')
      return
    }

    const result = await cancelLeaveAction({
      leaveApplicationId: applicationId,
      reason: cancelReason.trim(),
    })

    if (!result.success) {
      alert(result.error || 'Failed to cancel leave application.')
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Leave Applications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Apply for student leave and track approval status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          + Apply for Leave
        </button>
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

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Dates</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No leave applications found.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{app.leaveTypeName}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {app.startDate} {app.startDate !== app.endDate ? ` to ${app.endDate}` : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{app.calculatedDays} day(s)</span>
                      <span className="text-xs text-slate-400 block capitalize">{app.durationType.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">{app.reason}</td>
                    <td className="py-3.5 px-4">
                      {app.status === 'approved' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          APPROVED
                        </span>
                      ) : app.status === 'rejected' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          REJECTED
                        </span>
                      ) : app.status === 'under_review' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                          UNDER REVIEW
                        </span>
                      ) : app.status === 'cancelled' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          CANCELLED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          SUBMITTED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {['submitted', 'under_review', 'approved'].includes(app.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancel(app.id)}
                          className="px-3 py-1 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Apply for Student Leave</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="leaveTypeSelect" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Leave Type <span className="text-rose-600">*</span>
                </label>
                <select
                  id="leaveTypeSelect"
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDateInput" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Start Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="startDateInput"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endDateInput" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    End Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="endDateInput"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="durationTypeSelect" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Duration Type
                </label>
                <select
                  id="durationTypeSelect"
                  value={durationType}
                  onChange={(e) => setDurationType(e.target.value as DurationType)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full_day">Full Day</option>
                  <option value="half_day_morning">Half Day (Morning)</option>
                  <option value="half_day_afternoon">Half Day (Afternoon)</option>
                </select>
              </div>

              <div>
                <label htmlFor="reasonTextarea" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="reasonTextarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the clear reason for leave"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
