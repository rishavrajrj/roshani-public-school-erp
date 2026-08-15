import { getParentAttendanceData } from '@/lib/attendance/queries'
import { getInvoices, getPayments } from '@/lib/fees/queries'
import { ParentFeePortal } from '@/components/fees/parent-fee-portal'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { CreditCard, HeartHandshake } from 'lucide-react'

export default async function ParentFeesPage() {
  const parentData = await getParentAttendanceData()

  if (!parentData || parentData.children.length === 0 || !parentData.selectedStudent) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="No Linked Student Profiles"
        description="No linked student profiles found for your account. Please contact school administration."
      />
    )
  }

  const selectedChild = parentData.selectedStudent
  const [invoices, payments] = await Promise.all([
    getInvoices(selectedChild.id),
    getPayments(selectedChild.id),
  ])

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Child Fee Portal &amp; Ledger"
        description={`Review invoice dues, payment installment history, and download official receipts for ${selectedChild.name}.`}
        breadcrumbs={[
          { label: 'Parent ERP Portal', href: '/erp/parent' },
          { label: 'Fee Portal' },
        ]}
      />

      <ParentFeePortal
        studentName={selectedChild.name}
        admissionNumber={selectedChild.admissionNumber}
        invoices={invoices}
        payments={payments}
      />
    </div>
  )
}
