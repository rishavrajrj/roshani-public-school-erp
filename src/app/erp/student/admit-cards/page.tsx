import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPublishedAdmitCardsForStudent, getStudentAdmitCard } from '@/lib/examinations/admit-card-queries'
import { getExaminations } from '@/lib/examinations/queries'
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
  const [studentRes, examinations] = await Promise.all([
    supabase
      .from('students')
      .select('id')
      .eq('profile_id', authState.user.profileId)
      .single(),
    getExaminations(),
  ])

  const student = studentRes.data
  let publishedCards: any[] = []

  if (student) {
    publishedCards = await getPublishedAdmitCardsForStudent(student.id)
    // Fallback check if student has card for latest exam
    if (publishedCards.length === 0 && examinations.length > 0) {
      const single = await getStudentAdmitCard(student.id, examinations[0].id)
      if (single && single.status === 'published') {
        publishedCards = [single]
      }
    }
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Examination Admit Card"
        description="Download and print your official examination hall ticket with security QR token and verified exam roll number."
        breadcrumbs={[
          { label: 'Student Portal', href: '/erp/student' },
          { label: 'Admit Card' },
        ]}
      />

      <StudentAdmitCardView admitCards={publishedCards} admitCard={publishedCards[0] || null} />
    </div>
  )
}
