import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getClasses } from '@/lib/academic/actions'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getMarksForClassSubject } from '@/lib/examinations/result-queries'
import { MarksEntryTable } from '@/components/examinations/results/marks-entry-table'

export default async function TeacherMarksEntryPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Teacher', 'Super Admin', 'Admin', 'Principal'])) {
    redirect('/erp/unauthorized')
  }

  const supabase = (await createClient()) as any
  const { data: subjectsData } = await supabase.from('subjects').select('id, name, code').eq('school_id', authState.user.schoolId)

  const [classesRes, examinations] = await Promise.all([
    getClasses(),
    getExaminations(),
  ])

  const classes: Array<{ id: string; name: string }> = classesRes.success ? classesRes.data : []
  const subjects = subjectsData || []

  const defaultExamId = examinations[0]?.id || ''
  const defaultClassId = classes[0]?.id || ''
  const defaultSubjectId = subjects[0]?.id || ''

  const marks = (defaultExamId && defaultClassId && defaultSubjectId)
    ? await getMarksForClassSubject(defaultExamId, defaultClassId, defaultSubjectId)
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
