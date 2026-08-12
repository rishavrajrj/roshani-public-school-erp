import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getStudentById } from '@/lib/students/actions'
import { EditStudentForm } from '@/components/students/edit-student-form'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function EditStudentPage({ params }: Props) {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin'])) {
    redirect('/erp/unauthorized')
  }

  const { id } = await params
  const studentRes = await getStudentById(id)

  if (!studentRes.success || !studentRes.data) {
    redirect('/erp/admin/students')
  }

  return (
    <div className="flex-1 bg-slate-50 p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href={`/erp/admin/students/${id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            &larr; Back to Student Profile
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Edit Student Profile</h1>
        </div>
      </div>

      <EditStudentForm student={studentRes.data as any} />
    </div>
  )
}
