import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import type { ExamType, Examination, ExamSchedule } from '@/types/examination'

export async function getExamTypes(): Promise<ExamType[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const { data } = await supabase
    .from('exam_types')
    .select('*')
    .eq('school_id', authState.user.schoolId)
    .order('name', { ascending: true })

  if (!data) return []

  return data.map((d: any) => ({
    id: d.id,
    schoolId: d.school_id,
    name: d.name,
    code: d.code,
    description: d.description,
    status: d.status,
    createdBy: d.created_by,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }))
}

export async function getExaminations(filters?: { academicSessionId?: string; status?: string }): Promise<Examination[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  let query = supabase
    .from('examinations')
    .select('*, academic_sessions(name), exam_types(name, code), examination_classes(id, class_id, classes(name))')
    .eq('school_id', authState.user.schoolId)

  if (filters?.academicSessionId) {
    query = query.eq('academic_session_id', filters.academicSessionId)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  query = query.order('start_date', { ascending: false })

  const { data } = await query
  if (!data) return []

  return data.map((d: any) => ({
    id: d.id,
    schoolId: d.school_id,
    academicSessionId: d.academic_session_id,
    academicSessionName: d.academic_sessions?.name,
    examTypeId: d.exam_type_id,
    examTypeName: d.exam_types?.name,
    examTypeCode: d.exam_types?.code,
    name: d.name,
    code: d.code,
    description: d.description,
    startDate: d.start_date,
    endDate: d.end_date,
    status: d.status,
    cancellationReason: d.cancellation_reason,
    createdBy: d.created_by,
    publishedBy: d.published_by,
    publishedAt: d.published_at,
    cancelledBy: d.cancelled_by,
    cancelledAt: d.cancelled_at,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    classes: d.examination_classes?.map((ec: any) => ({
      id: ec.id,
      schoolId: d.school_id,
      examinationId: d.id,
      classId: ec.class_id,
      className: ec.classes?.name,
      createdAt: ec.created_at,
    })),
  }))
}

export async function getExaminationById(examinationId: string): Promise<Examination | null> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = (await createClient()) as any
  const { data } = await supabase
    .from('examinations')
    .select('*, academic_sessions(name), exam_types(name, code), examination_classes(id, class_id, classes(name)), examination_subject_configs(*, subjects(name, code), classes(name))')
    .eq('id', examinationId)
    .eq('school_id', authState.user.schoolId)
    .single()

  if (!data) return null

  return {
    id: data.id,
    schoolId: data.school_id,
    academicSessionId: data.academic_session_id,
    academicSessionName: data.academic_sessions?.name,
    examTypeId: data.exam_type_id,
    examTypeName: data.exam_types?.name,
    examTypeCode: data.exam_types?.code,
    name: data.name,
    code: data.code,
    description: data.description,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    cancellationReason: data.cancellation_reason,
    createdBy: data.created_by,
    publishedBy: data.published_by,
    publishedAt: data.published_at,
    cancelledBy: data.cancelled_by,
    cancelledAt: data.cancelled_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    classes: data.examination_classes?.map((ec: any) => ({
      id: ec.id,
      schoolId: data.school_id,
      examinationId: data.id,
      classId: ec.class_id,
      className: ec.classes?.name,
      createdAt: ec.created_at,
    })),
    subjectConfigs: data.examination_subject_configs?.map((sc: any) => ({
      id: sc.id,
      schoolId: sc.school_id,
      examinationId: sc.examination_id,
      classId: sc.class_id,
      className: sc.classes?.name,
      subjectId: sc.subject_id,
      subjectName: sc.subjects?.name,
      subjectCode: sc.subjects?.code,
      maximumMarks: Number(sc.maximum_marks),
      passingMarks: Number(sc.passing_marks),
      theoryMarks: Number(sc.theory_marks || 0),
      practicalMarks: Number(sc.practical_marks || 0),
      internalMarks: Number(sc.internal_marks || 0),
      createdAt: sc.created_at,
      updatedAt: sc.updated_at,
    })),
  }
}

