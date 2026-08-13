'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import {
  createExamTypeSchema,
  updateExamTypeSchema,
  createExaminationSchema,
  updateExaminationSchema,
  configureExamClassesSchema,
  configureSubjectMarkingSchema,
  createExamScheduleSchema,
  updateExamScheduleSchema,
  cancelExaminationSchema,
  publishExaminationSchema,
  type CreateExamTypeInput,
  type UpdateExamTypeInput,
  type CreateExaminationInput,
  type UpdateExaminationInput,
  type ConfigureExamClassesInput,
  type ConfigureSubjectMarkingInput,
  type CreateExamScheduleInput,
  type UpdateExamScheduleInput,
  type CancelExaminationInput,
  type PublishExaminationInput,
} from './schemas'

async function writeAuditLog(
  supabase: any,
  schoolId: string,
  actorProfileId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  oldData: Record<string, unknown> | null = null,
  newData: Record<string, unknown> | null = null
) {
  await supabase.from('audit_logs').insert({
    school_id: schoolId,
    actor_profile_id: actorProfileId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
  })
}

// ============================================================
// EXAM TYPE ACTIONS
// ============================================================

export async function createExamTypeAction(input: CreateExamTypeInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = createExamTypeSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: examType, error } = await supabase
      .from('exam_types')
      .insert({
        school_id: schoolId,
        code: validated.code,
        name: validated.name,
        description: validated.description || null,
        created_by: authState.user.profileId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return { success: false, error: `Exam type code '${validated.code}' already exists` }
      return { success: false, error: error.message }
    }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CREATE_EXAM_TYPE', 'exam_types', examType.id, null, { code: validated.code, name: validated.name })

    return { success: true, data: examType }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create exam type' }
  }
}

export async function updateExamTypeAction(input: UpdateExamTypeInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = updateExamTypeSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: existing } = await supabase.from('exam_types').select('*').eq('id', validated.id).eq('school_id', schoolId).single()
    if (!existing) return { success: false, error: 'Exam type not found' }

    const { data: updated, error } = await supabase
      .from('exam_types')
      .update({
        name: validated.name,
        description: validated.description || null,
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'UPDATE_EXAM_TYPE', 'exam_types', updated.id, existing, updated)

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update exam type' }
  }
}

// ============================================================
// EXAMINATION MASTER ACTIONS
// ============================================================

export async function createExaminationAction(input: CreateExaminationInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = createExaminationSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Verify session belongs to school
    const { data: session } = await supabase.from('academic_sessions').select('id').eq('id', validated.academicSessionId).eq('school_id', schoolId).single()
    if (!session) return { success: false, error: 'Invalid academic session for school' }

    // Verify exam type belongs to school
    const { data: examType } = await supabase.from('exam_types').select('id').eq('id', validated.examTypeId).eq('school_id', schoolId).single()
    if (!examType) return { success: false, error: 'Invalid exam type for school' }

    const { data: exam, error } = await supabase
      .from('examinations')
      .insert({
        school_id: schoolId,
        academic_session_id: validated.academicSessionId,
        exam_type_id: validated.examTypeId,
        name: validated.name,
        code: validated.code,
        description: validated.description || null,
        start_date: validated.startDate,
        end_date: validated.endDate,
        status: 'draft',
        created_by: authState.user.profileId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return { success: false, error: `Examination code '${validated.code}' already exists for this academic session` }
      return { success: false, error: error.message }
    }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CREATE_EXAMINATION', 'examinations', exam.id, null, { name: validated.name, code: validated.code, status: 'draft' })

    return { success: true, data: exam }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create examination' }
  }
}

export async function updateExaminationAction(input: UpdateExaminationInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = updateExaminationSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: existing } = await supabase.from('examinations').select('*').eq('id', validated.id).eq('school_id', schoolId).single()
    if (!existing) return { success: false, error: 'Examination not found' }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      return { success: false, error: `Cannot modify an examination with status '${existing.status}'` }
    }

    if (existing.status === 'published' && !validated.changeReason) {
      return { success: false, error: 'A change reason is required when modifying a published examination' }
    }

    const { data: updated, error } = await supabase
      .from('examinations')
      .update({
        name: validated.name,
        description: validated.description || null,
        start_date: validated.startDate,
        end_date: validated.endDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'UPDATE_EXAMINATION', 'examinations', updated.id, existing, { ...updated, changeReason: validated.changeReason })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update examination' }
  }
}

export async function cancelExaminationAction(input: CancelExaminationInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = cancelExaminationSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: existing } = await supabase.from('examinations').select('*').eq('id', validated.examinationId).eq('school_id', schoolId).single()
    if (!existing) return { success: false, error: 'Examination not found' }

    if (existing.status === 'completed') {
      return { success: false, error: 'Cannot cancel a completed examination' }
    }
    if (existing.status === 'cancelled') {
      return { success: false, error: 'Examination is already cancelled' }
    }

    const { data: updated, error } = await supabase
      .from('examinations')
      .update({
        status: 'cancelled',
        cancellation_reason: validated.reason,
        cancelled_by: authState.user.profileId,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.examinationId)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Also cancel associated schedules
    await supabase.from('examination_schedules').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('examination_id', validated.examinationId).eq('school_id', schoolId)

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CANCEL_EXAMINATION', 'examinations', updated.id, existing, { status: 'cancelled', reason: validated.reason })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to cancel examination' }
  }
}

