import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getStudentAllPublishedResults,
  getGradingScales,
  getStudentAcademicProfile,
} from '@/lib/examinations/result-queries'
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
  const childName = psm?.students
    ? `${psm.students.first_name || ''} ${psm.students.last_name || ''}`.trim()
    : 'Ward'

  if (!studentId) {
    return (
      <div className="space-y-6 w-full">
        <PageHeader
          title="Student Academic Performance"
          description="Official subject scores, grading distribution, aggregate percentage, and faculty remarks."
          breadcrumbs={[
            { label: 'Parent Portal', href: '/erp/parent' },
            { label: 'Academic Results' },
          ]}
        />
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-xl mx-auto shadow-sm space-y-3">
          <div className="text-3xl">👨‍👧</div>
          <h3 className="text-lg font-bold text-slate-900">No Student Profile Linked</h3>
          <p className="text-xs text-slate-500">
            No active student profile is linked to your parent account. Please contact the school office for student mapping.
          </p>
        </div>
      </div>
    )
  }

  const [allResults, gradingScales, studentProfile] = await Promise.all([
    getStudentAllPublishedResults(studentId),
    getGradingScales(),
    getStudentAcademicProfile(studentId),
  ])

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title={`Academic Performance &amp; Grade Card — ${childName}`}
        description="Official subject evaluations, grading scale distribution, GPA trends, and provisional marks statements."
        breadcrumbs={[
          { label: 'Parent Portal', href: '/erp/parent' },
          { label: 'Academic Results' },
        ]}
      />

      <ParentResultView
        allResults={allResults}
        gradingScales={gradingScales}
        studentProfile={studentProfile}
        childName={childName}
      />
    </div>
  )
}

