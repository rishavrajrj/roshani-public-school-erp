'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import {
  createDirectStudentSchema,
  updateStudentSchema,
  changeStudentStatusSchema,
  linkGuardianSchema,
  type CreateDirectStudentInput,
  type UpdateStudentInput,
  type ChangeStudentStatusInput,
  type LinkGuardianInput,
} from './schemas'

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }

export async function getStudents(params: {
  search?: string
  status?: string
  sessionId?: string
  classId?: string
  sectionId?: string
  gender?: string
  page?: number
  limit?: number
}) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized', data: { students: [], total: 0, page: 1, limit: 15, totalPages: 1 } }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal', 'Parent', 'Student'])) {
    return { success: false, error: 'Forbidden: Insufficient role permissions to view students', data: { students: [], total: 0, page: 1, limit: 15, totalPages: 1 } }
  }

  const page = params.page && params.page > 0 ? params.page : 1
  const limit = params.limit && params.limit > 0 ? params.limit : 20
  const offset = (page - 1) * limit

  const supabase = await createClient()

  let query = (supabase
    .from('students') as any)
    .select(`
      *,
      student_academic_history!student_academic_history_student_id_fkey!inner(
        id,
        roll_number,
        status,
        academic_sessions!student_academic_history_academic_session_id_fkey(id, name, is_current),
        classes!student_academic_history_class_id_fkey(id, name),
        sections!student_academic_history_section_id_fkey(id, name)
      ),
      student_guardians!student_guardians_student_id_fkey(
        id,
        relationship,
        is_primary,
        guardians!student_guardians_guardian_id_fkey(id, full_name, phone, email)
      )
    `, { count: 'exact' })
    .eq('school_id', user.schoolId)

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.gender && params.gender !== 'all') {
    query = query.eq('gender', params.gender)
  }

  if (params.sessionId) {
    query = query.eq('student_academic_history.academic_session_id', params.sessionId)
  } else {
    query = query.eq('student_academic_history.status', 'active')
  }

  if (params.classId) {
    query = query.eq('student_academic_history.class_id', params.classId)
  }

  if (params.sectionId) {
    query = query.eq('student_academic_history.section_id', params.sectionId)
  }

  if (params.search) {
    const s = `%${params.search}%`
    query = query.or(`admission_number.ilike.${s},first_name.ilike.${s},last_name.ilike.${s}`)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return { success: false, error: error.message, data: { students: [], total: 0, page: 1, limit, totalPages: 1 } }
  }

  return {
    success: true,
    data: {
      students: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

export async function getStudentById(id: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized', data: null }
  }

  const { user } = authState
  const supabase = await createClient()

  const { data: student, error: studentErr } = await (supabase
    .from('students') as any)
    .select(`
      *,
      student_academic_history!student_academic_history_student_id_fkey(
        id,
        roll_number,
        status,
        created_at,
        academic_sessions!student_academic_history_academic_session_id_fkey(id, name, is_current, start_date, end_date),
        classes!student_academic_history_class_id_fkey(id, name, display_order),
        sections!student_academic_history_section_id_fkey(id, name)
      ),
      student_guardians!student_guardians_student_id_fkey(
        id,
        relationship,
        is_primary,
        guardians!student_guardians_guardian_id_fkey(id, full_name, phone, alternate_phone, email, address, occupation)
      ),
      student_documents!student_documents_student_id_fkey(
        id,
        document_type,
        file_path,
        file_name,
        mime_type,
        file_size,
        created_at
      )
    `)
    .eq('id', id)
    .eq('school_id', user.schoolId)
    .single()

  if (studentErr || !student) {
    return { success: false, error: 'Student record not found', data: null }
  }

  return { success: true, data: student }
}

export async function createDirectStudent(
  input: CreateDirectStudentInput
): Promise<ActionResult<{ studentId: string; admissionNumber: string }>> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized: Session expired' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin'])) {
    return { success: false, error: 'Forbidden: Only administrators can create students directly' }
  }

  const parseResult = createDirectStudentSchema.safeParse(input)
  if (!parseResult.success) {
    console.error('[createDirectStudent] Zod validation failed:', JSON.stringify(parseResult.error.issues, null, 2))
    return { success: false, error: parseResult.error.issues[0]?.message || 'Validation error' }
  }

  const validated = parseResult.data
  const supabase = await createClient()

  // Validate section belongs to class & school
  const { data: sectionCheck, error: secErr } = await supabase
    .from('sections')
    .select('id')
    .eq('id', validated.section_id)
    .eq('class_id', validated.class_id)
    .eq('school_id', user.schoolId)
    .single()

  if (secErr || !sectionCheck) {
    return { success: false, error: 'Invalid section selected for this class' }
  }

  // Generate admission number if not provided
  let admissionNo = validated.admission_number?.trim()
  if (!admissionNo) {
    const { data: genNo, error: genErr } = await (supabase.rpc as any)('generate_admission_number', {
      p_school_id: user.schoolId,
    })
    if (genErr || !genNo) {
      return { success: false, error: 'Failed to generate admission number' }
    }
    admissionNo = genNo as string
  } else {
    // Check uniqueness
    const { data: dupCheck } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', user.schoolId)
      .eq('admission_number', admissionNo)
      .single()

    if (dupCheck) {
      return { success: false, error: `Admission number ${admissionNo} is already assigned to another student.` }
    }
  }

  // 1. Create Student
  const { data: newStudent, error: studentErr } = await (supabase
    .from('students') as any)
    .insert({
      school_id: user.schoolId,
      admission_number: admissionNo,
      first_name: validated.first_name,
      middle_name: validated.middle_name || null,
      last_name: validated.last_name,
      date_of_birth: validated.date_of_birth || null,
      gender: validated.gender || null,
      phone: validated.phone || null,
      email: validated.email || null,
      address: validated.address || null,
      city: validated.city || null,
      state: validated.state || null,
      status: 'active',
    })
    .select('id, admission_number')
    .single()

  if (studentErr || !newStudent) {
    return { success: false, error: studentErr?.message || 'Failed to create student' }
  }

  // 2. Find or Create Guardian
  let guardianId: string | null = null
  const { data: existingG } = await (supabase
    .from('guardians') as any)
    .select('id')
    .eq('school_id', user.schoolId)
    .eq('phone', validated.guardian_phone)
    .maybeSingle()

  if (existingG) {
    guardianId = existingG.id
  } else {
    const { data: newG, error: gErr } = await (supabase
      .from('guardians') as any)
      .insert({
        school_id: user.schoolId,
        full_name: validated.guardian_name,
        relationship: validated.guardian_relationship,
        phone: validated.guardian_phone,
        email: validated.guardian_email || null,
        address: validated.address || null,
        status: 'active',
      })
      .select('id')
      .single()

    if (gErr || !newG) {
      return { success: false, error: 'Student created but guardian creation failed: ' + (gErr?.message || '') }
    }
    guardianId = newG.id
  }

  // 3. Link Student-Guardian
  await (supabase.from('student_guardians') as any).insert({
    student_id: newStudent.id,
    guardian_id: guardianId,
    school_id: user.schoolId,
    relationship: validated.guardian_relationship,
    is_primary: true,
  })

  // 4. Create Academic History Assignment
  const { error: sahErr } = await (supabase.from('student_academic_history') as any).insert({
    student_id: newStudent.id,
    academic_session_id: validated.academic_session_id,
    class_id: validated.class_id,
    section_id: validated.section_id,
    school_id: user.schoolId,
    roll_number: validated.roll_number || null,
    status: 'active',
  })

  if (sahErr) {
    return { success: false, error: 'Student created but academic assignment failed: ' + sahErr.message }
  }

  // 5. Audit Log
  await (supabase.from('audit_logs') as any).insert({
    school_id: user.schoolId,
    actor_profile_id: user.profileId,
    action: 'CREATE_DIRECT_STUDENT',
    entity_type: 'students',
    entity_id: newStudent.id,
    new_data: { admission_number: newStudent.admission_number, name: `${validated.first_name} ${validated.last_name}` },
  })

  return {
    success: true,
    data: { studentId: newStudent.id, admissionNumber: newStudent.admission_number },
    message: `Direct Student ${newStudent.admission_number} created successfully`,
  }
}

