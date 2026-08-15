import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { ROUTE_ALLOWED_ROLES } from '@/lib/auth/constants'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { getTeacherAssignments } from '@/lib/attendance/queries'
import { getTeacherExamSchedule } from '@/lib/examinations/queries'
import { getUserLeaveApplications } from '@/lib/leave/queries'
import {
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  CalendarOff,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'

export default async function TeacherPortalPage() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const allowedRoles = ROUTE_ALLOWED_ROLES['/erp/teacher'] || []
  if (!hasAnyRole(authState.user, allowedRoles)) {
    redirect('/erp/unauthorized')
  }

  const { user } = authState
  const todayDate = new Date().toISOString().split('T')[0]

  const [assignments, schedules, leaveApplications] = await Promise.all([
    getTeacherAssignments(user.profileId).catch(() => []),
    getTeacherExamSchedule().catch(() => []),
    getUserLeaveApplications().catch(() => []),
  ])

  return (
    <div className="space-y-6">
      {/* Teacher Header */}
      <PageHeader
        title={`Teacher Cockpit — ${user.fullName}`}
        description="Daily classroom workflow — mark student attendance, submit examination marks, review schedules, and manage leave requests."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp' },
          { label: 'Teacher Dashboard' },
        ]}
        actions={
          assignments.length > 0 && (
            <Link
              href={`/erp/teacher/attendance/mark?sessionId=${assignments[0].academicSessionId}&classId=${assignments[0].classId}&sectionId=${assignments[0].sectionId}&date=${todayDate}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
            >
              <CalendarCheck className="w-4 h-4" />
              Mark Today&apos;s Attendance
            </Link>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Assigned Classes"
          value={assignments.length}
          subtitle="Active section allocations"
          icon={BookOpen}
          iconColor="emerald"
          href="/erp/teacher/attendance"
        />
        <MetricCard
          title="Today's Date"
          value={new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          subtitle="Daily register open"
          icon={CalendarCheck}
          iconColor="blue"
          href="/erp/teacher/attendance"
        />
        <MetricCard
          title="Scheduled Duties"
          value={schedules.length}
          subtitle="Exam invigilation allocations"
          icon={GraduationCap}
          iconColor="amber"
          href="/erp/teacher/examinations"
        />
        <MetricCard
          title="My Leave History"
          value={leaveApplications.length}
          subtitle="Applications logged"
          icon={CalendarOff}
          iconColor="purple"
          href="/erp/teacher/leave"
        />
      </div>

      {/* Assigned Classes Quick Attendance Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              My Assigned Classes — Fast Attendance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Launch rapid single-tap attendance marking sheets for today
            </p>
          </div>
          <Link
            href="/erp/teacher/attendance"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            All Classes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
            No class sections currently assigned. Please contact the administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {assignments.map((a: any) => (
              <div
                key={a.id}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {a.sessionName || 'Session'}
                    </span>
                    <span className="text-xs text-slate-400">Class Teacher</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    {a.className} — {a.sectionName}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <Link
                    href={`/erp/teacher/attendance/mark?sessionId=${a.academicSessionId}&classId=${a.classId}&sectionId=${a.sectionId}&date=${todayDate}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    Mark Today ({todayDate})
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-Column Action Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Marks Entry Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Examination Marks Submission
              </h3>
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Enter subject scores for assigned students with boundary checks against maximum marks and instant grade computation.
            </p>
          </div>
          <Link
            href="/erp/teacher/marks"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition"
          >
            Open Marks Entry Grid <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Leave Portal Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Teacher Leave Application
              </h3>
              <CalendarOff className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Apply for casual, medical, or duty leave, upload medical certificates, and track approval status from administration.
            </p>
          </div>
          <Link
            href="/erp/teacher/leave"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition"
          >
            Apply for Leave <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
