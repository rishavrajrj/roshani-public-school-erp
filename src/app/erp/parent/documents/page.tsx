import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getStudentReportCard, getStudentCertificates } from '@/lib/examinations/document-queries'
import { ParentDocumentView } from '@/components/examinations/documents/parent-document-view'

export default async function ParentDocumentsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Parent', 'Super Admin', 'Admin'])) {
    redirect('/erp/unauthorized')
  }

  const supabase = (await createClient()) as any
  const { data: psm } = await supabase
    .from('parent_student_map')
    .select('student_id, students(first_name, last_name)')
    .eq('parent_profile_id', authState.user.profileId)
    .maybeSingle()

  const studentId = psm?.student_id
  const childName = psm?.students ? `${psm.students.first_name || ''} ${psm.students.last_name || ''}`.trim() : 'Ward'

  const examinations = await getExaminations()
  const latestExamId = examinations[0]?.id || ''

  const [reportCard, certificates] = studentId
    ? await Promise.all([
        latestExamId ? getStudentReportCard(studentId, latestExamId) : null,
        getStudentCertificates(studentId),
      ])
    : [null, []]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <ParentDocumentView reportCard={reportCard} certificates={certificates} childName={childName} />
    </div>
  )
}
