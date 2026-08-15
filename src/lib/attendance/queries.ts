import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { calculateAttendanceSummary } from './calculations'
import type { AttendanceStatus, AttendanceSessionStatus } from '@/types/attendance'

export async function getTeacherAssignments(teacherProfileId?: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const user = authState.user
  const supabase = await createClient()

  let query = (supabase as any)
    .from('teacher_assignments')
    .select(`
      id,
      school_id,
      teacher_profile_id,
      academic_session_id,
      class_id,
      section_id,
      assigned_at,
      assigned_by,
      active,
      classes(name),
      sections(name),
      academic_sessions(name),
      profiles!teacher_assignments_teacher_profile_id_fkey(full_name)
    `)
    .eq('school_id', user.schoolId)
    .eq('active', true)

  const isAdminOrSuper = hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])
  if (!isAdminOrSuper) {
    // Teacher can only view own assignments
    query = query.eq('teacher_profile_id', user.profileId)
  } else if (teacherProfileId) {
    query = query.eq('teacher_profile_id', teacherProfileId)
  }

  const { data, error } = await query

  if (error || !data) return []

  return (data as any[]).map((item: any) => ({
    id: item.id,
    schoolId: item.school_id,
    teacherProfileId: item.teacher_profile_id,
    academicSessionId: item.academic_session_id,
    classId: item.class_id,
    sectionId: item.section_id,
    assignedAt: item.assigned_at,
    assignedBy: item.assigned_by,
    active: item.active,
    className: item.classes?.name,
    sectionName: item.sections?.name,
    sessionName: item.academic_sessions?.name,
    teacherName: item.profiles?.full_name,
  }))
}

export async function getSectionAttendanceSheet(
  academicSessionId: string,
  classId: string,
  sectionId: string,
  attendanceDate: string
) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const user = authState.user
  const supabase = await createClient()

  // 1. Fetch section session state if exists
  const { data: sessionData } = await (supabase as any)
    .from('attendance_sessions')
    .select('id, status, marked_by, marked_at, locked_at, locked_by')
    .eq('school_id', user.schoolId)
    .eq('academic_session_id', academicSessionId)
    .eq('class_id', classId)
    .eq('section_id', sectionId)
    .eq('attendance_date', attendanceDate)
    .maybeSingle()

  const sessObj = sessionData as any

  // 2. Fetch enrolled active students ONLY (students.status = 'active' AND sah.status = 'active')
  const { data: historyData, error: historyError } = await (supabase as any)
    .from('student_academic_history')
    .select(`
      roll_number,
      students!inner (
        id,
        first_name,
        last_name,
        admission_number,
        status
      )
    `)
    .eq('school_id', user.schoolId)
    .eq('academic_session_id', academicSessionId)
    .eq('class_id', classId)
    .eq('section_id', sectionId)
    .eq('status', 'active')
    .eq('students.status', 'active')

  if (historyError || !historyData) {
    return null
  }

  // 3. Fetch existing attendance records if session exists
  const recordsMap: Record<string, { id: string; status: AttendanceStatus; remarks: string | null; correctionReason: string | null }> = {}
  if (sessObj) {
    const { data: recData } = await (supabase as any)
      .from('attendance_records')
      .select('id, student_id, status, remarks, correction_reason')
      .eq('session_id', sessObj.id)

    if (recData) {
      for (const r of (recData as any[])) {
        recordsMap[r.student_id] = {
          id: r.id,
          status: r.status as AttendanceStatus,
          remarks: r.remarks,
          correctionReason: r.correction_reason,
        }
      }
    }
  }

  const studentList = (historyData as any[]).map((h: any) => {
    const st = h.students
    const existing = recordsMap[st.id]
    return {
      studentId: st.id,
      firstName: st.first_name,
      lastName: st.last_name,
      admissionNumber: st.admission_number,
      rollNumber: h.roll_number,
      status: existing ? existing.status : ('present' as AttendanceStatus),
      remarks: existing ? existing.remarks : null,
      correctionReason: existing ? existing.correctionReason : null,
      recordId: existing ? existing.id : undefined,
    }
  })

  // Sort student list by roll number or first name
  studentList.sort((a, b) => {
    if (a.rollNumber && b.rollNumber) {
      return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true })
    }
    return a.firstName.localeCompare(b.firstName)
  })

  return {
    sessionId: sessObj?.id || null,
    status: (sessObj?.status as AttendanceSessionStatus) || 'draft',
    lockedAt: sessObj?.locked_at || null,
    markedAt: sessObj?.marked_at || null,
    students: studentList,
  }
}

