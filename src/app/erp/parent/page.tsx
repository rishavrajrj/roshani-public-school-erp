import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { ROUTE_ALLOWED_ROLES } from '@/lib/auth/constants'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { getParentAttendanceData } from '@/lib/attendance/queries'
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
  Users,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    studentId?: string
  }>
}

export default async function ParentPortalPage({ searchParams }: PageProps) {
  const params = await searchParams
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const allowedRoles = ROUTE_ALLOWED_ROLES['/erp/parent'] || []
  if (!hasAnyRole(authState.user, allowedRoles)) {
    redirect('/erp/unauthorized')
  }

  const { user } = authState
  const parentData = await getParentAttendanceData(params.studentId).catch(() => null)

  if (!parentData || parentData.children.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="FAMILY & GUARDIAN PORTAL"
          title={`Welcome, ${user.fullName}`}
          description="Parent Portal — family academic tracking, fee payments, examination hall tickets, and progress reports."
          breadcrumbs={[
            { label: 'Parent ERP Portal', href: '/erp/parent' },
            { label: 'Overview' },
          ]}
        />
        <EmptyState
          icon={HeartHandshake}
          title="No Student Records Linked"
          description="Your guardian account has not yet been linked with enrolled student profiles. Please contact school administration."
        />
      </div>
    )
  }

  const { children, selectedStudent, summary } = parentData
  const attPercentage = summary?.attendancePercentage ?? 100

  return (
    <div className="space-y-6">
      {/* Parent Header */}
      <PageHeader
        eyebrow="FAMILY & GUARDIAN PORTAL"
        title={`Welcome, ${user.fullName}`}
        description="Monitor your children's live attendance, examination hall tickets, term report cards, and fee payment ledger."
        breadcrumbs={[
          { label: 'Parent ERP Portal', href: '/erp/parent' },
          { label: 'Overview' },
        ]}
      />

      {/* Multi-Ward Child Switcher Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1554C0]" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">
              Select Ward / Child Profile
            </h3>
          </div>
          <span className="text-xs sm:text-sm text-slate-600 font-medium">
            Currently Viewing: <strong className="text-slate-900 font-bold">{selectedStudent?.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {children.map((c: any) => {
            const isSelected = c.id === selectedStudent?.id
            return (
              <Link
                key={c.id}
                href={`/erp/parent?studentId=${c.id}`}
                prefetch={true}
                className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between shadow-2xs ${
                  isSelected
                    ? 'bg-blue-50/90 border-[#1554C0] text-blue-950 shadow-xs ring-1 ring-[#1554C0]/20'
                    : 'bg-slate-50/80 border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                      isSelected ? 'bg-[#1554C0] text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {c.name?.[0] || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-600 font-mono font-medium">Adm: {c.admissionNumber}</p>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1554C0] shrink-0" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* KPI Overview for Selected Child */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Attendance Rate"
          value={`${attPercentage}%`}
          subtitle={`${summary?.presentCount || 0} of ${summary?.totalSchoolDays || 0} days attended`}
          icon={CalendarCheck}
          iconColor="emerald"
          href={`/erp/parent/attendance?studentId=${selectedStudent?.id}`}
        />
        <MetricCard
          title="Fee Status"
          value="View Dues"
          subtitle="Online receipt & ledger"
          icon={CreditCard}
          iconColor="amber"
          href="/erp/parent/fees"
        />
        <MetricCard
          title="Admit Card"
          value="Active"
          subtitle="QR Exam Hall Ticket"
          icon={Award}
          iconColor="blue"
          href="/erp/parent/admit-cards"
        />
        <MetricCard
          title="Report Cards"
          value="Published"
          subtitle="Term assessments"
          icon={FileCheck}
          iconColor="purple"
          href="/erp/parent/results"
        />
      </div>

      {/* Quick Launch Action Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href={`/erp/parent/attendance?studentId=${selectedStudent?.id}`}
          prefetch={true}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 transition group text-center shadow-xs cursor-pointer"
        >
          <CalendarCheck className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
            Attendance
          </span>
        </Link>
        <Link
          href="/erp/parent/fees"
          prefetch={true}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 transition group text-center shadow-xs cursor-pointer"
        >
          <CreditCard className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
            Fees &amp; Pay
          </span>
        </Link>
        <Link
          href="/erp/parent/admit-cards"
          prefetch={true}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 transition group text-center shadow-xs cursor-pointer"
        >
          <Award className="w-6 h-6 text-[#1554C0] mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-[#1554C0]">
            Admit Card
          </span>
        </Link>
        <Link
          href="/erp/parent/results"
          prefetch={true}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-purple-50/80 border border-slate-200 hover:border-purple-300 transition group text-center shadow-xs cursor-pointer"
        >
          <FileCheck className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
            Report Cards
          </span>
        </Link>
        <Link
          href="/erp/parent/documents"
          prefetch={true}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-rose-50/80 border border-slate-200 hover:border-rose-300 transition group text-center shadow-xs cursor-pointer"
        >
          <FileText className="w-6 h-6 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
            Certificates
          </span>
        </Link>
        <Link
          href="/erp/parent/leave"
          prefetch={true}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 transition group text-center shadow-xs cursor-pointer"
        >
          <CalendarOff className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
            Request Leave
          </span>
        </Link>
      </div>

      {/* Two-Column Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fees & Online Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Fee Payments &amp; Invoices
                </h3>
              </div>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 uppercase font-mono shadow-2xs">
                Direct Counter / Pay
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-medium">
              Review current billing term installments, concession adjustments, clear outstanding balances, and download official fee receipts.
            </p>
          </div>
          <Link
            href="/erp/parent/fees"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            Manage &amp; Pay Fees
          </Link>
        </div>

        {/* Examinations & Report Cards */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Academic Report Cards &amp; Grades
                </h3>
              </div>
              <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300 uppercase font-mono shadow-2xs">
                Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-medium">
              Access official evaluation grade cards, subject scores, teacher feedback comments, and promotional progression updates.
            </p>
          </div>
          <Link
            href="/erp/parent/results"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            View Grade &amp; Report Cards
          </Link>
        </div>
      </div>
    </div>
  )
}
