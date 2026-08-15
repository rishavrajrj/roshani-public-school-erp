import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getClasses } from '@/lib/academic/actions'
import { getExaminations } from '@/lib/examinations/queries'
import { getResultsForAdmin } from '@/lib/examinations/result-queries'
import { AdminResultManager } from '@/components/examinations/results/admin-result-manager'
import { PageHeader } from '@/components/ui/page-header'

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
    <div className="space-y-6 w-full">
      <PageHeader
        title="Result Tabulation &amp; Report Cards"
        description="Compute aggregate percentages, determine student pass/fail criteria, finalize academic grade cards, and publish official report cards."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Results & Marks' },
        ]}
      />

      <AdminResultManager
        examinations={examinations}
        classes={classes}
        results={results}
        userRoles={authState.user.roles}
      />
    </div>
  )
}
