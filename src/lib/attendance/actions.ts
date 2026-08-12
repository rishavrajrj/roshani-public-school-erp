'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import {
  submitAttendanceSchema,
  lockAttendanceSchema,
  assignTeacherSchema,
  type SubmitAttendanceInput,
  type LockAttendanceInput,
  type AssignTeacherInput,
} from './schemas'

export async function submitAttendanceSessionAction(input: SubmitAttendanceInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const user = authState.user
    const parsed = submitAttendanceSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid attendance payload' }
    }

    const data = parsed.data
    const supabase = await createClient()

    // 1. Authorization check
    const isAdminOrSuper = hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])
    const isTeacher = hasAnyRole(user, ['Teacher'])

    if (!isAdminOrSuper && !isTeacher) {
      return { success: false, error: 'You do not have permission to submit attendance.' }
    }

    if (isTeacher && !isAdminOrSuper) {
      // Verify teacher has active assignment for this session/class/section
      const { data: assignment } = await (supabase as any)
        .from('teacher_assignments')
        .select('id')
        .eq('school_id', user.schoolId)
        .eq('teacher_profile_id', user.profileId)
        .eq('academic_session_id', data.academicSessionId)
        .eq('class_id', data.classId)
        .eq('section_id', data.sectionId)
        .eq('active', true)
        .maybeSingle()

      if (!assignment) {
        return { success: false, error: 'You are not assigned to this class and section.' }
      }
    }

    // 2. Check existing session status
    const { data: existingSession } = await (supabase as any)
      .from('attendance_sessions')
      .select('id, status')
      .eq('school_id', user.schoolId)
      .eq('academic_session_id', data.academicSessionId)
      .eq('class_id', data.classId)
      .eq('section_id', data.sectionId)
      .eq('attendance_date', data.attendanceDate)
      .maybeSingle()

    const sessionObj = existingSession as { id: string; status: string } | null

    if (sessionObj && sessionObj.status === 'locked' && !isAdminOrSuper) {
      return { success: false, error: 'This attendance session is locked and cannot be modified.' }
    }

    // MANDATORY CORRECTION REASON: If modifying an already submitted session, require a correction reason
    if (sessionObj && sessionObj.status === 'submitted') {
      if (!data.correctionReason || data.correctionReason.trim().length < 3) {
        return {
          success: false,
          error: 'A non-empty correction reason (at least 3 characters) is required when modifying a submitted attendance session.',
        }
      }
    }

    // 3. Verify completeness — all currently active enrolled students must be included
    const { data: activeStudents, error: historyError } = await (supabase as any)
      .from('student_academic_history')
      .select(`
        student_id,
        students!inner(status)
      `)
      .eq('school_id', user.schoolId)
      .eq('academic_session_id', data.academicSessionId)
      .eq('class_id', data.classId)
      .eq('section_id', data.sectionId)
      .eq('status', 'active')
      .eq('students.status', 'active')

    if (historyError || !activeStudents) {
      return { success: false, error: 'Failed to verify active class enrollment.' }
    }

    const payloadStudentIds = new Set(data.records.map((r) => r.studentId))
    const studentList = activeStudents as Array<{ student_id: string }>
    for (const st of studentList) {
      if (!payloadStudentIds.has(st.student_id)) {
        return {
          success: false,
          error: 'Attendance submission incomplete. All eligible enrolled students must be marked.',
        }
      }
    }

    // 4. Create or update session
    let sessionId = sessionObj?.id
    if (!sessionId) {
      const { data: newSession, error: sessionErr } = await (supabase as any)
        .from('attendance_sessions')
        .insert({
          school_id: user.schoolId,
          academic_session_id: data.academicSessionId,
          class_id: data.classId,
          section_id: data.sectionId,
          attendance_date: data.attendanceDate,
          status: 'submitted',
          marked_by: user.profileId,
          marked_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (sessionErr || !newSession) {
        return { success: false, error: sessionErr?.message || 'Failed to create attendance session.' }
      }
      sessionId = (newSession as any).id
    } else {
      await (supabase as any)
        .from('attendance_sessions')
        .update({
          status: 'submitted',
          marked_by: user.profileId,
          marked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
    }

    // 5. Batch insert/upsert attendance records
    const recordPayloads = data.records.map((r) => ({
      school_id: user.schoolId,
      academic_session_id: data.academicSessionId,
      session_id: sessionId!,
      student_id: r.studentId,
      class_id: data.classId,
      section_id: data.sectionId,
      attendance_date: data.attendanceDate,
      status: r.status,
      remarks: r.remarks || null,
      correction_reason: sessionObj ? data.correctionReason || null : null,
      marked_by: user.profileId,
      marked_at: new Date().toISOString(),
      updated_by: user.profileId,
      updated_at: new Date().toISOString(),
    }))

    const { error: recordsErr } = await (supabase as any)
      .from('attendance_records')
      .upsert(recordPayloads, {
        onConflict: 'school_id,academic_session_id,student_id,attendance_date',
      })

    if (recordsErr) {
      return { success: false, error: recordsErr.message }
    }

    // 6. Audit log
    await (supabase as any).from('audit_logs').insert({
      school_id: user.schoolId,
      actor_profile_id: user.profileId,
      action: sessionObj ? 'Attendance corrected' : 'Attendance marked',
      entity_type: 'attendance_sessions',
      entity_id: sessionId,
      new_data: {
        attendance_date: data.attendanceDate,
        class_id: data.classId,
        section_id: data.sectionId,
        student_count: data.records.length,
        correction_reason: data.correctionReason || null,
      },
    })

    return { success: true, sessionId }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

export async function lockAttendanceSessionAction(input: LockAttendanceInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const user = authState.user
    if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
      return { success: false, error: 'Only administrators can lock or unlock attendance.' }
    }

    const parsed = lockAttendanceSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
    }

    const { sessionId, locked, reason } = parsed.data
    const supabase = await createClient()

    // MANDATORY UNLOCK REASON: Require reason when unlocking
    if (!locked && (!reason || reason.trim().length < 3)) {
      return { success: false, error: 'A non-empty reason is required when unlocking an attendance session.' }
    }

    const newStatus = locked ? 'locked' : 'submitted'
    const { error: updateErr } = await (supabase as any)
      .from('attendance_sessions')
      .update({
        status: newStatus,
        locked_at: locked ? new Date().toISOString() : null,
        locked_by: locked ? user.profileId : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('school_id', user.schoolId)

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    // Audit log
    await (supabase as any).from('audit_logs').insert({
      school_id: user.schoolId,
      actor_profile_id: user.profileId,
      action: locked ? 'Attendance locked' : 'Attendance unlocked',
      entity_type: 'attendance_sessions',
      entity_id: sessionId,
      new_data: { locked, reason: reason || null },
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

export async function assignTeacherAction(input: AssignTeacherInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const user = authState.user
    if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
      return { success: false, error: 'Only administrators can assign teachers.' }
    }

    const parsed = assignTeacherSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
    }

    const data = parsed.data
    const supabase = await createClient()

    // Insert active teacher assignment
    const { data: assignment, error: assignErr } = await (supabase as any)
      .from('teacher_assignments')
      .insert({
        school_id: user.schoolId,
        teacher_profile_id: data.teacherProfileId,
        academic_session_id: data.academicSessionId,
        class_id: data.classId,
        section_id: data.sectionId,
        assigned_by: user.profileId,
        active: true,
      })
      .select('id')
      .single()

    if (assignErr) {
      if (assignErr.code === '23505') {
        return { success: false, error: 'Teacher is already actively assigned to this class and section.' }
      }
      return { success: false, error: assignErr.message }
    }

    const assignmentObj = assignment as { id: string }

    // Audit log
    await (supabase as any).from('audit_logs').insert({
      school_id: user.schoolId,
      actor_profile_id: user.profileId,
      action: 'Teacher assigned',
      entity_type: 'teacher_assignments',
      entity_id: assignmentObj.id,
      new_data: data,
    })

    return { success: true, assignmentId: assignmentObj.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

export async function deactivateTeacherAssignmentAction(assignmentId: string) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const user = authState.user
    if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
      return { success: false, error: 'Only administrators can remove teacher assignments.' }
    }

    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('teacher_assignments')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', assignmentId)
      .eq('school_id', user.schoolId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Audit log
    await (supabase as any).from('audit_logs').insert({
      school_id: user.schoolId,
      actor_profile_id: user.profileId,
      action: 'Teacher assignment deactivated',
      entity_type: 'teacher_assignments',
      entity_id: assignmentId,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}
