import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentPromotionStatus } from '@/lib/examinations/promotion-queries'
import { StudentPromotionView } from '@/components/examinations/promotion/student-promotion-view'
import { PageHeader } from '@/components/ui/page-header'

export default async function StudentPromotionPage() {
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

  const { activeHistory, promotionHistory } = student
    ? await getStudentPromotionStatus(student.id)
    : { activeHistory: null, promotionHistory: [] }

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Session Promotion Status"
        description="Current academic grade level, promotion outcome, and historical session progression record."
        breadcrumbs={[
          { label: 'Student Portal', href: '/erp/student' },
          { label: 'Promotion Status' },
        ]}
      />

      <StudentPromotionView activeHistory={activeHistory} promotionHistory={promotionHistory} />
    </div>
  )
}
