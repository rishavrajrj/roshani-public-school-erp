import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { ROUTE_ALLOWED_ROLES } from '@/lib/auth/constants'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { getStudents } from '@/lib/students/actions'
import { getAdmissionApplications } from '@/lib/admissions/actions'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'
import { getPendingApprovalsQueue } from '@/lib/leave/queries'
import { getExaminations } from '@/lib/examinations/queries'
import {
  Users,
  UserPlus,
  CalendarCheck,
  GraduationCap,
  CalendarOff,
  ArrowRight,
  TrendingUp,
  Award,
  FileText,
  ShieldCheck,
  BarChart3,
  Layers,
} from 'lucide-react'

export default async function PrincipalPortalPage() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const allowedRoles = ROUTE_ALLOWED_ROLES['/erp/principal'] || []
  if (!hasAnyRole(authState.user, allowedRoles)) {
    redirect('/erp/unauthorized')
  }

  const { user } = authState

  // Parallel fetching of executive datasets
  const [
    studentsRes,
    admissionsRes,
    sessionsRes,
    classesRes,
    leaveRes,
    examsRes,
  ] = await Promise.all([
    getStudents({ status: 'active', limit: 5 }),
    getAdmissionApplications({ status: 'all', limit: 5 }),
    getAcademicSessions(),
    getClasses(),
    getPendingApprovalsQueue().catch(() => []),
    getExaminations().catch(() => []),
  ])

  const totalStudents = studentsRes.success ? studentsRes.data.total : 0
  const totalAdmissions = admissionsRes.success ? admissionsRes.data.total : 0
  const recentAdmissions = admissionsRes.success ? admissionsRes.data.applications : []
  const classesList = classesRes.success ? classesRes.data : []
  const currentSession: any = sessionsRes.success
    ? (sessionsRes.data as any[]).find((s: any) => s.is_current) || (sessionsRes.data as any[])[0]
    : null
  const pendingLeaves = Array.isArray(leaveRes)
    ? leaveRes.filter((l: any) => l.status === 'pending')
    : []
  const examinations = Array.isArray(examsRes) ? examsRes : []

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <PageHeader
        title={`Principal Dashboard — ${user.fullName}`}
        description="Institutional leadership and oversight — monitor school strength, academic terms, exam schedules, and policy approvals."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp' },
          { label: 'Principal Overview' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Student Body"
          value={totalStudents}
          subtitle={`Distributed across ${classesList.length} classes`}
          icon={Users}
          iconColor="purple"
          href="/erp/principal/students"
        />
        <MetricCard
          title="Enrolment Pipeline"
          value={totalAdmissions}
          subtitle={`${currentSession?.name || 'Academic Session'}`}
          icon={UserPlus}
          iconColor="blue"
          href="/erp/principal/admissions"
        />
        <MetricCard
          title="Executive Approvals"
          value={pendingLeaves.length}
          subtitle="Staff & student leave requests"
          icon={CalendarOff}
          iconColor="amber"
          href="/erp/principal/leave"
        />
        <MetricCard
          title="Academic Terms"
          value={examinations.length}
          subtitle="Active examination cycles"
          icon={GraduationCap}
          iconColor="emerald"
          href="/erp/principal/examinations"
        />
      </div>

      {/* Executive Quick Links Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Institutional Management Workspaces
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/erp/principal/attendance"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 transition group text-center"
          >
            <CalendarCheck className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-purple-700">
              Attendance
            </span>
          </Link>
          <Link
            href="/erp/principal/results"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition group text-center"
          >
            <BarChart3 className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
              Academic Results
            </span>
          </Link>
          <Link
            href="/erp/principal/examinations"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition group text-center"
          >
            <GraduationCap className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700">
              Examinations
            </span>
          </Link>
          <Link
            href="/erp/principal/admit-cards"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition group text-center"
          >
            <Award className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-700">
              Admit Cards
            </span>
          </Link>
          <Link
            href="/erp/principal/documents"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 transition group text-center"
          >
            <FileText className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-rose-700">
              Certificates
            </span>
          </Link>
          <Link
            href="/erp/principal/promotion"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition group text-center"
          >
            <TrendingUp className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700">
              Promotions
            </span>
          </Link>
        </div>
      </div>

      {/* Operational Two-Column Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Pending Leave &amp; Duty Approvals
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff &amp; student requests requiring executive clearance
              </p>
            </div>
            <Link
              href="/erp/principal/leave"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              Queue ({pendingLeaves.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingLeaves.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All leave applications have been reviewed. Zero pending items.
              </div>
            ) : (
              pendingLeaves.slice(0, 4).map((l: any) => (
                <div key={l.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{l.applicantName || 'Staff Member'}</span>
                      <StatusBadge status={l.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {l.leaveTypeName || 'Leave'} • {l.startDate} to {l.endDate}
                    </p>
                  </div>
                  <Link
                    href="/erp/principal/leave"
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold rounded-lg transition shrink-0"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Academic Structure Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Class Distribution &amp; Sections
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active grade levels and classroom divisions
              </p>
            </div>
            <Link
              href="/erp/principal/students"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {classesList.map((c: any) => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {Array.isArray(c.sections) ? `${c.sections.length} Sections` : 'Enrolled'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
