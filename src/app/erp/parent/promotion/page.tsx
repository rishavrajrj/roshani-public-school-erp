import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentPromotionStatus } from '@/lib/examinations/promotion-queries'
import { ParentPromotionView } from '@/components/examinations/promotion/parent-promotion-view'

export default async function ParentPromotionPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Parent', 'Super Admin', 'Admin'])) {
    redirect('/erp/unauthorized')
  }

  const supabase = (await createClient()) as any
  const { data: psm } = await supabase
    .from('parent_student_map')
    .select('student_id, students(first_name, last_name)')
    .eq('parent_profile_id', authState.user.profileId)
    .maybeSingle()

  const studentId = psm?.student_id
  const childName = psm?.students ? `${psm.students.first_name || ''} ${psm.students.last_name || ''}`.trim() : 'Ward'

  const { activeHistory, promotionHistory } = studentId ? await getStudentPromotionStatus(studentId) : { activeHistory: null, promotionHistory: [] }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <ParentPromotionView activeHistory={activeHistory} promotionHistory={promotionHistory} childName={childName} />
    </div>
  )
}
