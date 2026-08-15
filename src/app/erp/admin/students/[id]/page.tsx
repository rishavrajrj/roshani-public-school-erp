import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getStudentById } from '@/lib/students/actions'
import { StudentProfileView } from '@/components/students/student-profile-view'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Edit, ArrowLeft } from 'lucide-react'

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

  const student = studentRes.data as any
  const fullName = `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`
  const isAdmin = hasAnyRole(authState.user, ['Super Admin', 'Admin'])

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <PageHeader
        title={fullName}
        description={`Admission Number: ${student.admission_number} • Enrolled Student Record`}
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Students', href: '/erp/admin/students' },
          { label: fullName },
        ]}
        badge={<StatusBadge status={student.status} size="md" />}
        actions={
          isAdmin && (
            <Link
              href={`/erp/admin/students/${student.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition"
            >
              <Edit className="w-4 h-4 text-slate-500" />
              Edit Profile
            </Link>
          )
        }
      />

      <StudentProfileView student={student} userRoles={authState.user.roles} />
    </div>
  )
}
