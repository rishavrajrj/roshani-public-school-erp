import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getClasses } from '@/lib/academic/actions'
import { getExaminations } from '@/lib/examinations/queries'
import { getAdmitCardsForAdmin } from '@/lib/examinations/admit-card-queries'
import { AdminAdmitCardManager } from '@/components/examinations/admit-cards/admin-admit-card-manager'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <AdminAdmitCardManager
        examinations={examinations}
        classes={classes}
        admitCards={admitCards}
        userRoles={authState.user.roles}
      />
    </div>
  )
}