export async function getExamSchedules(filters?: { examinationId?: string; classId?: string; sectionId?: string; examDate?: string }): Promise<ExamSchedule[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  let query = supabase
    .from('examination_schedules')
    .select('*, examinations(name), classes(name), sections(name), subjects(name, code), examination_invigilators(*, profiles(full_name, email))')
    .eq('school_id', authState.user.schoolId)

  if (filters?.examinationId) query = query.eq('examination_id', filters.examinationId)
  if (filters?.classId) query = query.eq('class_id', filters.classId)
  if (filters?.sectionId) query = query.or(`section_id.eq.${filters.sectionId},section_id.is.null`)
  if (filters?.examDate) query = query.eq('exam_date', filters.examDate)

  query = query.order('exam_date', { ascending: true }).order('start_time', { ascending: true })

  const { data } = await query
  if (!data) return []

  return data.map((d: any) => ({
    id: d.id,
    schoolId: d.school_id,
    examinationId: d.examination_id,
    examinationName: d.examinations?.name,
    classId: d.class_id,
    className: d.classes?.name,
    sectionId: d.section_id,
    sectionName: d.sections?.name,
    subjectId: d.subject_id,
    subjectName: d.subjects?.name,
    subjectCode: d.subjects?.code,
    examDate: d.exam_date,
    startTime: d.start_time,
    endTime: d.end_time,
    durationMinutes: d.duration_minutes,
    venue: d.venue,
    room: d.room,
    maximumMarks: Number(d.maximum_marks),
    passingMarks: Number(d.passing_marks),
    status: d.status,
    createdBy: d.created_by,
    updatedBy: d.updated_by,
    changeReason: d.change_reason,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    invigilators: d.examination_invigilators?.map((ei: any) => ({
      id: ei.id,
      schoolId: ei.school_id,
      examScheduleId: ei.exam_schedule_id,
      profileId: ei.profile_id,
      invigilatorName: ei.profiles?.full_name,
      invigilatorEmail: ei.profiles?.email,
      assignedBy: ei.assigned_by,
      assignedAt: ei.assigned_at,
    })),
  }))
}

export async function getTeacherExamSchedule(): Promise<ExamSchedule[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []
  if (!hasAnyRole(authState.user, ['Teacher', 'Admin', 'Super Admin', 'Principal'])) return []

  const supabase = (await createClient()) as any
  const profileId = authState.user.profileId

  // Fetch schedules where teacher is invigilator
  const { data: invig } = await supabase
    .from('examination_invigilators')
    .select('exam_schedule_id')
    .eq('profile_id', profileId)
    .eq('school_id', authState.user.schoolId)

  const scheduleIds = invig?.map((i: any) => i.exam_schedule_id) || []

  if (scheduleIds.length === 0) return []

  const { data } = await supabase
    .from('examination_schedules')
    .select('*, examinations(name), classes(name), sections(name), subjects(name, code)')
    .in('id', scheduleIds)
    .order('exam_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (!data) return []

  return data.map((d: any) => ({
    id: d.id,
    schoolId: d.school_id,
    examinationId: d.examination_id,
    examinationName: d.examinations?.name,
    classId: d.class_id,
    className: d.classes?.name,
    sectionId: d.section_id,
    sectionName: d.sections?.name,
    subjectId: d.subject_id,
    subjectName: d.subjects?.name,
    subjectCode: d.subjects?.code,
    examDate: d.exam_date,
    startTime: d.start_time,
    endTime: d.end_time,
    durationMinutes: d.duration_minutes,
    venue: d.venue,
    room: d.room,
    maximumMarks: Number(d.maximum_marks),
    passingMarks: Number(d.passing_marks),
    status: d.status,
    createdBy: d.created_by,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }))
}

export async function getAvailableInvigilators(): Promise<Array<{ id: string; name: string; email: string }>> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  // Fetch profiles with Teacher/Admin/Principal roles for current school
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('school_id', authState.user.schoolId)
    .eq('status', 'active')

  if (!data) return []

  return data.map((p: any) => ({
    id: p.id,
    name: p.full_name || p.email,
    email: p.email,
  }))
}
