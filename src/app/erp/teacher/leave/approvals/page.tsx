import { getPendingApprovalsQueue } from '@/lib/leave/queries'
import { LeaveApprovalQueueClient } from '@/components/leave/leave-approval-queue-client'

export default async function TeacherLeaveApprovalsPage() {
  const queue = await getPendingApprovalsQueue()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <LeaveApprovalQueueClient queue={queue} />
    </div>
  )
}
