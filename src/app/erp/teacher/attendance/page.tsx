import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getTeacherAssignments } from '@/lib/attendance/queries'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarCheck, BookOpen, Clock, ArrowRight } from 'lucide-react'

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
    <div className="space-y-6 w-full">
      <PageHeader
        title="Class Attendance Portal"
        description="Select an assigned classroom section to record daily student presence, absences, or late arrivals."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/teacher' },
          { label: 'Attendance' },
        ]}
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No Section Assignments Found"
          description="You are not currently assigned to any class section for the active session. Please contact school administration."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((a: any) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                    {a.sessionName || 'Session'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Class Teacher</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {a.className} — Section {a.sectionName}
                </h3>
                <p className="text-xs text-slate-500 mb-4">Official Daily Attendance Register</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href={`/erp/teacher/attendance/mark?sessionId=${a.academicSessionId}&classId=${a.classId}&sectionId=${a.sectionId}&date=${todayDate}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition shadow-xs"
                >
                  <CalendarCheck className="w-4 h-4" />
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
