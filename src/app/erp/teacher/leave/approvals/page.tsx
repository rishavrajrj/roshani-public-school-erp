import { getPendingApprovalsQueue } from '@/lib/leave/queries'
import { LeaveApprovalQueueClient } from '@/components/leave/leave-approval-queue-client'
import { PageHeader } from '@/components/ui/page-header'

export default async function TeacherLeaveApprovalsPage() {
  const queue = await getPendingApprovalsQueue()

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Student Leave Approvals"
        description="Review, verify parent notes/medical certificates, and endorse or approve student leave applications for your class."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/teacher' },
          { label: 'Leave', href: '/erp/teacher/leave' },
          { label: 'Approvals' },
        ]}
      />

      <LeaveApprovalQueueClient queue={queue} />
    </div>
  )
}
