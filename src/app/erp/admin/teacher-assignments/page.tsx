import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getTeacherAssignments } from '@/lib/attendance/queries'
import { TeacherAssignmentManager } from '@/components/attendance/teacher-assignment-manager'
import { PageHeader } from '@/components/ui/page-header'

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

  // Fetch session, teacher roles, classes/sections, and assignments concurrently
  const [sessionRes, teacherRolesRes, classesRes, assignments] = await Promise.all([
    supabase
      .from('academic_sessions')
      .select('id, name')
      .eq('school_id', user.schoolId)
      .order('is_current', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
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
      .eq('roles.name', 'Teacher'),
    supabase
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
      .order('display_order'),
    getTeacherAssignments(),
  ])

  const session = Array.isArray(sessionRes.data) ? (sessionRes.data[0] as { id: string; name: string } | undefined) : (sessionRes.data as { id: string; name: string } | null)
  const teacherRoles = teacherRolesRes.data || []
  const teachers = teacherRoles
    .map((tr: any) => tr.profiles)
    .filter((p: any) => p && p.status === 'active')

  const classesData = classesRes.data || []

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Teacher &amp; Classroom Allocations"
        description="Allocate faculty as Class Teachers and subject instructors to classes and sections for daily attendance marking and grading."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Teacher Assignments' },
        ]}
      />

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
