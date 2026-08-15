import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'
import { AdmissionApplicationForm } from '@/components/admissions/admission-form'
import { PageHeader } from '@/components/ui/page-header'

export default async function NewAdmissionPage() {
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
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <PageHeader
        title="New Admission Application"
        description="Register a new applicant enquiry or submitted application into the admission workflow."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Admissions', href: '/erp/admin/admissions' },
          { label: 'New Application' },
        ]}
      />

      <AdmissionApplicationForm sessions={sessions} classes={classes} />
    </div>
  )
}
