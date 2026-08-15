import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getSectionAttendanceSheet } from '@/lib/attendance/queries'
import { AttendanceMarkingSheet } from '@/components/attendance/attendance-marking-sheet'
import { PageHeader } from '@/components/ui/page-header'

interface PageProps {
  searchParams: Promise<{
    sessionId?: string
    classId?: string
    sectionId?: string
    date?: string
  }>
}

export default async function MarkAttendancePage({ searchParams }: PageProps) {
  const params = await searchParams
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const user = authState.user
  const isAdminOrSuper = hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])
  const isTeacher = hasAnyRole(user, ['Teacher'])

  if (!isAdminOrSuper && !isTeacher) {
    return <div className="p-8 text-red-600">Access Denied</div>
  }

  const { sessionId, classId, sectionId, date } = params

  if (!sessionId || !classId || !sectionId || !date) {
    return <div className="p-8 text-amber-600">Invalid session or class parameters specified.</div>
  }

  const supabase = await createClient()

  // Fetch Class, Section names and attendance sheet concurrently
  const [clsRes, secRes, sheetData] = await Promise.all([
    supabase.from('classes').select('name').eq('id', classId).single(),
    supabase.from('sections').select('name').eq('id', sectionId).single(),
    getSectionAttendanceSheet(sessionId, classId, sectionId, date),
  ])

  const cls = clsRes.data as { name: string } | null
  const sec = secRes.data as { name: string } | null

  if (!sheetData) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-600">
        No active student enrollment records found for this section.
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title={`Mark Attendance — ${cls?.name || 'Class'} (${sec?.name || 'Section'})`}
        description={`Record daily student status for Date: ${date}. Use single-tap toggle controls for rapid data entry.`}
        breadcrumbs={[
          { label: 'Teacher ERP Portal', href: '/erp/teacher' },
          { label: 'Attendance', href: '/erp/teacher/attendance' },
          { label: 'Mark Attendance' },
        ]}
      />

      <AttendanceMarkingSheet
        academicSessionId={sessionId}
        classId={classId}
        sectionId={sectionId}
        className={cls?.name || 'Class'}
        sectionName={sec?.name || 'Section'}
        attendanceDate={date}
        sessionStatus={sheetData.status}
        initialStudents={sheetData.students}
      />
    </div>
  )
}
