import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getStudentAllPublishedResults,
  getGradingScales,
  getStudentAcademicProfile,
} from '@/lib/examinations/result-queries'
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
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', authState.user.profileId)
    .maybeSingle()

  if (!student) {
    return (
      <div className="space-y-6 w-full">
        <PageHeader
          title="My Academic Performance &amp; Results"
          description="Scholastic performance records, marks breakdowns, GPA indices, and official provisional marksheets."
          breadcrumbs={[
            { label: 'Student Portal', href: '/erp/student' },
            { label: 'Academic Results' },
          ]}
        />
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-xl mx-auto shadow-sm space-y-3">
          <div className="text-3xl">⚠️</div>
          <h3 className="text-lg font-bold text-slate-900">Student Profile Not Linked</h3>
          <p className="text-xs text-slate-500">
            No active student enrollment profile was found linked to your user account. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }

  const [allResults, gradingScales, studentProfile] = await Promise.all([
    getStudentAllPublishedResults(student.id),
    getGradingScales(),
    getStudentAcademicProfile(student.id),
  ])

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="My Academic Performance &amp; Results"
        description="Scholastic performance records, marks breakdowns, GPA indices, and official provisional marksheets."
        breadcrumbs={[
          { label: 'Student Portal', href: '/erp/student' },
          { label: 'Academic Results' },
        ]}
      />

      <StudentResultView
        allResults={allResults}
        gradingScales={gradingScales}
        studentProfile={studentProfile}
      />
    </div>
  )
}

