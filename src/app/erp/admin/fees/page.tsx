import {
  getFeeDashboardSummary,
  getFeeHeads,
  getFeeStructures,
  getInvoices,
  getPayments,
  getFinancialLedger,
} from '@/lib/fees/queries'
import { AdminFeeDashboard } from '@/components/fees/admin-fee-dashboard'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
