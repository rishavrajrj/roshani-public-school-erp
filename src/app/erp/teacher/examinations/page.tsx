import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getTeacherExamSchedule } from '@/lib/examinations/queries'
import { TeacherScheduleView } from '@/components/examinations/teacher-schedule-view'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <TeacherScheduleView schedules={schedules} />
    </div>
  )
}
