import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getStudentAdmitCard } from '@/lib/examinations/admit-card-queries'
import { StudentAdmitCardView } from '@/components/examinations/admit-cards/student-admit-card-view'
import { PageHeader } from '@/components/ui/page-header'

export default async function StudentAdmitCardsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Student', 'Super Admin', 'Admin'])) {
    redirect('/erp/unauthorized')
  }

  const supabase = (await createClient()) as any
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', authState.user.profileId)
    .single()

  const examinations = await getExaminations()
  const latestExamId = examinations[0]?.id || ''
  const admitCard = student && latestExamId ? await getStudentAdmitCard(student.id, latestExamId) : null

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Examination Admit Card"
        description="Download and print your official examination hall ticket with security QR token and verified exam roll number."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/student' },
          { label: 'Admit Card' },
        ]}
      />

      <StudentAdmitCardView admitCard={admitCard} />
    </div>
  )
}
