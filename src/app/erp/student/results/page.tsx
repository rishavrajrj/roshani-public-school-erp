import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getStudentResult } from '@/lib/examinations/result-queries'
import { StudentResultView } from '@/components/examinations/results/student-result-view'
import { PageHeader } from '@/components/ui/page-header'

export default async function StudentResultsPage() {
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
  const latestExamId = examinations[0]?.id || ''
  const result = student && latestExamId ? await getStudentResult(student.id, latestExamId) : null

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="My Examination Results &amp; Grade Card"
        description="Official subject scores, grading distribution, percentage calculations, and teacher evaluation comments."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/student' },
          { label: 'My Results' },
        ]}
      />

      <StudentResultView result={result} />
    </div>
  )
}
