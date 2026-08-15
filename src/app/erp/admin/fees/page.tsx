import {
  getFeeDashboardSummary,
  getFeeHeads,
  getFeeStructures,
  getInvoices,
  getPayments,
  getFinancialLedger,
} from '@/lib/fees/queries'
import { AdminFeeDashboard } from '@/components/fees/admin-fee-dashboard'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminFeesPage() {
  const [summary, feeHeads, feeStructures, invoices, payments, ledger] = await Promise.all([
    getFeeDashboardSummary(),
    getFeeHeads(),
    getFeeStructures(),
    getInvoices(),
    getPayments(),
    getFinancialLedger(),
  ])

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Fee Structure &amp; Ledger Configuration"
        description="Configure academic fee heads, class-wise installment structures, concessions, and student invoice ledger generation."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Fee Configuration' },
        ]}
      />

      <AdminFeeDashboard
        summary={summary}
        feeHeads={feeHeads}
        feeStructures={feeStructures}
        invoices={invoices}
        payments={payments}
        ledger={ledger}
      />
    </div>
  )
}