export async function updateStudent(
  studentId: string,
  input: UpdateStudentInput
): Promise<ActionResult> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin'])) {
    return { success: false, error: 'Forbidden: Insufficient permissions to edit student' }
  }

  const parseResult = updateStudentSchema.safeParse(input)
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || 'Validation error' }
  }

  const validated = parseResult.data
  const supabase = await createClient()

  const { error } = await (supabase
    .from('students') as any)
    .update({
      first_name: validated.first_name,
      middle_name: validated.middle_name || null,
      last_name: validated.last_name,
      date_of_birth: validated.date_of_birth || null,
      gender: validated.gender || null,
      phone: validated.phone || null,
      email: validated.email || null,
      address: validated.address || null,
      city: validated.city || null,
      state: validated.state || null,
      photo_url: validated.photo_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .eq('school_id', user.schoolId)

  if (error) {
    return { success: false, error: error.message }
  }

  await (supabase.from('audit_logs') as any).insert({
    school_id: user.schoolId,
    actor_profile_id: user.profileId,
    action: 'UPDATE_STUDENT_PROFILE',
    entity_type: 'students',
    entity_id: studentId,
    new_data: validated,
  })

  return { success: true, data: null, message: 'Student profile updated successfully' }
}

export async function changeStudentStatus(
  studentId: string,
  input: ChangeStudentStatusInput
): Promise<ActionResult> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin'])) {
    return { success: false, error: 'Forbidden: Insufficient permissions to change student status' }
  }

  const parseResult = changeStudentStatusSchema.safeParse(input)
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || 'Validation error' }
  }

  const { status, reason } = parseResult.data
  const supabase = await createClient()

  const { error } = await (supabase
    .from('students') as any)
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .eq('school_id', user.schoolId)

  if (error) {
    return { success: false, error: error.message }
  }

  await (supabase.from('audit_logs') as any).insert({
    school_id: user.schoolId,
    actor_profile_id: user.profileId,
    action: 'CHANGE_STUDENT_STATUS',
    entity_type: 'students',
    entity_id: studentId,
    new_data: { status, reason },
  })

  return { success: true, data: null, message: `Student status updated to ${status}` }
}

