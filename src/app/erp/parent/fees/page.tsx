import { getParentAttendanceData } from '@/lib/attendance/queries'
import { getInvoices, getPayments } from '@/lib/fees/queries'
import { ParentFeePortal } from '@/components/fees/parent-fee-portal'

export default async function ParentFeesPage() {
  const parentData = await getParentAttendanceData()

  if (!parentData || parentData.children.length === 0 || !parentData.selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-600">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Student Fee Portal</h1>
        <p className="text-sm">No linked student profiles found for your account. Please contact school administration.</p>
      </div>
    )
  }

  const selectedChild = parentData.selectedStudent
  const [invoices, payments] = await Promise.all([
    getInvoices(selectedChild.id),
    getPayments(selectedChild.id),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <ParentFeePortal
        studentName={selectedChild.name}
        admissionNumber={selectedChild.admissionNumber}
        invoices={invoices}
        payments={payments}
      />
    </div>
  )
}
