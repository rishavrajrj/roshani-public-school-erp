import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getAdmissionApplicationById } from '@/lib/admissions/actions'
import { AdmissionDetailView } from '@/components/admissions/admission-detail-view'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function AdmissionDetailPage({ params }: Props) {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) {
    redirect('/erp/unauthorized')
  }

  const { id } = await params
  const appResult = await getAdmissionApplicationById(id)

  if (!appResult.success || !appResult.data) {
    redirect('/erp/admin/admissions')
  }

  const app = appResult.data as any

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <PageHeader
        title={`Application: ${app.application_number}`}
        description={`Applicant: ${app.applicant_first_name} ${app.applicant_last_name} • Applying for Class: ${app.classes?.name || 'N/A'}`}
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Admissions', href: '/erp/admin/admissions' },
          { label: app.application_number },
        ]}
        badge={<StatusBadge status={app.status} size="md" />}
      />

      <AdmissionDetailView application={app} userRoles={authState.user.roles} />
    </div>
  )
}
