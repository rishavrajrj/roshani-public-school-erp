import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getTeacherAssignments } from '@/lib/attendance/queries'

export default async function TeacherAttendanceDashboard() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    return <div className="p-8 text-red-600">Unauthorized session</div>
  }

  const user = authState.user
  if (!hasAnyRole(user, ['Teacher', 'Super Admin', 'Admin', 'Principal'])) {
    return <div className="p-8 text-red-600">Access Denied. Teacher access required.</div>
  }

  const assignments = await getTeacherAssignments(user.profileId)
  const todayDate = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Portal</h1>
        <p className="text-sm text-slate-600">Select an assigned class and section to mark or review attendance.</p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl text-center">
          <h3 className="font-semibold text-lg mb-1">No Section Assignments Found</h3>
          <p className="text-sm">
            You are not currently assigned to any class section for the active academic session.
            Please contact your school administrator to assign your sections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold uppercase px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">
                    {a.sessionName}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Active</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {a.className} — Section {a.sectionName}
                </h3>
                <p className="text-xs text-slate-500 mb-4">Assigned Section</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  href={`/erp/teacher/attendance/mark?sessionId=${a.academicSessionId}&classId=${a.classId}&sectionId=${a.sectionId}&date=${todayDate}`}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-2 px-4 rounded-lg text-sm transition shadow-sm"
                >
                  Mark Today ({todayDate})
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
