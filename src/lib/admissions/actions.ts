'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
  convertApplicationSchema,
  type CreateApplicationInput,
  type UpdateApplicationStatusInput,
  type ConvertApplicationInput,
  type ApplicationStatus,
} from './schemas'

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }

export async function createAdmissionApplication(
  input: CreateApplicationInput
): Promise<ActionResult<{ id: string; application_number: string }>> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized: Session expired or invalid' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin'])) {
    return { success: false, error: 'Forbidden: Insufficient permissions to create admissions' }
  }

  const parseResult = createApplicationSchema.safeParse(input)
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || 'Validation error' }
  }

  const validated = parseResult.data
  const supabase = (await createClient()) as any

  // Generate unique application number for school & session
  let applicationNumber = `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  try {
    const { data: appNo } = await (supabase.rpc as any)('generate_application_number', {
      p_school_id: user.schoolId,
      p_session_id: validated.academic_session_id,
    })
    if (appNo) applicationNumber = appNo
  } catch {
    // fallback applicationNumber used
  }

  const { data: application, error: insertErr } = await (supabase
    .from('admission_applications') as any)
    .insert({
      school_id: user.schoolId,
      academic_session_id: validated.academic_session_id,
      application_number: applicationNumber,
      applicant_first_name: validated.applicant_first_name,
      applicant_middle_name: validated.applicant_middle_name || null,
      applicant_last_name: validated.applicant_last_name,
      date_of_birth: validated.date_of_birth || null,
      gender: validated.gender || null,
      applying_for_class_id: validated.applying_for_class_id,
      guardian_name: validated.guardian_name,
      guardian_phone: validated.guardian_phone,
      guardian_email: validated.guardian_email || null,
      address: validated.address || null,
      city: validated.city || null,
      state: validated.state || null,
      source: validated.source || null,
      notes: validated.notes || null,
      status: validated.status || 'draft',
    })
    .select('id, application_number')
    .single()

  if (insertErr || !application) {
    return { success: false, error: insertErr?.message || 'Failed to create admission application' }
  }

  // Audit log
  await (supabase.from('audit_logs') as any).insert({
    school_id: user.schoolId,
    actor_profile_id: user.profileId,
    action: 'CREATE_ADMISSION_APPLICATION',
    entity_type: 'admission_applications',
    entity_id: application.id,
    new_data: { application_number: application.application_number, applicant: `${validated.applicant_first_name} ${validated.applicant_last_name}` },
  })

  return {
    success: true,
    data: { id: application.id, application_number: application.application_number },
    message: `Application ${application.application_number} created successfully`,
  }
}

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['under_review', 'withdrawn'],
  under_review: ['approved', 'rejected', 'withdrawn'],
  approved: ['converted', 'withdrawn'],
  rejected: [],
  withdrawn: [],
  converted: [],
}

export async function updateAdmissionStatus(
  applicationId: string,
  input: UpdateApplicationStatusInput
): Promise<ActionResult> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized: Session expired or invalid' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
    return { success: false, error: 'Forbidden: Insufficient permissions to update status' }
  }

  const parseResult = updateApplicationStatusSchema.safeParse(input)
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || 'Validation error' }
  }

  const { status: targetStatus, notes } = parseResult.data
  const supabase = (await createClient()) as any

  // Fetch current application
  const { data: existing, error: fetchErr } = await (supabase
    .from('admission_applications') as any)
    .select('*')
    .eq('id', applicationId)
    .eq('school_id', user.schoolId)
    .single()

  if (fetchErr || !existing) {
    return { success: false, error: 'Admission application not found' }
  }

  const currentStatus = existing.status as ApplicationStatus
  const allowed = VALID_TRANSITIONS[currentStatus] || []

  if (!allowed.includes(targetStatus)) {
    return {
      success: false,
      error: `Invalid status transition: Cannot move from ${currentStatus} to ${targetStatus}`,
    }
  }

  // Build updates
  const updates: Record<string, unknown> = {
    status: targetStatus,
    updated_at: new Date().toISOString(),
  }

  if (notes) {
    updates.notes = existing.notes ? `${existing.notes}\n[${targetStatus.toUpperCase()}]: ${notes}` : notes
  }

  if (targetStatus === 'under_review') {
    updates.reviewed_by = user.profileId
    updates.reviewed_at = new Date().toISOString()
  } else if (targetStatus === 'approved') {
    updates.approved_at = new Date().toISOString()
    if (!existing.reviewed_by) {
      updates.reviewed_by = user.profileId
      updates.reviewed_at = new Date().toISOString()
    }
  } else if (targetStatus === 'rejected') {
    updates.rejected_at = new Date().toISOString()
    if (!existing.reviewed_by) {
      updates.reviewed_by = user.profileId
      updates.reviewed_at = new Date().toISOString()
    }
  }

  const { error: updateErr } = await (supabase
    .from('admission_applications') as any)
    .update(updates)
    .eq('id', applicationId)
    .eq('school_id', user.schoolId)

  if (updateErr) {
    return { success: false, error: updateErr.message || 'Failed to update status' }
  }

  // Audit log
  await (supabase.from('audit_logs') as any).insert({
    school_id: user.schoolId,
    actor_profile_id: user.profileId,
    action: `UPDATE_ADMISSION_STATUS_${targetStatus.toUpperCase()}`,
    entity_type: 'admission_applications',
    entity_id: applicationId,
    old_data: { status: currentStatus },
    new_data: { status: targetStatus },
  })

  return { success: true, data: null, message: `Application status updated to ${targetStatus}` }
}

export async function convertAdmissionToStudent(
  applicationId: string,
  input: ConvertApplicationInput
): Promise<ActionResult<{ studentId: string }>> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized: Session expired or invalid' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin'])) {
    return { success: false, error: 'Forbidden: Only Super Admin or Admin can convert admissions to enrolled students' }
  }

  const parseResult = convertApplicationSchema.safeParse(input)
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0]?.message || 'Validation error' }
  }

  const { section_id, roll_number, admission_number } = parseResult.data
  const supabase = (await createClient()) as any

  // Invoke atomic DB stored procedure function
  let convertedStudentId: string | null = null
  const { data: rpcStudentId, error: rpcErr } = await (supabase.rpc as any)('convert_admission_application', {
    p_application_id: applicationId,
    p_section_id: section_id,
    p_roll_number: roll_number || null,
    p_admission_number: admission_number || null,
  })

  if (!rpcErr && rpcStudentId) {
    convertedStudentId = rpcStudentId as string
  } else {
    // Robust fallback implementation if DB stored procedure encounters schema mismatch
    const { data: app } = await supabase
      .from('admission_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('school_id', user.schoolId)
      .single()

    if (!app) return { success: false, error: 'Admission application not found' }

    let admNo = admission_number?.trim()
    if (!admNo) {
      const { data: genNo } = await (supabase.rpc as any)('generate_admission_number', {
        p_school_id: user.schoolId,
      })
      admNo = genNo || `RPS-${Date.now().toString().slice(-4)}`
    }

    const { data: newStudent, error: sErr } = await supabase
      .from('students')
      .insert({
        school_id: user.schoolId,
        admission_number: admNo,
        first_name: app.applicant_first_name,
        middle_name: app.applicant_middle_name || null,
        last_name: app.applicant_last_name,
        date_of_birth: app.date_of_birth || null,
        gender: app.gender || null,
        phone: app.guardian_phone || null,
        email: app.guardian_email || null,
        address: app.address || null,
        city: app.city || null,
        state: app.state || null,
        status: 'active',
      })
      .select('id')
      .single()

    if (sErr || !newStudent) {
      return { success: false, error: sErr?.message || 'Failed to create student' }
    }

    convertedStudentId = newStudent.id

    // Guardian link
    let guardianId: string | null = null
    const { data: existingG } = await supabase
      .from('guardians')
      .select('id')
      .eq('school_id', user.schoolId)
      .eq('phone', app.guardian_phone)
      .maybeSingle()

    if (existingG) {
      guardianId = existingG.id
    } else {
      const { data: newG } = await supabase
        .from('guardians')
        .insert({
          school_id: user.schoolId,
          full_name: app.guardian_name,
          relationship: 'guardian',
          phone: app.guardian_phone,
          email: app.guardian_email || null,
          address: app.address || null,
          status: 'active',
        })
        .select('id')
        .single()
      if (newG) guardianId = newG.id
    }

    if (guardianId) {
      await supabase
        .from('student_guardians')
        .insert({
          student_id: convertedStudentId,
          guardian_id: guardianId,
          school_id: user.schoolId,
          relationship: 'guardian',
          is_primary: true,
        })
    }

    // Academic history
    await supabase.from('student_academic_history').insert({
      student_id: convertedStudentId,
      academic_session_id: app.academic_session_id,
      class_id: app.applying_for_class_id,
      section_id,
      school_id: user.schoolId,
      roll_number: roll_number || null,
      status: 'active',
    })

    // Application update
    await supabase
      .from('admission_applications')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        converted_student_id: convertedStudentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
  }

  return {
    success: true,
    data: { studentId: convertedStudentId as string },
    message: 'Admission successfully converted to enrolled student!',
  }
}

export async function getAdmissionApplications(params: {
  search?: string
  status?: string
  sessionId?: string
  classId?: string
  page?: number
  limit?: number
}) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized', data: { applications: [], total: 0, page: 1, limit: 15, totalPages: 1 } }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
    return { success: false, error: 'Forbidden', data: { applications: [], total: 0, page: 1, limit: 15, totalPages: 1 } }
  }

  const page = params.page && params.page > 0 ? params.page : 1
  const limit = params.limit && params.limit > 0 ? params.limit : 20
  const offset = (page - 1) * limit

  const supabase = (await createClient()) as any
  let query = (supabase
    .from('admission_applications') as any)
    .select(`
      *,
      academic_sessions!admission_applications_academic_session_id_fkey(id, name),
      classes!admission_applications_applying_for_class_id_fkey(id, name)
    `, { count: 'exact' })
    .eq('school_id', user.schoolId)

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.sessionId) {
    query = query.eq('academic_session_id', params.sessionId)
  }

  if (params.classId) {
    query = query.eq('applying_for_class_id', params.classId)
  }

  if (params.search) {
    const s = `%${params.search}%`
    query = query.or(`application_number.ilike.${s},applicant_first_name.ilike.${s},applicant_last_name.ilike.${s},guardian_name.ilike.${s},guardian_phone.ilike.${s}`)
  }

  const { data: apps, error: fetchErr, count: totalCount } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (fetchErr) {
    return { success: false, error: fetchErr.message, data: { applications: [], total: 0, page: 1, limit, totalPages: 1 } }
  }

  return {
    success: true,
    data: {
      applications: apps || [],
      total: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit),
    },
  }
}

export async function getAdmissionApplicationById(id: string) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized', data: null }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
    return { success: false, error: 'Forbidden', data: null }
  }

  const supabase = (await createClient()) as any
  const { data, error } = await (supabase
    .from('admission_applications') as any)
    .select(`
      *,
      academic_sessions!admission_applications_academic_session_id_fkey(id, name, is_current),
      classes!admission_applications_applying_for_class_id_fkey(id, name),
      reviewed_profile:profiles!admission_applications_reviewed_by_fkey(id, full_name),
      converted_student:students!admission_applications_converted_student_id_fkey(id, admission_number, first_name, last_name)
    `)
    .eq('id', id)
    .eq('school_id', user.schoolId)
    .single()

  if (error || !data) {
    return { success: false, error: 'Admission application not found', data: null }
  }

  return { success: true, data }
}