export async function getAdminAttendanceOverview(academicSessionId: string, attendanceDate: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const user = authState.user
  const supabase = await createClient()

  // Fetch all classes & sections for school
  const { data: classesData } = await (supabase as any)
    .from('classes')
    .select(`
      id,
      name,
      display_order,
      sections (
        id,
        name
      )
    `)
    .eq('school_id', user.schoolId)
    .eq('status', 'active')
    .order('display_order')

  if (!classesData) return []

  // Fetch attendance sessions for this date
  const { data: sessionsData } = await (supabase as any)
    .from('attendance_sessions')
    .select('id, class_id, section_id, status, marked_at, locked_at')
    .eq('school_id', user.schoolId)
    .eq('academic_session_id', academicSessionId)
    .eq('attendance_date', attendanceDate)

  const sessionMap: Record<string, any> = {}
  if (sessionsData) {
    for (const s of (sessionsData as any[])) {
      sessionMap[`${s.class_id}_${s.section_id}`] = s
    }
  }

  const overview: Array<{
    classId: string
    className: string
    sectionId: string
    sectionName: string
    sessionId: string | null
    status: AttendanceSessionStatus | 'pending'
    markedAt: string | null
    lockedAt: string | null
  }> = []

  for (const c of (classesData as any[])) {
    const sections = (c.sections as any[]) || []
    for (const s of sections) {
      const sess = sessionMap[`${c.id}_${s.id}`]
      overview.push({
        classId: c.id,
        className: c.name,
        sectionId: s.id,
        sectionName: s.name,
        sessionId: sess ? sess.id : null,
        status: sess ? sess.status : 'pending',
        markedAt: sess ? sess.marked_at : null,
        lockedAt: sess ? sess.locked_at : null,
      })
    }
  }

  return overview
}

export async function getParentAttendanceData(studentId?: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const user = authState.user
  const supabase = await createClient()

  // Fetch guardian profile
  const { data: guardian } = await (supabase as any)
    .from('guardians')
    .select('id')
    .eq('profile_id', user.profileId)
    .single()

  const guardianObj = guardian as { id: string } | null
  if (!guardianObj) return null

  // Fetch parent's linked children
  const { data: sgData, error: sgError } = await (supabase as any)
    .from('student_guardians')
    .select(`
      student_id,
      students!student_id (
        id,
        first_name,
        last_name,
        admission_number
      )
    `)
    .eq('school_id', user.schoolId)
    .eq('guardian_id', guardianObj.id)

  if (sgError || !sgData || sgData.length === 0) {
    return { children: [], selectedStudent: null, records: [], summary: null }
  }

  const children = (sgData as any[]).map((item: any) => ({
    id: item.students.id,
    name: `${item.students.first_name} ${item.students.last_name}`,
    admissionNumber: item.students.admission_number,
  }))

  const targetStudentId = studentId || children[0].id

  // Security check: ensure target student is in parent's linked children
  const selectedStudent = children.find((c) => c.id === targetStudentId) || children[0]
  if (!selectedStudent) {
    return null
  }

  // Fetch historical attendance records for target student
  const { data: recordsData } = await (supabase as any)
    .from('attendance_records')
    .select(`
      id,
      attendance_date,
      status,
      remarks,
      classes(name),
      sections(name)
    `)
    .eq('school_id', user.schoolId)
    .eq('student_id', selectedStudent.id)
    .order('attendance_date', { ascending: false })
    .limit(180)

  const records = ((recordsData as any[]) || []).map((r: any) => ({
    id: r.id,
    date: r.attendance_date,
    status: r.status as AttendanceStatus,
    remarks: r.remarks,
    className: r.classes?.name,
    sectionName: r.sections?.name,
  }))

  const summary = calculateAttendanceSummary(records.map((r) => r.status))

  return {
    children,
    selectedStudent,
    records,
    summary,
  }
}

export async function getStudentSelfAttendanceData() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const user = authState.user
  const supabase = await createClient()

  // Resolve student ID from profile_id
  const { data: student } = await (supabase as any)
    .from('students')
    .select('id, first_name, last_name, admission_number')
    .eq('school_id', user.schoolId)
    .eq('profile_id', user.profileId)
    .single()

  const studentObj = student as { id: string; first_name: string; last_name: string; admission_number: string } | null
  if (!studentObj) return null

  const { data: recordsData } = await (supabase as any)
    .from('attendance_records')
    .select(`
      id,
      attendance_date,
      status,
      remarks,
      classes(name),
      sections(name)
    `)
    .eq('school_id', user.schoolId)
    .eq('student_id', studentObj.id)
    .order('attendance_date', { ascending: false })
    .limit(180)

  const records = ((recordsData as any[]) || []).map((r: any) => ({
    id: r.id,
    date: r.attendance_date,
    status: r.status as AttendanceStatus,
    remarks: r.remarks,
    className: r.classes?.name,
    sectionName: r.sections?.name,
  }))

  const summary = calculateAttendanceSummary(records.map((r) => r.status))

  return {
    studentName: `${studentObj.first_name} ${studentObj.last_name}`,
    admissionNumber: studentObj.admission_number,
    records,
    summary,
  }
}
