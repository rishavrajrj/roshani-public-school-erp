import Link from 'next/link'
import { getLeaveTypes, getUserLeaveApplications, getPendingApprovalsQueue } from '@/lib/leave/queries'
import { StudentLeaveClient } from '@/components/leave/student-leave-client'
import { PageHeader } from '@/components/ui/page-header'
import { CalendarOff, ArrowRight } from 'lucide-react'

export default async function AdminLeavePage() {
  const leaveTypes = await getLeaveTypes('staff')
  const applications = await getUserLeaveApplications()
  const pendingApprovals = await getPendingApprovalsQueue()

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Leave Management &amp; Staff Requests"
        description="Apply for administrative leave, review personal leave history, and process student/faculty leave approval requests."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Leave' },
        ]}
        actions={
          pendingApprovals.length > 0 && (
            <Link
              href="/erp/admin/leave/approvals"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
            >
              <CalendarOff className="w-4 h-4" />
              Approvals Queue ({pendingApprovals.length})
            </Link>
          )
        }
      />

      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <p className="text-xs sm:text-sm font-bold text-amber-900">
              You have {pendingApprovals.length} pending leave application(s) awaiting administrative action.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Review applicant reasons, medical certificates, and approve/reject requests.
            </p>
          </div>
          <Link
            href="/erp/admin/leave/approvals"
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-xl transition shrink-0"
          >
            Review Approvals <ArrowRight className="w-3.5 h-3.5" />
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
