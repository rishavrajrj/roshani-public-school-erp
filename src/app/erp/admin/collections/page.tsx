import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import {
  getCollectionRegister,
  getDateRangeCollectionReport,
  getStaffWiseCollectionReport,
  getPaymentModeReport,
  getDailyReconciliation,
  getReconciliationHistory,
} from '@/lib/fees/collection-queries'
import { getPayments } from '@/lib/fees/queries'
import { CollectionRegister } from '@/components/fees/collection-register'
import { CollectionReports } from '@/components/fees/collection-reports'
import { CashReconciliation } from '@/components/fees/cash-reconciliation'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminCollectionsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Accountant'])) {
    redirect('/erp/unauthorized')
  }

  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString().split('T')[0]

  const [
    collectionRegister,
    dateRangeReport,
    staffReport,
    paymentModeReport,
    todayReconciliation,
    reconciliationHistory,
    allPayments,
  ] = await Promise.all([
    getCollectionRegister({ fromDate: monthStart, toDate: today }),
    getDateRangeCollectionReport(monthStart, today),
    getStaffWiseCollectionReport(monthStart, today),
    getPaymentModeReport(monthStart, today),
    getDailyReconciliation(today),
    getReconciliationHistory(monthStart, today),
    getPayments(),
  ])

  // Extract unique staff list from payments
  const staffMap = new Map<string, string>()
  if (allPayments && Array.isArray(allPayments)) {
    for (const p of allPayments) {
      const pAny = p as any
      if (pAny.received_by || p.receivedBy) {
        const id = pAny.received_by || p.receivedBy
        const name = p.receivedByName || p.studentName || 'Staff'
        if (id && !staffMap.has(id)) {
          staffMap.set(id, name)
        }
      }
    }
  }
  const staffList = Array.from(staffMap.entries()).map(([id, name]) => ({ id, name }))

  return (
    <div className="space-y-8 w-full">
      <PageHeader
        title="Fee Collection &amp; Cash Reconciliation"
        description="Daily counter payment register, payment mode breakdown (Cash/UPI/Cheque), transaction logs, and end-of-day financial reconciliation."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Collections' },
        ]}
      />

      {/* Collection Register */}
      <section className="space-y-4">
        <CollectionRegister
          payments={collectionRegister || []}
          staffList={staffList}
        />
      </section>

      {/* Reports */}
      <section className="space-y-4">
        <CollectionReports
          dateRangeReport={dateRangeReport}
          staffReport={staffReport || []}
          paymentModeReport={paymentModeReport || []}
        />
      </section>

      {/* Cash Reconciliation */}
      <section className="space-y-4">
        <CashReconciliation
          todayReconciliation={todayReconciliation}
          reconciliationHistory={reconciliationHistory || []}
          userRoles={authState.user.roles}
        />
      </section>
    </div>
  )
}
