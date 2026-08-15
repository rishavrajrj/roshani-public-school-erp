import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getClasses } from '@/lib/academic/actions'
import { getExaminations } from '@/lib/examinations/queries'
import { getAdmitCardsForAdmin } from '@/lib/examinations/admit-card-queries'
import { AdminAdmitCardManager } from '@/components/examinations/admit-cards/admin-admit-card-manager'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminAdmitCardsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Accountant'])) {
    redirect('/erp/unauthorized')
  }

  const [classesRes, examinations] = await Promise.all([
    getClasses(),
    getExaminations(),
  ])

  const classes = classesRes.success ? classesRes.data : []
  const defaultExamId = examinations[0]?.id || ''
  const admitCards = defaultExamId ? await getAdmitCardsForAdmin(defaultExamId) : []

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Admit Card Batch Generation &amp; Release"
        description="Verify fee clearance prerequisites, batch-generate exam hall tickets with secure QR validation tokens, and publish to students."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Admit Cards' },
        ]}
      />

      <AdminAdmitCardManager
        examinations={examinations}
        classes={classes}
        admitCards={admitCards}
        userRoles={authState.user.roles}
      />
    </div>
  )
}
