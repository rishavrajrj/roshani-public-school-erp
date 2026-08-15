import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getClasses } from '@/lib/academic/actions'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getMarksForClassSubject } from '@/lib/examinations/result-queries'
import { MarksEntryTable } from '@/components/examinations/results/marks-entry-table'
import { PageHeader } from '@/components/ui/page-header'

export default async function TeacherMarksEntryPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Teacher', 'Super Admin', 'Admin', 'Principal'])) {
    redirect('/erp/unauthorized')
  }

  const supabase = (await createClient()) as any
  const [classesRes, examinations, subjectsRes] = await Promise.all([
    getClasses(),
    getExaminations(),
    supabase.from('subjects').select('id, name, code').eq('school_id', authState.user.schoolId),
  ])

  const classes: Array<{ id: string; name: string }> = classesRes.success ? classesRes.data : []
  const subjects = subjectsRes.data || []

  const defaultExamId = examinations[0]?.id || ''
  const defaultClassId = classes[0]?.id || ''
  const defaultSubjectId = subjects[0]?.id || ''

  const marks = (defaultExamId && defaultClassId && defaultSubjectId)
    ? await getMarksForClassSubject(defaultExamId, defaultClassId, defaultSubjectId)
    : []

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Student Marks Entry &amp; Grading"
        description="Select term examination, grade level, and subject to submit marks with real-time maximum mark boundary enforcement."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/teacher' },
          { label: 'Enter Marks' },
        ]}
      />

      <MarksEntryTable
        examinations={examinations}
        classes={classes}
        subjects={subjects}
        initialMarks={marks}
        userRoles={authState.user.roles}
      />
    </div>
  )
}
