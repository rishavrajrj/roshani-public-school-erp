import { resolveUser } from '@/lib/auth/resolve-user'
import { createClient } from '@/lib/supabase/server'
import { getInvoices, getPayments } from '@/lib/fees/queries'
import { ParentFeePortal } from '@/components/fees/parent-fee-portal'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { CreditCard } from 'lucide-react'

export default async function StudentFeesPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = await createClient()
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name, admission_number')
    .eq('profile_id', authState.user.profileId)
    .single()

  if (!student) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Student Profile Not Linked"
        description="No student record linked to your user account. Please contact school administration."
      />
    )
  }

  const studentObj = student as any
  const [invoices, payments] = await Promise.all([
    getInvoices(studentObj.id),
    getPayments(studentObj.id),
  ])

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Fee Ledger &amp; Receipts"
        description="Review assigned fee invoices, payment installments, outstanding dues, and download official payment receipts."
        breadcrumbs={[
          { label: 'Student Portal', href: '/erp/student' },
          { label: 'Fee Ledger' },
        ]}
      />

      <ParentFeePortal
        studentName={`${studentObj.first_name} ${studentObj.last_name}`}
        admissionNumber={studentObj.admission_number}
        invoices={invoices}
        payments={payments}
      />
    </div>
  )
}
