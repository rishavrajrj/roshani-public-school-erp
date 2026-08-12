import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getAdmissionApplicationById } from '@/lib/admissions/actions'
import { AdmissionDetailView } from '@/components/admissions/admission-detail-view'

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

  return (
    <div className="flex-1 bg-slate-50 p-6 max-w-6xl mx-auto w-full">
      <div className="mb-4">
        <Link href="/erp/admin/admissions" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
          &larr; Back to Admissions List
        </Link>
      </div>

      <AdmissionDetailView application={appResult.data as any} userRoles={authState.user.roles} />
    </div>
  )
}
