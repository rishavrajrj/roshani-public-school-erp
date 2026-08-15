import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'
import { createClient } from '@/lib/supabase/server'
import { getExamTypes, getExaminations, getExamSchedules, getAvailableInvigilators } from '@/lib/examinations/queries'
import { ExamMasterDashboard } from '@/components/examinations/exam-master-dashboard'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminExaminationsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) {
    redirect('/erp/unauthorized')
  }

  const supabase = (await createClient()) as any
  const { data: subjectsData } = await supabase.from('subjects').select('id, name, code').eq('school_id', authState.user.schoolId)

  const [sessionsRes, classesRes, examTypes, examinations, schedules, invigilators] = await Promise.all([
    getAcademicSessions(),
    getClasses(),
    getExamTypes(),
    getExaminations(),
    getExamSchedules(),
    getAvailableInvigilators(),
  ])

  const sessions = sessionsRes.success ? sessionsRes.data : []
  const classes = classesRes.success ? classesRes.data : []
  const subjects = subjectsData || []

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Examination Master &amp; Date Sheets"
        description="Schedule academic terms (Mid-Term, Final, Unit Tests), assign subjects, set maximum/passing marks, and allocate invigilators."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Examinations' },
        ]}
      />

      <ExamMasterDashboard
        examinations={examinations}
        examTypes={examTypes}
        academicSessions={sessions}
        classes={classes}
        subjects={subjects}
        schedules={schedules}
        invigilatorOptions={invigilators}
        userRoles={authState.user.roles}
      />
    </div>
  )
}