// ============================================================
// EXAM CLASS & SUBJECT CONFIG ACTIONS
// ============================================================

export async function configureExamClassesAction(input: ConfigureExamClassesInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = configureExamClassesSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: exam } = await supabase.from('examinations').select('*').eq('id', validated.examinationId).eq('school_id', schoolId).single()
    if (!exam) return { success: false, error: 'Examination not found' }
    if (exam.status === 'completed' || exam.status === 'cancelled') {
      return { success: false, error: `Cannot modify classes for exam with status '${exam.status}'` }
    }

    // Verify all classIds belong to current school
    const { data: validClasses } = await supabase.from('classes').select('id').in('id', validated.classIds).eq('school_id', schoolId)
    if (!validClasses || validClasses.length !== validated.classIds.length) {
      return { success: false, error: 'One or more selected classes are invalid for this school' }
    }

    // Remove classes no longer selected
    await supabase.from('examination_classes').delete().eq('examination_id', validated.examinationId).eq('school_id', schoolId).not('class_id', 'in', `(${validated.classIds.join(',')})`)

    // Insert new classes
    const inserts = validated.classIds.map((cId) => ({
      school_id: schoolId,
      examination_id: validated.examinationId,
      class_id: cId,
    }))

    const { data, error } = await supabase.from('examination_classes').upsert(inserts, { onConflict: 'examination_id,class_id' }).select()
    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CONFIGURE_EXAM_CLASSES', 'examination_classes', validated.examinationId, null, { classIds: validated.classIds })

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to configure exam classes' }
  }
}

export async function configureSubjectMarkingAction(input: ConfigureSubjectMarkingInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = configureSubjectMarkingSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Verify subject belongs to class in class_subjects OR subject belongs to school
    const { data: subject } = await supabase.from('subjects').select('id').eq('id', validated.subjectId).eq('school_id', schoolId).single()
    if (!subject) return { success: false, error: 'Subject does not belong to this school' }

    const { data: config, error } = await supabase
      .from('examination_subject_configs')
      .upsert(
        {
          school_id: schoolId,
          examination_id: validated.examinationId,
          class_id: validated.classId,
          subject_id: validated.subjectId,
          maximum_marks: validated.maximumMarks,
          passing_marks: validated.passingMarks,
          theory_marks: validated.theoryMarks,
          practical_marks: validated.practicalMarks,
          internal_marks: validated.internalMarks,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'examination_id,class_id,subject_id' }
      )
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CONFIGURE_EXAM_SUBJECT_MARKING', 'examination_subject_configs', config.id, null, validated)

    return { success: true, data: config }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to configure subject marking' }
  }
}

// ============================================================
// EXAM SCHEDULE ACTIONS & CONFLICT DETECTION
// ============================================================

