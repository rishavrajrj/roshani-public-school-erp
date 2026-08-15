import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getTeacherExamSchedule } from '@/lib/examinations/queries'
import { TeacherScheduleView } from '@/components/examinations/teacher-schedule-view'
import { PageHeader } from '@/components/ui/page-header'

export default async function TeacherExaminationsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Teacher', 'Super Admin', 'Admin', 'Principal'])) {
    redirect('/erp/unauthorized')
  }

  const schedules = await getTeacherExamSchedule()

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Examination Invigilation Schedule"
        description="Assigned examination rooms, subject timings, and candidate supervision schedules."
        breadcrumbs={[
          { label: 'Teacher ERP Portal', href: '/erp/teacher' },
          { label: 'Exam Schedule' },
        ]}
      />

      <TeacherScheduleView schedules={schedules} />
    </div>
  )
}
