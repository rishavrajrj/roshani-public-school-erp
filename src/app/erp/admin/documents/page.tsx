import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getClasses } from '@/lib/academic/actions'
import { getStudents } from '@/lib/students/actions'
import { getExaminations } from '@/lib/examinations/queries'
import { getReportCardsForAdmin, getCertificatesForAdmin } from '@/lib/examinations/document-queries'
import { AdminDocumentManager } from '@/components/examinations/documents/admin-document-manager'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminDocumentsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Accountant'])) {
    redirect('/erp/unauthorized')
  }

  const [classesRes, studentsRes, examinations] = await Promise.all([
    getClasses(),
    getStudents({ page: 1, limit: 200 }),
    getExaminations(),
  ])

  const classes: Array<{ id: string; name: string }> = classesRes.success ? classesRes.data : []
  const studentsData = studentsRes.success && studentsRes.data ? studentsRes.data.students : []
  const students = studentsData.map((s: any) => ({
    id: s.id,
    name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
    admissionNumber: s.admission_number || 'N/A',
  }))

  const defaultExamId = examinations[0]?.id || ''
  const defaultClassId = classes[0]?.id || ''

  const [reportCards, certificates] = await Promise.all([
    (defaultExamId && defaultClassId) ? getReportCardsForAdmin(defaultExamId, defaultClassId) : [],
    getCertificatesForAdmin(),
  ])

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Document Issuance &amp; Certificate Registry"
        description="Issue official Transfer Certificates (TC), Character Certificates, and Bonafide Certificates with anti-tamper QR verification hashes."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Documents' },
        ]}
      />

      <AdminDocumentManager
        classes={classes}
        examinations={examinations}
        students={students}
        reportCards={reportCards}
        certificates={certificates}
        userRoles={authState.user.roles}
      />
    </div>
  )
}
