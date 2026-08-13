import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'
import { createClient } from '@/lib/supabase/server'
import { getExamTypes, getExaminations, getExamSchedules, getAvailableInvigilators } from '@/lib/examinations/queries'
import { ExamMasterDashboard } from '@/components/examinations/exam-master-dashboard'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
