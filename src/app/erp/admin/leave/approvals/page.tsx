import { getPendingApprovalsQueue } from '@/lib/leave/queries'
import { LeaveApprovalQueueClient } from '@/components/leave/leave-approval-queue-client'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminLeaveApprovalsPage() {
  const queue = await getPendingApprovalsQueue()

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Leave Approval Queue"
        description="Review, verify medical/supporting documents, and approve or reject pending leave applications from faculty and students."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Leave', href: '/erp/admin/leave' },
          { label: 'Approvals' },
        ]}
      />

      <LeaveApprovalQueueClient queue={queue} />
    </div>
  )
}
