import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getStudentById } from '@/lib/students/actions'
import { StudentProfileView } from '@/components/students/student-profile-view'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function StudentDetailPage({ params }: Props) {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Parent', 'Student'])) {
    redirect('/erp/unauthorized')
  }

  const { id } = await params
  const studentRes = await getStudentById(id)

  if (!studentRes.success || !studentRes.data) {
    redirect('/erp/admin/students')
  }

  return (
    <div className="flex-1 bg-slate-50 p-6 max-w-6xl mx-auto w-full">
      <div className="mb-4">
        <Link href="/erp/admin/students" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
          &larr; Back to Student Directory
        </Link>
      </div>

      <StudentProfileView student={studentRes.data as any} userRoles={authState.user.roles} />
    </div>
  )
}
