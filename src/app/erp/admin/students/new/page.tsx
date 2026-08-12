import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'
import { DirectStudentForm } from '@/components/students/direct-student-form'

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
    <div className="flex-1 bg-slate-50 p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href="/erp/admin/students" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            &larr; Back to Student Directory
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Direct Administrative Enrollment</h1>
        </div>
      </div>

      <DirectStudentForm sessions={sessions} classes={classes} />
    </div>
  )
}
