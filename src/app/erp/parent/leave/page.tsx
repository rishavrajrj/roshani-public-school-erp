import { getLeaveTypes, getUserLeaveApplications } from '@/lib/leave/queries'
import { getParentChildren } from '@/lib/attendance/queries'
import { ParentLeaveClient } from '@/components/leave/parent-leave-client'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarOff, HeartHandshake } from 'lucide-react'

export default async function ParentLeavePage() {
  const [leaveTypes, parentInfo] = await Promise.all([
    getLeaveTypes('student'),
    getParentChildren(),
  ])

  if (!parentInfo || parentInfo.children.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="No Linked Student Profiles"
        description="No linked student profiles found for your account. Please contact school administration."
      />
    )
  }

  const selectedStudent = parentInfo.children[0]
  const applications = await getUserLeaveApplications(selectedStudent.id)

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Apply Student Leave"
        description="Submit leave requests for your child to their class teacher, attach medical slips, and monitor approval status."
        breadcrumbs={[
          { label: 'Parent ERP Portal', href: '/erp/parent' },
          { label: 'Leave' },
        ]}
      />

      <ParentLeaveClient
        leaveTypes={leaveTypes}
        childrenList={parentInfo.children}
        selectedChild={selectedStudent}
        applications={applications}
      />
    </div>
  )
}

