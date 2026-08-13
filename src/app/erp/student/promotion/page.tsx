import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentPromotionStatus } from '@/lib/examinations/promotion-queries'
import { StudentPromotionView } from '@/components/examinations/promotion/student-promotion-view'

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

  const { activeHistory, promotionHistory } = student ? await getStudentPromotionStatus(student.id) : { activeHistory: null, promotionHistory: [] }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <StudentPromotionView activeHistory={activeHistory} promotionHistory={promotionHistory} />
    </div>
  )
}
