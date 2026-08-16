import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import type { AdmitCard } from '@/types/admit-card'

function formatFormalDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDOB(dateStr?: string | null): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return ''
  try {
    const parts = timeStr.split(':')
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10)
      const minutes = parts[1]
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12 || 12
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
    }
    return timeStr
  } catch {
    return timeStr
  }
}

function determineSubjectType(subjectName: string, subjectCode: string): string {
  const lower = `${subjectName} ${subjectCode}`.toLowerCase()
  if (lower.includes('lab') || lower.includes('practical') || lower.includes('viva') || lower.includes('experiment')) {
    return 'Practical'
  }
  if (lower.includes('internal') || lower.includes('project') || lower.includes('activity')) {
    return 'Internal'
  }
  return 'Theory'
}

export async function getAdmitCardsForAdmin(examinationId: string, _classId?: string): Promise<AdmitCard[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []
  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher', 'Accountant'])) return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  // Fetch Schedules for examination to construct timetable
  const { data: schedules } = await supabase
    .from('examination_schedules')
    .select('*, subjects(name, code), classes(name), sections(name)')
    .eq('examination_id', examinationId)
    .eq('school_id', schoolId)
    .order('exam_date', { ascending: true })
    .order('start_time', { ascending: true })

  const liveTimetable = schedules?.map((s: any, idx: number) => ({
    sNo: idx + 1,
    date: formatFormalDate(s.exam_date),
    day: new Date(s.exam_date).toLocaleDateString('en-US', { weekday: 'short' }),
    subjectName: s.subjects?.name || 'Subject',
    subjectCode: s.subjects?.code || 'SUB-00',
    subjectType: determineSubjectType(s.subjects?.name || '', s.subjects?.code || ''),
    startTime: formatTime(s.start_time),
    endTime: formatTime(s.end_time),
    durationMinutes: s.duration_minutes,
    room: s.room || 'Main Hall',
    venue: s.venue || 'Roshani Public School — Main Campus',
    maximumMarks: Number(s.maximum_marks),
    status: 'Eligible',
  })) || []

  // Fetch Admit Cards
  const query = supabase
    .from('admit_cards')
    .select(`
      *,
      students(
        first_name,
        middle_name,
        last_name,
        admission_number,
        roll_number,
        date_of_birth,
        gender,
        photo_url,
        classes(name),
        sections(name),
        student_guardians(
          relationship,
          guardians(full_name)
        )
      ),
      examinations(name, code),
      academic_sessions(name)
    `)
    .eq('examination_id', examinationId)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  const { data } = await query
  if (!data) return []

  return data.map((d: any) => {
    const snap = d.data_snapshot
    const student = d.students
    const fullName = snap?.studentName || (student
      ? [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').trim()
      : 'Student')

    let fatherName = snap?.fatherName || 'N/A'
    let motherName = snap?.motherName || 'N/A'
    if (fatherName === 'N/A' && student?.student_guardians && Array.isArray(student.student_guardians)) {
      const father = student.student_guardians.find((g: any) => g.relationship?.toLowerCase() === 'father')
      const mother = student.student_guardians.find((g: any) => g.relationship?.toLowerCase() === 'mother')
      if (father?.guardians?.full_name) fatherName = father.guardians.full_name
      if (mother?.guardians?.full_name) motherName = mother.guardians.full_name
      if (fatherName === 'N/A' && student.student_guardians[0]?.guardians?.full_name) {
        fatherName = student.student_guardians[0].guardians.full_name
      }
    }

    const firstSchedule = schedules?.[0]
    const examCenter = snap?.examinationCenter || firstSchedule?.venue || 'Roshani Public School — Main Campus'
    const examRoom = snap?.examCenterRoom || firstSchedule?.room || 'Main Hall / Room 101'

    const timetable = snap?.timetable && snap.timetable.length > 0
      ? snap.timetable.map((t: any, idx: number) => ({
          sNo: t.sNo || idx + 1,
          date: formatFormalDate(t.date),
          day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
          subjectName: t.subjectName,
          subjectCode: t.subjectCode,
          subjectType: t.subjectType || determineSubjectType(t.subjectName || '', t.subjectCode || ''),
          startTime: formatTime(t.startTime),
          endTime: formatTime(t.endTime),
          durationMinutes: t.durationMinutes || 180,
          room: t.room || examRoom,
          venue: t.venue || examCenter,
          maximumMarks: Number(t.maximumMarks || 100),
          status: t.status || 'Eligible',
        }))
      : liveTimetable

    return {
      id: d.id,
      schoolId: d.school_id,
      academicSessionId: d.academic_session_id,
      academicSessionName: snap?.academicSessionName || d.academic_sessions?.name || '2025–2026',
      examinationId: d.examination_id,
      examinationName: snap?.examinationName || d.examinations?.name || 'ANNUAL EXAMINATION',
      examinationCode: snap?.examinationCode || d.examinations?.code || 'ANNUAL',
      studentId: d.student_id,
      studentName: fullName,
      admissionNumber: snap?.admissionNumber || student?.admission_number || 'N/A',
      rollNumber: snap?.rollNumber || student?.roll_number || 'N/A',
      className: snap?.className || student?.classes?.name || 'Class',
      sectionName: snap?.sectionName || student?.sections?.name || '',
      fatherName,
      motherName,
      dateOfBirth: formatDOB(snap?.dateOfBirth || student?.date_of_birth),
      gender: snap?.gender || (student?.gender ? student.gender.toUpperCase() : 'N/A'),
      house: snap?.house || 'Tagore House',
      examinationCenter: examCenter,
      examCenterRoom: examRoom,
      issueDate: formatFormalDate(snap?.issueDate || d.published_at || d.created_at),
      photoUrl: snap?.photoUrl || student?.photo_url || null,
      studentAcademicHistoryId: d.student_academic_history_id,
      admitCardNumber: d.admit_card_number,
      version: d.version || snap?.version || 1,
      documentFingerprint: d.document_fingerprint || snap?.documentFingerprint || `RPS-AC-2026-${d.id.substring(0, 6).toUpperCase()}`,
      verificationToken: d.verification_token,
      status: d.status,
      financialClearanceStatus: d.financial_clearance_status,
      financialOutstandingAmount: Number(d.financial_outstanding_amount || 0),
      financialOverride: d.financial_override,
      overrideReason: d.override_reason,
      overrideBy: d.override_by,
      overrideAt: d.override_at,
      candidateEligibilityStatus: d.candidate_eligibility_status,
      eligibilityRemarks: d.eligibility_remarks,
      publishedAt: d.published_at,
      publishedBy: d.published_by,
      revokedAt: d.revoked_at,
      revokedBy: d.revoked_by,
      revocationReason: d.revocation_reason,
      supersededAt: d.superseded_at,
      supersededBy: d.superseded_by,
      replacementReason: d.replacement_reason,
      previousAdmitCardId: d.previous_admit_card_id,
      dataSnapshot: snap || null,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      timetable,
    }
  })
}

export async function getStudentAdmitCard(studentId: string, examinationId: string): Promise<AdmitCard | null> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return null

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data: card } = await supabase
    .from('admit_cards')
    .select(`
      *,
      students(
        first_name,
        middle_name,
        last_name,
        admission_number,
        roll_number,
        date_of_birth,
        gender,
        photo_url,
        classes(name),
        sections(name),
        student_guardians(
          relationship,
          guardians(full_name)
        )
      ),
      examinations(name, code),
      academic_sessions(name)
    `)
    .eq('examination_id', examinationId)
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'published') // ONLY published cards visible to student/parent
    .maybeSingle()

  if (!card) return null

  const snap = card.data_snapshot

  // Schedules fallback if snapshot is pending
  const { data: schedules } = await supabase
    .from('examination_schedules')
    .select('*, subjects(name, code)')
    .eq('examination_id', examinationId)
    .eq('school_id', schoolId)
    .eq('status', 'scheduled')
    .order('exam_date', { ascending: true })
    .order('start_time', { ascending: true })

  const liveTimetable = schedules?.map((s: any, idx: number) => ({
    sNo: idx + 1,
    date: formatFormalDate(s.exam_date),
    day: new Date(s.exam_date).toLocaleDateString('en-US', { weekday: 'short' }),
    subjectName: s.subjects?.name || 'Subject',
    subjectCode: s.subjects?.code || 'SUB-00',
    subjectType: determineSubjectType(s.subjects?.name || '', s.subjects?.code || ''),
    startTime: formatTime(s.start_time),
    endTime: formatTime(s.end_time),
    durationMinutes: s.duration_minutes,
    room: s.room || 'Main Hall',
    venue: s.venue || 'Roshani Public School — Main Campus',
    maximumMarks: Number(s.maximum_marks),
    status: 'Eligible',
  })) || []

  const student = card.students
  const fullName = snap?.studentName || (student
    ? [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').trim()
    : 'Student')

  let fatherName = snap?.fatherName || 'N/A'
  let motherName = snap?.motherName || 'N/A'
  if (fatherName === 'N/A' && student?.student_guardians && Array.isArray(student.student_guardians)) {
    const father = student.student_guardians.find((g: any) => g.relationship?.toLowerCase() === 'father')
    const mother = student.student_guardians.find((g: any) => g.relationship?.toLowerCase() === 'mother')
    if (father?.guardians?.full_name) fatherName = father.guardians.full_name
    if (mother?.guardians?.full_name) motherName = mother.guardians.full_name
    if (fatherName === 'N/A' && student.student_guardians[0]?.guardians?.full_name) {
      fatherName = student.student_guardians[0].guardians.full_name
    }
  }

  const firstSchedule = schedules?.[0]
  const examCenter = snap?.examinationCenter || firstSchedule?.venue || 'Roshani Public School — Main Campus'
  const examRoom = snap?.examCenterRoom || firstSchedule?.room || 'Main Examination Block'

  const timetable = snap?.timetable && snap.timetable.length > 0
    ? snap.timetable.map((t: any, idx: number) => ({
        sNo: t.sNo || idx + 1,
        date: formatFormalDate(t.date),
        day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
        subjectName: t.subjectName,
        subjectCode: t.subjectCode,
        subjectType: t.subjectType || determineSubjectType(t.subjectName || '', t.subjectCode || ''),
        startTime: formatTime(t.startTime),
        endTime: formatTime(t.endTime),
        durationMinutes: t.durationMinutes || 180,
        room: t.room || examRoom,
        venue: t.venue || examCenter,
        maximumMarks: Number(t.maximumMarks || 100),
        status: t.status || 'Eligible',
      }))
    : liveTimetable

  return {
    id: card.id,
    schoolId: card.school_id,
    academicSessionId: card.academic_session_id,
    academicSessionName: snap?.academicSessionName || card.academic_sessions?.name || '2025–2026',
    examinationId: card.examination_id,
    examinationName: snap?.examinationName || card.examinations?.name || 'ANNUAL EXAMINATION',
    examinationCode: snap?.examinationCode || card.examinations?.code || 'ANNUAL',
    studentId: card.student_id,
    studentName: fullName,
    admissionNumber: snap?.admissionNumber || student?.admission_number || 'N/A',
    rollNumber: snap?.rollNumber || student?.roll_number || 'N/A',
    className: snap?.className || student?.classes?.name || 'Class',
    sectionName: snap?.sectionName || student?.sections?.name || '',
    fatherName,
    motherName,
    dateOfBirth: formatDOB(snap?.dateOfBirth || student?.date_of_birth),
    gender: snap?.gender || (student?.gender ? student.gender.toUpperCase() : 'N/A'),
    house: snap?.house || 'Tagore House',
    examinationCenter: examCenter,
    examCenterRoom: examRoom,
    issueDate: formatFormalDate(snap?.issueDate || card.published_at || card.created_at),
    photoUrl: snap?.photoUrl || student?.photo_url || null,
    studentAcademicHistoryId: card.student_academic_history_id,
    admitCardNumber: card.admit_card_number,
    version: card.version || snap?.version || 1,
    documentFingerprint: card.document_fingerprint || snap?.documentFingerprint || `RPS-AC-2026-${card.id.substring(0, 6).toUpperCase()}`,
    verificationToken: card.verification_token,
    status: card.status,
    financialClearanceStatus: 'CLEAR', // Hidden/sanitized for student document output
    financialOutstandingAmount: 0,
    financialOverride: card.financial_override,
    candidateEligibilityStatus: card.candidate_eligibility_status,
    publishedAt: card.published_at,
    dataSnapshot: snap || null,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
    timetable,
  }
}

