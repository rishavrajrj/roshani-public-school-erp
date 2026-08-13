import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getStudentResult } from '@/lib/examinations/result-queries'
import { StudentResultView } from '@/components/examinations/results/student-result-view'

export default async function StudentResultsPage() {
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
  const result = student && latestExamId ? await getStudentResult(student.id, latestExamId) : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <StudentResultView result={result} />
    </div>
  )
}
