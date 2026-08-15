import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { ROUTE_ALLOWED_ROLES } from '@/lib/auth/constants'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { getStudentSelfAttendanceData } from '@/lib/attendance/queries'
import {
  CalendarCheck,
  CreditCard,
  Award,
  FileCheck,
  CalendarOff,
  FileText,
  TrendingUp,
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap,
} from 'lucide-react'

export default async function StudentPortalPage() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const allowedRoles = ROUTE_ALLOWED_ROLES['/erp/student'] || []
  if (!hasAnyRole(authState.user, allowedRoles)) {
    redirect('/erp/unauthorized')
  }

  const { user } = authState
  const attendanceData = await getStudentSelfAttendanceData().catch(() => null)
  const summary = attendanceData?.summary
  const attPercentage = summary?.attendancePercentage ?? 100

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <PageHeader
        title={`Hello, ${user.fullName}! 👋`}
        description="Welcome to your Roshani Public School Student Portal — access your live attendance record, examination admit cards, report cards, and fee status."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp' },
          { label: 'Student Home' },
        ]}
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Attendance Rate"
          value={`${attPercentage}%`}
          subtitle={`${summary?.presentCount || 0} of ${summary?.totalSchoolDays || 0} days present`}
          icon={CalendarCheck}
          iconColor="blue"
          href="/erp/student/attendance"
        />
        <MetricCard
          title="Academic Session"
          value="2024–2025"
          subtitle="Enrolled & Active"
          icon={GraduationCap}
          iconColor="emerald"
          href="/erp/student/promotion"
        />
        <MetricCard
          title="Exam Hall Ticket"
          value="Available"
          subtitle="QR Verified Admit Card"
          icon={Award}
          iconColor="amber"
          href="/erp/student/admit-cards"
        />
        <MetricCard
          title="Report Cards"
          value="Published"
          subtitle="Term assessments"
          icon={FileCheck}
          iconColor="purple"
          href="/erp/student/results"
        />
      </div>

      {/* Student Action Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/erp/student/attendance"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition group text-center shadow-xs"
        >
          <CalendarCheck className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
            Attendance
          </span>
        </Link>
        <Link
          href="/erp/student/fees"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition group text-center shadow-xs"
        >
          <CreditCard className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
            Fee Ledger
          </span>
        </Link>
        <Link
          href="/erp/student/admit-cards"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition group text-center shadow-xs"
        >
          <Award className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
            Admit Card
          </span>
        </Link>
        <Link
          href="/erp/student/results"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition group text-center shadow-xs"
        >
          <FileCheck className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
            My Results
          </span>
        </Link>
        <Link
          href="/erp/student/documents"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition group text-center shadow-xs"
        >
          <FileText className="w-6 h-6 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
            Certificates
          </span>
        </Link>
        <Link
          href="/erp/student/leave"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition group text-center shadow-xs"
        >
          <CalendarOff className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
            Apply Leave
          </span>
        </Link>
      </div>

      {/* Two-Column Student Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admit Card & Examination Pass */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Official Exam Hall Ticket
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Your official examination admit card contains verified candidate roll numbers, exam instructions, and an authentic QR validation token for entrance verification.
            </p>
          </div>
          <Link
            href="/erp/student/admit-cards"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs"
          >
            <Award className="w-4 h-4" />
            View &amp; Print Admit Card
          </Link>
        </div>

        {/* Results & Progress Report */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Academic Performance &amp; Grades
                </h3>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                Official
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Review subject-by-subject score breakdown, grading scales, aggregate percentages, teacher remarks, and download digital report cards.
            </p>
          </div>
          <Link
            href="/erp/student/results"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs"
          >
            <FileCheck className="w-4 h-4" />
            View Published Results
          </Link>
        </div>
      </div>
    </div>
  )
}
