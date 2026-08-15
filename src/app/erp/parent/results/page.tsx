import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getStudentResult } from '@/lib/examinations/result-queries'
import { ParentResultView } from '@/components/examinations/results/parent-result-view'
import { PageHeader } from '@/components/ui/page-header'

export default async function ParentResultsPage() {
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

  const examinations = await getExaminations()
  const latestExamId = examinations[0]?.id || ''
  const result = studentId && latestExamId ? await getStudentResult(studentId, latestExamId) : null

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title={`Academic Grade &amp; Report Card — ${childName}`}
        description="Official subject scores, grading distribution, aggregate percentage, and faculty remarks."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/parent' },
          { label: 'Report Card' },
        ]}
      />

      <ParentResultView result={result} childName={childName} />
    </div>
  )
}
