import { resolveUser } from '@/lib/auth/resolve-user'
import { createClient } from '@/lib/supabase/server'
import { getInvoices, getPayments } from '@/lib/fees/queries'
import { ParentFeePortal } from '@/components/fees/parent-fee-portal'

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
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-600">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">My Fee Portal</h1>
        <p className="text-sm">Student profile not linked. Please contact administration.</p>
      </div>
    )
  }

  const studentObj = student as any
  const [invoices, payments] = await Promise.all([
    getInvoices(studentObj.id),
    getPayments(studentObj.id),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <ParentFeePortal
        studentName={`${studentObj.first_name} ${studentObj.last_name}`}
        admissionNumber={studentObj.admission_number}
        invoices={invoices}
        payments={payments}
      />
    </div>
  )
}
