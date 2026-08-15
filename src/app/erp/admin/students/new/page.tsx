import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'
import { DirectStudentForm } from '@/components/students/direct-student-form'
import { PageHeader } from '@/components/ui/page-header'

export default async function NewDirectStudentPage() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin'])) {
    redirect('/erp/unauthorized')
  }

  const [sessionsRes, classesRes] = await Promise.all([getAcademicSessions(), getClasses()])

  const sessions = sessionsRes.success ? sessionsRes.data : []
  const classes = classesRes.success ? classesRes.data : []

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title="Direct Administrative Enrollment"
        description="Directly enroll a new student into an academic session, class, and section with roll number assignment."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Students', href: '/erp/admin/students' },
          { label: 'Direct Enrollment' },
        ]}
      />

      <DirectStudentForm sessions={sessions} classes={classes} />
    </div>
  )
}
