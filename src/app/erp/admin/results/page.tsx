import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getClasses } from '@/lib/academic/actions'
import { getExaminations } from '@/lib/examinations/queries'
import { getResultsForAdmin } from '@/lib/examinations/result-queries'
import { AdminResultManager } from '@/components/examinations/results/admin-result-manager'

export default async function AdminResultsPage() {
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

  const classes: Array<{ id: string; name: string }> = classesRes.success ? classesRes.data : []
  const defaultExamId = examinations[0]?.id || ''
  const defaultClassId = classes[0]?.id || ''

  const results = (defaultExamId && defaultClassId) ? await getResultsForAdmin(defaultExamId, defaultClassId) : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <AdminResultManager
        examinations={examinations}
        classes={classes}
        results={results}
        userRoles={authState.user.roles}
      />
    </div>
  )
}
