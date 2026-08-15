import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getStudentById } from '@/lib/students/actions'
import { EditStudentForm } from '@/components/students/edit-student-form'
import { PageHeader } from '@/components/ui/page-header'

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

  const student = studentRes.data as any
  const fullName = `${student.first_name} ${student.last_name}`

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title={`Edit Student: ${fullName}`}
        description={`Admission Number: ${student.admission_number} • Update personal and residential contact information.`}
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Students', href: '/erp/admin/students' },
          { label: fullName, href: `/erp/admin/students/${id}` },
          { label: 'Edit' },
        ]}
      />

      <EditStudentForm student={student} />
    </div>
  )
}
