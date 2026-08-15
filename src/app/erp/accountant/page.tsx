import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { ROUTE_ALLOWED_ROLES } from '@/lib/auth/constants'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  getFeeDashboardSummary,
  getInvoices,
  getPayments,
} from '@/lib/fees/queries'
import {
  getDailyReconciliation,
  getPaymentModeReport,
  getCollectionRegister,
} from '@/lib/fees/collection-queries'
import {
  CreditCard,
  Receipt,
  ArrowRight,
  TrendingUp,
  Banknote,
  DollarSign,
  AlertCircle,
  Plus,
  CheckCircle2,
} from 'lucide-react'

export default async function AccountantPortalPage() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const allowedRoles = ROUTE_ALLOWED_ROLES['/erp/accountant'] || []
  if (!hasAnyRole(authState.user, allowedRoles)) {
    redirect('/erp/unauthorized')
  }

  const { user } = authState
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString().split('T')[0]

  const [
    summary,
    todayReconciliation,
    paymentModeReport,
    recentPayments,
  ] = await Promise.all([
    getFeeDashboardSummary().catch(() => null),
    getDailyReconciliation(today).catch(() => null),
    getPaymentModeReport(monthStart, today).catch(() => []),
    getCollectionRegister({ fromDate: monthStart, toDate: today }).catch(() => []),
  ])

  const totalCollected = summary?.totalCollected || 0
  const totalOutstanding = summary?.totalOutstanding || 0
  const todayCollected = todayReconciliation?.totalAmount || 0

  return (
    <div className="space-y-6">
      {/* Finance Header */}
      <PageHeader
        title={`Finance Dashboard — ${user.fullName}`}
        description="Accounts Office & Fee Counter — track daily cash collection, monitor outstanding student dues, reconcile UPI/Cheque/Cash receipts, and generate invoices."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp' },
          { label: 'Accountant Overview' },
        ]}
        actions={
          <Link
            href="/erp/accountant/collections"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
          >
            <Receipt className="w-4 h-4" />
            + Collect Fee at Counter
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Collection"
          value={`₹${todayCollected.toLocaleString('en-IN')}`}
          subtitle={`Counter date: ${today}`}
          icon={Banknote}
          iconColor="amber"
          href="/erp/accountant/collections"
        />
        <MetricCard
          title="Total Fees Collected"
          value={`₹${totalCollected.toLocaleString('en-IN')}`}
          subtitle="Active academic session"
          icon={TrendingUp}
          iconColor="emerald"
          href="/erp/accountant/fees"
        />
        <MetricCard
          title="Pending Dues"
          value={`₹${totalOutstanding.toLocaleString('en-IN')}`}
          subtitle="Unpaid / partial student balances"
          icon={AlertCircle}
          iconColor="rose"
          href="/erp/accountant/fees"
        />
        <MetricCard
          title="Recent Transactions"
          value={recentPayments.length}
          subtitle="This billing month"
          icon={CreditCard}
          iconColor="blue"
          href="/erp/accountant/collections"
        />
      </div>

      {/* Payment Modes & Reconciliation Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Channels Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Payment Channel Breakdown
              </h3>
              <span className="text-xs text-slate-400">Month-to-Date</span>
            </div>

            <div className="space-y-3">
              {paymentModeReport.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No payment collections logged this month yet.
                </p>
              ) : (
                paymentModeReport.map((pm: any) => (
                  <div
                    key={pm.mode}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                        {pm.mode}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{Number(pm.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {pm.count} transaction(s)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Reconcile Daily Register</span>
            <Link
              href="/erp/accountant/collections"
              className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
            >
              Open Reconciliation <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Recent Counter Receipts
              </h3>
              <Link
                href="/erp/accountant/collections"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                Full Register <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentPayments.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No payment transactions found.
                </p>
              ) : (
                recentPayments.slice(0, 4).map((p: any) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">
                        {p.receiptNumber || 'Receipt'}
                      </span>
                      <span className="text-slate-500">
                        {p.studentName || 'Student'} • {p.paymentMode}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 text-sm block">
                        ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                      </span>
                      <StatusBadge status={p.status || 'paid'} size="sm" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/erp/accountant/collections"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition"
            >
              <Receipt className="w-4 h-4" />
              Fee Collection Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
