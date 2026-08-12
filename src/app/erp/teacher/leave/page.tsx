import Link from 'next/link'
import { getLeaveTypes, getUserLeaveApplications, getPendingApprovalsQueue } from '@/lib/leave/queries'
import { StudentLeaveClient } from '@/components/leave/student-leave-client'

export default async function TeacherLeavePage() {
  const leaveTypes = await getLeaveTypes('staff')
  const applications = await getUserLeaveApplications()
  const pendingApprovals = await getPendingApprovalsQueue()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-amber-900">
              You have {pendingApprovals.length} student leave request(s) awaiting your review.
            </p>
            <p className="text-xs text-amber-700">Class Teacher approval required.</p>
          </div>
          <Link
            href="/erp/teacher/leave/approvals"
            className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
          >
            Review Approvals
          </Link>
        </div>
      )}

      <StudentLeaveClient
        leaveTypes={leaveTypes}
        applications={applications}
      />
    </div>
  )
}