export async function getPublishedAdmitCardsForStudent(studentId: string): Promise<AdmitCard[]> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return []

  const supabase = (await createClient()) as any
  const schoolId = authState.user.schoolId

  const { data: cards } = await supabase
    .from('admit_cards')
    .select('examination_id')
    .eq('student_id', studentId)
    .eq('school_id', schoolId)
    .eq('status', 'published')

  if (!cards || cards.length === 0) return []

  const results = await Promise.all(
    cards.map((c: any) => getStudentAdmitCard(studentId, c.examination_id))
  )

  return results.filter((c): c is AdmitCard => c !== null)
}

export interface VerificationResult {
  state: 'VALID' | 'REVOKED' | 'SUPERSEDED' | 'UNPUBLISHED' | 'INVALID'
  isValid: boolean
  admitCardNumber?: string
  documentFingerprint?: string
  version?: number
  verificationToken?: string
  status?: string
  publishedAt?: string
  verifiedAt: string
  academicSession?: string
  studentName?: string
  admissionNumber?: string
  rollNumber?: string
  className?: string
  sectionName?: string
  examinationName?: string
  schoolName?: string
  replacementReason?: string | null
  revocationReason?: string | null
}

export async function getAdmitCardByToken(verificationToken: string): Promise<VerificationResult | null> {
  const supabase = (await createClient()) as any
  const verifiedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  if (!verificationToken || verificationToken.trim().length === 0) {
    return { state: 'INVALID', isValid: false, verifiedAt }
  }

  const { data: card } = await supabase
    .from('admit_cards')
    .select(`
      admit_card_number,
      version,
      document_fingerprint,
      status,
      published_at,
      created_at,
      verification_token,
      replacement_reason,
      revocation_reason,
      data_snapshot,
      students(
        first_name,
        middle_name,
        last_name,
        admission_number,
        roll_number,
        classes(name),
        sections(name)
      ),
      examinations(name, code),
      academic_sessions(name),
      schools(name)
    `)
    .eq('verification_token', verificationToken)
    .maybeSingle()

  if (!card) {
    return { state: 'INVALID', isValid: false, verifiedAt }
  }

  const snap = card.data_snapshot
  const student = card.students
  const sName = snap?.studentName || (student
    ? [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').trim()
    : 'Candidate')

  // Determine granular public verification state
  let state: 'VALID' | 'REVOKED' | 'SUPERSEDED' | 'UNPUBLISHED' | 'INVALID' = 'UNPUBLISHED'
  if (card.status === 'published') {
    state = 'VALID'
  } else if (card.status === 'revoked') {
    state = 'REVOKED'
  } else if (card.status === 'superseded') {
    state = 'SUPERSEDED'
  } else {
    state = 'UNPUBLISHED'
  }

  return {
    state,
    isValid: state === 'VALID',
    admitCardNumber: card.admit_card_number,
    version: card.version || snap?.version || 1,
    documentFingerprint: card.document_fingerprint || snap?.documentFingerprint || `RPS-AC-${card.admit_card_number}`,
    verificationToken: card.verification_token,
    status: card.status,
    publishedAt: formatFormalDate(snap?.issueDate || card.published_at || card.created_at),
    verifiedAt,
    academicSession: snap?.academicSessionName || card.academic_sessions?.name || '2025–2026',
    studentName: sName,
    admissionNumber: snap?.admissionNumber || student?.admission_number || 'N/A',
    rollNumber: snap?.rollNumber || student?.roll_number || 'N/A',
    className: snap?.className || student?.classes?.name || 'N/A',
    sectionName: snap?.sectionName || student?.sections?.name || '',
    examinationName: snap?.examinationName || card.examinations?.name || 'Official Examination',
    schoolName: snap?.schoolName || card.schools?.name || 'Roshani Public School',
    replacementReason: card.replacement_reason || null,
    revocationReason: card.revocation_reason || null,
  }
}
