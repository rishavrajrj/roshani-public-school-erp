import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getStudentAdmitCard } from '@/lib/examinations/admit-card-queries'
import { ParentAdmitCardView } from '@/components/examinations/admit-cards/parent-admit-card-view'
import { PageHeader } from '@/components/ui/page-header'

export default async function ParentAdmitCardsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Parent', 'Super Admin', 'Admin'])) {
    redirect('/erp/unauthorized')
  }

  const supabase = (await createClient()) as any
  const [psmRes, examinations] = await Promise.all([
    supabase
      .from('parent_student_map')
      .select('student_id, students(first_name, last_name)')
      .eq('parent_profile_id', authState.user.profileId)
      .maybeSingle(),
    getExaminations(),
  ])

  const psm = psmRes.data
  const studentId = psm?.student_id
  const childName = psm?.students ? `${psm.students.first_name || ''} ${psm.students.last_name || ''}`.trim() : 'Ward'

  const latestExamId = examinations[0]?.id || ''
  const admitCard = studentId && latestExamId ? await getStudentAdmitCard(studentId, latestExamId) : null

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title={`Examination Admit Card — ${childName}`}
        description="Download and print candidate hall ticket with digital QR verification token and verified exam roll number."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/parent' },
          { label: 'Admit Card' },
        ]}
      />

      <ParentAdmitCardView admitCard={admitCard} childName={childName} />
    </div>
  )
}
