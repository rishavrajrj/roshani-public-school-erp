import { getLeaveTypes, getUserLeaveApplications } from '@/lib/leave/queries'
import { getParentAttendanceData } from '@/lib/attendance/queries'
import { ParentLeaveClient } from '@/components/leave/parent-leave-client'

export default async function ParentLeavePage() {
  const leaveTypes = await getLeaveTypes('student')
  const parentData = await getParentAttendanceData()

  if (!parentData || parentData.children.length === 0 || !parentData.selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-600">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Apply Student Leave</h1>
        <p className="text-sm">No linked student profiles found for your account. Please contact school administration.</p>
      </div>
    )
  }

  const selectedStudent = parentData.selectedStudent
  const applications = await getUserLeaveApplications(selectedStudent.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <ParentLeaveClient
        leaveTypes={leaveTypes}
        childrenList={parentData.children}
        selectedChild={selectedStudent}
        applications={applications}
      />
    </div>
  )
}
