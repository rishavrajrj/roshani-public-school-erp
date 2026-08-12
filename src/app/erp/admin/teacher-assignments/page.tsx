import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getTeacherAssignments } from '@/lib/attendance/queries'
import { TeacherAssignmentManager } from '@/components/attendance/teacher-assignment-manager'

export default async function TeacherAssignmentsPage() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    return <div className="p-8 text-red-600">Unauthorized session</div>
  }

  const user = authState.user
  if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
    return <div className="p-8 text-red-600">Access Denied. Admin privileges required.</div>
  }

  const supabase = await createClient()

  // Fetch active session
  const { data: sessionData } = await supabase
    .from('academic_sessions')
    .select('id, name')
    .eq('school_id', user.schoolId)
    .eq('is_current', true)
    .single()

  const session = sessionData as { id: string; name: string } | null

  // Fetch teachers (profiles with Teacher role)
  const { data: teacherRoles } = await supabase
    .from('user_roles')
    .select(`
      profile_id,
      profiles (
        id,
        full_name,
        status
      ),
      roles!inner(name)
    `)
    .eq('school_id', user.schoolId)
    .eq('roles.name', 'Teacher')

  const teachers = (teacherRoles || [])
    .map((tr: any) => tr.profiles)
    .filter((p: any) => p && p.status === 'active')

  // Fetch classes and sections
  const { data: classesData } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      sections (
        id,
        name
      )
    `)
    .eq('school_id', user.schoolId)
    .eq('status', 'active')
    .order('display_order')

  const assignments = await getTeacherAssignments()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teacher Class Assignments</h1>
        <p className="text-sm text-slate-600">Assign teachers to classes and sections for attendance management.</p>
      </div>

      <TeacherAssignmentManager
        currentSessionId={session?.id || ''}
        currentSessionName={session?.name || 'Current Session'}
        teachers={teachers || []}
        classes={(classesData as any) || []}
        assignments={assignments}
      />
    </div>
  )
}
