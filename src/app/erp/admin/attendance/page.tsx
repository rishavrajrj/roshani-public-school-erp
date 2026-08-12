import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getAdminAttendanceOverview } from '@/lib/attendance/queries'
import { AdminAttendanceDashboard } from '@/components/attendance/admin-attendance-dashboard'

interface PageProps {
  searchParams: Promise<{
    date?: string
    sessionId?: string
  }>
}

export default async function AdminAttendancePage({ searchParams }: PageProps) {
  const params = await searchParams
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    return <div className="p-8 text-red-600">Unauthorized session</div>
  }

  const user = authState.user
  if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
    return <div className="p-8 text-red-600">Access Denied. Admin or Principal required.</div>
  }

  const supabase = await createClient()

  // Fetch current academic session if not specified
  let sessionId = params.sessionId
  if (!sessionId) {
    const { data: sessionData } = await supabase
      .from('academic_sessions')
      .select('id')
      .eq('school_id', user.schoolId)
      .eq('is_current', true)
      .single()
    const session = sessionData as { id: string } | null
    sessionId = session?.id
  }

  const selectedDate = params.date || new Date().toISOString().split('T')[0]

  if (!sessionId) {
    return <div className="p-8 text-amber-600">No active academic session found.</div>
  }

  const overview = await getAdminAttendanceOverview(sessionId, selectedDate)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <AdminAttendanceDashboard
        academicSessionId={sessionId}
        attendanceDate={selectedDate}
        overview={overview}
      />
    </div>
  )
}
