import { getLeaveTypes, getUserLeaveApplications } from '@/lib/leave/queries'
import { StudentLeaveClient } from '@/components/leave/student-leave-client'

export default async function StudentLeavePage() {
  const leaveTypes = await getLeaveTypes('student')
  const applications = await getUserLeaveApplications()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <StudentLeaveClient
        leaveTypes={leaveTypes}
        applications={applications}
      />
    </div>
  )
}
