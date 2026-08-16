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
        eyebrow="CLASSROOM OPERATIONS & TEACHER DESK"
        title={`Teacher Cockpit — ${user.fullName}`}
        description="Daily classroom workflow — mark student attendance registers, enter examination marks, review invigilation duties, and manage leave applications."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp' },
          { label: 'Teacher Desk' },
        ]}
        actions={
          assignments.length > 0 && (
            <Link
              href={`/erp/teacher/attendance/mark?sessionId=${assignments[0].academicSessionId}&classId=${assignments[0].classId}&sectionId=${assignments[0].sectionId}&date=${todayDate}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition shadow-emerald-950/15"
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
          title="Today's Register"
          value={new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          subtitle={`Session Date: ${todayDate}`}
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
          subtitle="Staff applications logged"
          icon={CalendarOff}
          iconColor="purple"
          href="/erp/teacher/leave"
        />
      </div>

      {/* Assigned Classes Quick Attendance Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              My Assigned Classes — Fast Single-Tap Attendance
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
              Launch rapid single-tap attendance marking sheets for today
            </p>
          </div>
          <Link
            href="/erp/teacher/attendance"
            className="text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
          >
            All Classes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs sm:text-sm text-slate-500 font-medium">
            No class sections currently assigned. Please contact the school administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {assignments.map((a: any) => (
              <div
                key={a.id}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-300 hover:border-emerald-400 transition flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 font-mono shadow-2xs">
                      {a.sessionName || 'Session'}
                    </span>
                    <span className="text-xs font-bold text-slate-600">Class Teacher</span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {a.className} — {a.sectionName}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <Link
                    href={`/erp/teacher/attendance/mark?sessionId=${a.academicSessionId}&classId=${a.classId}&sectionId=${a.sectionId}&date=${todayDate}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Examination Marks Submission
              </h3>
              <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 text-[#1554C0] border border-blue-100 flex items-center justify-center shadow-2xs">
                <ClipboardList className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-medium">
              Enter subject scores for assigned students with boundary checks against maximum marks and instant grade computation.
            </p>
          </div>
          <Link
            href="/erp/teacher/marks"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1554C0] hover:bg-[#0F44A3] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
          >
            Open Marks Entry Grid <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Leave Portal Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Teacher Leave Portal
              </h3>
              <div className="w-8.5 h-8.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shadow-2xs">
                <CalendarOff className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-medium">
              Apply for casual, medical, or duty leave, upload medical certificates, and track approval status from administration.
            </p>
          </div>
          <Link
            href="/erp/teacher/leave"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
          >
            Apply for Leave <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