export async function createExamScheduleAction(input: CreateExamScheduleInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = createExamScheduleSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Verify examination status
    const { data: exam } = await supabase.from('examinations').select('*').eq('id', validated.examinationId).eq('school_id', schoolId).single()
    if (!exam) return { success: false, error: 'Examination not found' }
    if (exam.status === 'completed' || exam.status === 'cancelled') {
      return { success: false, error: `Cannot schedule for exam with status '${exam.status}'` }
    }

    // Verify date is within examination start_date and end_date
    if (validated.examDate < exam.start_date || validated.examDate > exam.end_date) {
      return { success: false, error: `Schedule date ${validated.examDate} must be between exam dates (${exam.start_date} to ${exam.end_date})` }
    }

    // Server-Side Conflict Check via RPC
    const invigilators = validated.invigilatorProfileIds || []
    const { data: conflicts } = await supabase.rpc('check_exam_schedule_conflicts', {
      p_school_id: schoolId,
      p_schedule_id: null,
      p_class_id: validated.classId,
      p_section_id: validated.sectionId || null,
      p_subject_id: validated.subjectId,
      p_exam_date: validated.examDate,
      p_start_time: validated.startTime,
      p_end_time: validated.endTime,
      p_room: validated.room || null,
      p_invigilator_ids: invigilators,
    })

    if (conflicts && Array.isArray(conflicts) && conflicts.length > 0) {
      return { success: false, error: `Schedule Conflict Detected: ${conflicts[0].message}`, conflicts }
    }

    // Insert Schedule
    const { data: schedule, error } = await supabase
      .from('examination_schedules')
      .insert({
        school_id: schoolId,
        examination_id: validated.examinationId,
        class_id: validated.classId,
        section_id: validated.sectionId || null,
        subject_id: validated.subjectId,
        exam_date: validated.examDate,
        start_time: validated.startTime,
        end_time: validated.endTime,
        duration_minutes: validated.durationMinutes,
        venue: validated.venue || null,
        room: validated.room || null,
        maximum_marks: validated.maximumMarks,
        passing_marks: validated.passingMarks,
        status: 'scheduled',
        created_by: authState.user.profileId,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Assign Invigilators if provided
    if (invigilators.length > 0) {
      const invInserts = invigilators.map((pId) => ({
        school_id: schoolId,
        exam_schedule_id: schedule.id,
        profile_id: pId,
        assigned_by: authState.user.profileId,
      }))
      await supabase.from('examination_invigilators').insert(invInserts)
    }

    // Update examination status to scheduled if draft
    if (exam.status === 'draft') {
      await supabase.from('examinations').update({ status: 'scheduled', updated_at: new Date().toISOString() }).eq('id', exam.id)
    }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CREATE_EXAM_SCHEDULE', 'examination_schedules', schedule.id, null, validated)

    return { success: true, data: schedule }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create examination schedule' }
  }
}

export async function updateExamScheduleAction(input: UpdateExamScheduleInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = updateExamScheduleSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: existing } = await supabase.from('examination_schedules').select('*').eq('id', validated.id).eq('school_id', schoolId).single()
    if (!existing) return { success: false, error: 'Schedule entry not found' }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      return { success: false, error: `Cannot modify a schedule with status '${existing.status}'` }
    }

    // Check conflicts
    const invigilators = validated.invigilatorProfileIds || []
    const { data: conflicts } = await supabase.rpc('check_exam_schedule_conflicts', {
      p_school_id: schoolId,
      p_schedule_id: validated.id,
      p_class_id: existing.class_id,
      p_section_id: existing.section_id || null,
      p_subject_id: existing.subject_id,
      p_exam_date: validated.examDate,
      p_start_time: validated.startTime,
      p_end_time: validated.endTime,
      p_room: validated.room || null,
      p_invigilator_ids: invigilators,
    })

    if (conflicts && Array.isArray(conflicts) && conflicts.length > 0) {
      return { success: false, error: `Schedule Conflict Detected: ${conflicts[0].message}`, conflicts }
    }

    const { data: updated, error } = await supabase
      .from('examination_schedules')
      .update({
        exam_date: validated.examDate,
        start_time: validated.startTime,
        end_time: validated.endTime,
        duration_minutes: validated.durationMinutes,
        venue: validated.venue || null,
        room: validated.room || null,
        maximum_marks: validated.maximumMarks,
        passing_marks: validated.passingMarks,
        updated_by: authState.user.profileId,
        change_reason: validated.changeReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Update invigilators if specified
    if (validated.invigilatorProfileIds) {
      await supabase.from('examination_invigilators').delete().eq('exam_schedule_id', validated.id).eq('school_id', schoolId)
      if (invigilators.length > 0) {
        const invInserts = invigilators.map((pId) => ({
          school_id: schoolId,
          exam_schedule_id: validated.id,
          profile_id: pId,
          assigned_by: authState.user.profileId,
        }))
        await supabase.from('examination_invigilators').insert(invInserts)
      }
    }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'UPDATE_EXAM_SCHEDULE', 'examination_schedules', updated.id, existing, { ...updated, changeReason: validated.changeReason })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update schedule' }
  }
}

// ============================================================
// PUBLISHING ACTIONS
// ============================================================

export async function publishExaminationAction(input: PublishExaminationInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = publishExaminationSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: exam } = await supabase.from('examinations').select('*').eq('id', validated.examinationId).eq('school_id', schoolId).single()
    if (!exam) return { success: false, error: 'Examination not found' }

    if (exam.status === 'cancelled') return { success: false, error: 'Cannot publish a cancelled examination' }
    if (exam.status === 'published') return { success: false, error: 'Examination is already published' }

    // Pre-publish validations:
    // 1. Must have at least 1 applicable class
    const { data: examClasses } = await supabase.from('examination_classes').select('id').eq('examination_id', exam.id)
    if (!examClasses || examClasses.length === 0) {
      return { success: false, error: 'Cannot publish examination: No applicable classes configured' }
    }

    // 2. Must have at least 1 schedule entry
    const { data: schedules } = await supabase.from('examination_schedules').select('id').eq('examination_id', exam.id).eq('status', 'scheduled')
    if (!schedules || schedules.length === 0) {
      return { success: false, error: 'Cannot publish examination: No active schedule entries configured' }
    }

    const { data: updated, error } = await supabase
      .from('examinations')
      .update({
        status: 'published',
        published_by: authState.user.profileId,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', exam.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'PUBLISH_EXAMINATION', 'examinations', updated.id, exam, { status: 'published', publishedAt: updated.published_at })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to publish examination' }
  }
}
