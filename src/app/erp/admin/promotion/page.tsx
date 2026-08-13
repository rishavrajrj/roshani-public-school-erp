import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { redirect } from 'next/navigation'
import { getClasses } from '@/lib/academic/actions'
import { createClient } from '@/lib/supabase/server'
import { getExaminations } from '@/lib/examinations/queries'
import { getPromotionWorkspaceData } from '@/lib/examinations/promotion-queries'
import { AdminPromotionWorkspace } from '@/components/examinations/promotion/admin-promotion-workspace'

export default async function AdminPromotionPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Accountant'])) {
    redirect('/erp/unauthorized')
  }

  const supabase = (await createClient()) as any
  const { data: sessionsData } = await supabase.from('academic_sessions').select('id, name').eq('school_id', authState.user.schoolId).order('start_date', { ascending: false })

  const [classesRes, examinations] = await Promise.all([
    getClasses(),
    getExaminations(),
  ])

  const sessions = sessionsData || []
  const classes: Array<{ id: string; name: string }> = classesRes.success ? classesRes.data : []

  const sourceSessionId = sessions[0]?.id || ''
  const targetSessionId = sessions[1]?.id || sessions[0]?.id || ''
  const sourceClassId = classes[0]?.id || ''

  const records = (sourceSessionId && targetSessionId && sourceClassId)
    ? await getPromotionWorkspaceData(sourceSessionId, targetSessionId, sourceClassId)
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <AdminPromotionWorkspace
        sessions={sessions}
        classes={classes}
        examinations={examinations}
        existingRecords={records}
        userRoles={authState.user.roles}
      />
    </div>
  )
}
