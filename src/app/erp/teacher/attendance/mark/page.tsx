import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getSectionAttendanceSheet } from '@/lib/attendance/queries'
import { AttendanceMarkingSheet } from '@/components/attendance/attendance-marking-sheet'

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

  // Fetch Class and Section names
  const { data: clsData } = await supabase.from('classes').select('name').eq('id', classId).single()
  const { data: secData } = await supabase.from('sections').select('name').eq('id', sectionId).single()

  const cls = clsData as { name: string } | null
  const sec = secData as { name: string } | null

  const sheetData = await getSectionAttendanceSheet(sessionId, classId, sectionId, date)

  if (!sheetData) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-600">
        No active student enrollment records found for this section.
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <AttendanceMarkingSheet
        academicSessionId={sessionId}
        classId={classId}
        sectionId={sectionId}
        className={cls?.name || 'Class'}
        sectionName={sec?.name || 'Section'}
        attendanceDate={date}
        initialStatus={sheetData.status}
        students={sheetData.students}
        isAdmin={isAdminOrSuper}
      />
    </div>
  )
}
