'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { processLeaveApprovalAction } from '@/lib/leave/actions'

interface ApprovalQueueItem {
  approvalId: string
  stepOrder: number
  approverRole: string
  leaveApplicationId: string
  applicantName: string
  applicantRole: string
  studentName?: string | null
  leaveTypeName: string
  startDate: string
  endDate: string
  durationType: string
  calculatedDays: number
  reason: string
  status: string
}

interface LeaveApprovalQueueClientProps {
  queue: ApprovalQueueItem[]
}

export function LeaveApprovalQueueClient({ queue }: LeaveApprovalQueueClientProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleApprove = async (appId: string) => {
    const comments = prompt('Optional approval remarks:')
    setProcessingId(appId)
    setErrorMessage(null)

    const result = await processLeaveApprovalAction({
      leaveApplicationId: appId,
      approved: true,
      comments: comments || undefined,
    })

    setProcessingId(null)

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to approve leave application.')
    } else {
      router.refresh()
    }
  }

  const handleReject = async (appId: string) => {
    const rejectionReason = prompt('Please enter a rejection reason (mandatory):')
    if (!rejectionReason || rejectionReason.trim().length < 3) {
      alert('A rejection reason (at least 3 characters) is required.')
      return
    }

    setProcessingId(appId)
    setErrorMessage(null)

    const result = await processLeaveApprovalAction({
      leaveApplicationId: appId,
      approved: false,
      rejectionReason: rejectionReason.trim(),
    })

    setProcessingId(null)

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to reject leave application.')
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Approval Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and process pending leave applications assigned for your approval.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Dates</th>
                <th className="py-3.5 px-4">Days</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No pending leave applications in your approval queue.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr key={item.approvalId} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.studentName ? `${item.studentName} (Student)` : item.applicantName}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">{item.applicantRole}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{item.leaveTypeName}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {item.startDate} {item.startDate !== item.endDate ? ` to ${item.endDate}` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.calculatedDays} day(s)</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">{item.reason}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={processingId === item.leaveApplicationId}
                          onClick={() => handleApprove(item.leaveApplicationId)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={processingId === item.leaveApplicationId}
                          onClick={() => handleReject(item.leaveApplicationId)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
