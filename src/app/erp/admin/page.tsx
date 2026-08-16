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
  CreditCard,
  GraduationCap,
  CalendarOff,
  Plus,
  ArrowRight,
  TrendingUp,
  Receipt,
  Award,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'

export default async function AdminPortalPage() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const allowedRoles = ROUTE_ALLOWED_ROLES['/erp/admin'] || []
  if (!hasAnyRole(authState.user, allowedRoles)) {
    redirect('/erp/unauthorized')
  }

  const { user } = authState

  // Fetch real operational data in parallel
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
  const recentStudents = studentsRes.success ? studentsRes.data.students : []
  const totalAdmissions = admissionsRes.success ? admissionsRes.data.total : 0
  const recentAdmissions = admissionsRes.success ? admissionsRes.data.applications : []
  const classesList = classesRes.success ? classesRes.data : []
  const currentSession: any = sessionsRes.success
    ? (sessionsRes.data as any[]).find((s: any) => s.is_current) || (sessionsRes.data as any[])[0]
    : null
  const pendingLeaves = Array.isArray(leaveRes)
    ? leaveRes.filter((l: any) => l.status === 'pending')
    : []
  const upcomingExams = Array.isArray(examsRes) ? examsRes.slice(0, 4) : []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="ADMINISTRATIVE COMMAND CENTER"
        title={`Welcome back, ${user.fullName}`}
        description="Roshani Public School Operations Cockpit — monitor admissions pipeline, daily attendance, fee collections, academic schedules, and staff workflows."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp' },
          { label: 'Admin Command Center' },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/erp/admin/students/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1554C0] hover:bg-[#0F44A3] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition shadow-blue-950/15"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </Link>
            <Link
              href="/erp/admin/admissions/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              New Application
            </Link>
          </div>
        }
      />

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Students"
          value={totalStudents}
          subtitle={`Across ${classesList.length} classes`}
          icon={Users}
          iconColor="blue"
          href="/erp/admin/students"
        />
        <MetricCard
          title="Admission Applications"
          value={totalAdmissions}
          subtitle={`${currentSession?.name || 'Current Session'}`}
          icon={UserPlus}
          iconColor="amber"
          href="/erp/admin/admissions"
        />
        <MetricCard
          title="Pending Approvals"
          value={pendingLeaves.length}
          subtitle="Staff & student leave requests"
          icon={CalendarOff}
          iconColor="purple"
          href="/erp/admin/leave"
        />
        <MetricCard
          title="Scheduled Exams"
          value={upcomingExams.length}
          subtitle="Active academic assessments"
          icon={GraduationCap}
          iconColor="emerald"
          href="/erp/admin/examinations"
        />
      </div>

      {/* Direct Operational Shortcuts Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 font-mono mb-4">
          Direct Operational Shortcuts
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/erp/admin/attendance"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 transition group text-center shadow-2xs"
          >
            <div className="w-9.5 h-9.5 rounded-xl bg-blue-100/70 flex items-center justify-center text-[#1554C0] mb-2 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#1554C0]">
              Attendance
            </span>
          </Link>
          <Link
            href="/erp/admin/collections"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 transition group text-center shadow-2xs"
          >
            <div className="w-9.5 h-9.5 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-700 mb-2 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
              Collect Fees
            </span>
          </Link>
          <Link
            href="/erp/admin/admit-cards"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 transition group text-center shadow-2xs"
          >
            <div className="w-9.5 h-9.5 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-700 mb-2 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
              Admit Cards
            </span>
          </Link>
          <Link
            href="/erp/admin/results"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 transition group text-center shadow-2xs"
          >
            <div className="w-9.5 h-9.5 rounded-xl bg-indigo-100/70 flex items-center justify-center text-indigo-700 mb-2 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
              Publish Results
            </span>
          </Link>
          <Link
            href="/erp/admin/documents"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200 hover:border-purple-300 transition group text-center shadow-2xs"
          >
            <div className="w-9.5 h-9.5 rounded-xl bg-purple-100/70 flex items-center justify-center text-purple-700 mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
              Issue Certificate
            </span>
          </Link>
          <Link
            href="/erp/admin/promotion"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-rose-50/80 border border-slate-200 hover:border-rose-300 transition group text-center shadow-2xs"
          >
            <div className="w-9.5 h-9.5 rounded-xl bg-rose-100/70 flex items-center justify-center text-rose-700 mb-2 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
              Promotion
            </span>
          </Link>
        </div>
      </div>

      {/* Two-Column Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions Applications Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-200/90 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Recent Admission Applications
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                  Latest enquiries pending review &amp; student conversion
                </p>
              </div>
              <Link
                href="/erp/admin/admissions"
                className="text-xs sm:text-sm font-bold text-[#1554C0] hover:text-[#0F44A3] flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentAdmissions.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-slate-500 font-medium">
                  No admission applications recorded.
                </div>
              ) : (
                recentAdmissions.map((app: any) => (
                  <div
                    key={app.id}
                    className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                          {app.application_number}
                        </span>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-1">
                        {app.applicant_first_name} {app.applicant_last_name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                        Class: {(app.classes as any)?.name || 'N/A'} &bull; Guardian: {app.guardian_name}
                      </p>
                    </div>
                    <Link
                      href={`/erp/admin/admissions/${app.id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-[#1554C0] text-xs font-bold rounded-lg border border-slate-300 transition shrink-0 shadow-2xs"
                    >
                      Review
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-600 font-medium">
              Total Recorded: <strong className="text-slate-900 font-bold">{totalAdmissions}</strong>
            </span>
            <Link
              href="/erp/admin/admissions/new"
              className="text-[#1554C0] hover:text-[#0F44A3] font-bold"
            >
              + Register New Enquiry
            </Link>
          </div>
        </div>

        {/* Recently Enrolled Students Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-200/90 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Recently Enrolled Students
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                  Active student profiles and academic enrollments
                </p>
              </div>
              <Link
                href="/erp/admin/students"
                className="text-xs sm:text-sm font-bold text-[#1554C0] hover:text-[#0F44A3] flex items-center gap-1"
              >
                Directory <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentStudents.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-slate-500 font-medium">
                  No student records found.
                </div>
              ) : (
                recentStudents.map((st: any) => (
                  <div
                    key={st.id}
                    className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-[#1554C0] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {st.first_name?.[0]}
                        {st.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {st.first_name} {st.last_name}
                          </p>
                          <StatusBadge status={st.status} size="sm" />
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 font-mono font-medium">
                          Adm #: {st.admission_number}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/erp/admin/students/${st.id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-[#1554C0] text-xs font-bold rounded-lg border border-slate-300 transition shrink-0 shadow-2xs"
                    >
                      Profile &rarr;
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-600 font-medium">
              Total Enrolled: <strong className="text-slate-900 font-bold">{totalStudents}</strong>
            </span>
            <Link
              href="/erp/admin/students/new"
              className="text-[#1554C0] hover:text-[#0F44A3] font-bold"
            >
              + Direct Enrollment
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
