import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getStudentReportCard, getStudentCertificates } from '@/lib/examinations/document-queries'
import { StudentDocumentView } from '@/components/examinations/documents/student-document-view'
import { PageHeader } from '@/components/ui/page-header'

export default async function StudentDocumentsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Student', 'Super Admin', 'Admin'])) {
    redirect('/erp/unauthorized')
  }

  const supabase = (await createClient()) as any
  const [studentRes, examinations] = await Promise.all([
    supabase
      .from('students')
      .select('id')
      .eq('profile_id', authState.user.profileId)
      .single(),
    getExaminations(),
  ])

  const student = studentRes.data
  const latestExamId = examinations[0]?.id || ''

  const [reportCard, certificates] = student
    ? await Promise.all([
        latestExamId ? getStudentReportCard(student.id, latestExamId) : null,
        getStudentCertificates(student.id),
      ])
    : [null, []]

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Official Certificates &amp; Documents"
        description="View and download issued Transfer Certificates (TC), Character Certificates, and Bonafide Certificates with anti-tamper QR verification hashes."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/student' },
          { label: 'Documents' },
        ]}
      />

      <StudentDocumentView reportCard={reportCard} certificates={certificates} />
    </div>
  )
}