export async function linkGuardianToStudent(
  studentId: string,
  input: LinkGuardianInput
): Promise<ActionResult> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin'])) {
    return { success: false, error: 'Forbidden' }
  }

  const parseResult = linkGuardianSchema.safeParse(input)
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || 'Validation error' }
  }

  const validated = parseResult.data
  const supabase = await createClient()

  let targetGuardianId = validated.guardian_id

  if (!targetGuardianId) {
    if (!validated.full_name || !validated.phone) {
      return { success: false, error: 'Guardian full name and phone are required for creating a new guardian' }
    }

    const { data: newG, error: gErr } = await (supabase
      .from('guardians') as any)
      .insert({
        school_id: user.schoolId,
        full_name: validated.full_name,
        relationship: validated.relationship,
        phone: validated.phone,
        email: validated.email || null,
        address: validated.address || null,
        status: 'active',
      })
      .select('id')
      .single()

    if (gErr || !newG) {
      return { success: false, error: gErr?.message || 'Failed to create guardian' }
    }
    targetGuardianId = newG.id
  }

  if (validated.is_primary) {
    await (supabase
      .from('student_guardians') as any)
      .update({ is_primary: false })
      .eq('student_id', studentId)
      .eq('school_id', user.schoolId)
  }

  const { error: linkErr } = await (supabase.from('student_guardians') as any).insert({
    student_id: studentId,
    guardian_id: targetGuardianId,
    school_id: user.schoolId,
    relationship: validated.relationship,
    is_primary: validated.is_primary,
  })

  if (linkErr) {
    return { success: false, error: linkErr.message }
  }

  return { success: true, data: null, message: 'Guardian linked successfully' }
}

export async function unlinkGuardianFromStudent(
  studentId: string,
  guardianId: string
): Promise<ActionResult> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin'])) {
    return { success: false, error: 'Forbidden' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('student_guardians')
    .delete()
    .eq('student_id', studentId)
    .eq('guardian_id', guardianId)
    .eq('school_id', user.schoolId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: null, message: 'Guardian link removed successfully' }
}
