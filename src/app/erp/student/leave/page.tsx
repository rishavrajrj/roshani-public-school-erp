import { getLeaveTypes, getUserLeaveApplications } from '@/lib/leave/queries'
import { StudentLeaveClient } from '@/components/leave/student-leave-client'
import { PageHeader } from '@/components/ui/page-header'

export default async function StudentLeavePage() {
  const leaveTypes = await getLeaveTypes('student')
  const applications = await getUserLeaveApplications()

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Apply for Leave"
        description="Submit leave requests to your class teacher, upload supporting medical slips, and monitor approval status."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/student' },
          { label: 'Apply Leave' },
        ]}
      />

      <StudentLeaveClient
        leaveTypes={leaveTypes}
        applications={applications}
      />
    </div>
  )
}
