'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { generateReportCardSnapshotEngine } from './document-generation-engine'
import {
  generateReportCardSchema,
  batchGenerateReportCardsSchema,
  updateTeacherRemarksSchema,
  approveReportCardSchema,
  publishReportCardSchema,
  correctReportCardSchema,
  issueCertificateSchema,
  revokeCertificateSchema,
  type GenerateReportCardInput,
  type BatchGenerateReportCardsInput,
  type UpdateTeacherRemarksInput,
  type ApproveReportCardInput,
  type PublishReportCardInput,
  type CorrectReportCardInput,
  type IssueCertificateInput,
  type RevokeCertificateInput,
} from './schemas-documents'

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
// REPORT CARD GENERATION, APPROVAL & PUBLICATION ACTIONS
// ============================================================

export async function generateReportCardAction(input: GenerateReportCardInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher'])) return { success: false, error: 'Forbidden' }

    const validated = generateReportCardSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const snapshot = await generateReportCardSnapshotEngine(
      schoolId,
      validated.examinationId,
      validated.studentId,
      validated.classId,
      validated.templateId
    )

    if (!snapshot) return { success: false, error: 'Final examination result not found for this candidate. Calculate and finalize results first.' }

    const { data: card, error } = await supabase
      .from('report_cards')
      .upsert(
        {
          school_id: schoolId,
          academic_session_id: snapshot.academicSessionId,
          student_id: validated.studentId,
          student_academic_history_id: snapshot.studentAcademicHistoryId,
          class_id: validated.classId,
          section_id: snapshot.sectionId,
          examination_id: validated.examinationId,
          result_id: snapshot.resultId,
          template_id: snapshot.templateId,
          attendance_days: snapshot.attendanceDays,
          present_days: snapshot.presentDays,
          absent_days: snapshot.absentDays,
          leave_days: snapshot.leaveDays,
          attendance_percentage: snapshot.attendancePercentage,
          overall_percentage: snapshot.overallPercentage,
          overall_grade: snapshot.overallGrade,
          result_status: snapshot.resultStatus,
          promotion_status: snapshot.promotionStatus,
          teacher_remarks: validated.teacherRemarks || null,
          status: 'generated',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'school_id,academic_session_id,examination_id,student_id' }
      )
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'GENERATE_REPORT_CARD', 'report_cards', card.id, null, {
      studentId: validated.studentId,
      examinationId: validated.examinationId,
    })

    return { success: true, data: card }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate report card' }
  }
}

export async function batchGenerateReportCardsAction(input: BatchGenerateReportCardsInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher'])) return { success: false, error: 'Forbidden' }

    const validated = batchGenerateReportCardsSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: exam } = await supabase
      .from('examinations')
      .select('academic_session_id')
      .eq('id', validated.examinationId)
      .eq('school_id', schoolId)
      .single()

    if (!exam) return { success: false, error: 'Examination master not found' }

    const { data: enrollments } = await supabase
      .from('student_academic_history')
      .select('student_id')
      .eq('school_id', schoolId)
      .eq('academic_session_id', exam.academic_session_id)
      .eq('class_id', validated.classId)

    if (!enrollments || enrollments.length === 0) {
      return { success: false, error: 'No active student enrollments found' }
    }

    let generatedCount = 0
    for (const enc of enrollments) {
      const res = await generateReportCardAction({
        examinationId: validated.examinationId,
        studentId: enc.student_id,
        classId: validated.classId,
        sectionId: validated.sectionId,
        templateId: validated.templateId,
      })
      if (res.success) generatedCount++
    }

    return { success: true, count: generatedCount }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to execute batch report card generation' }
  }
}

export async function updateTeacherRemarksAction(input: UpdateTeacherRemarksInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher'])) return { success: false, error: 'Forbidden' }

    const validated = updateTeacherRemarksSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: updated, error } = await supabase
      .from('report_cards')
      .update({
        teacher_remarks: validated.teacherRemarks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.reportCardId)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'UPDATE_TEACHER_REMARKS', 'report_cards', updated.id, null, { remarks: validated.teacherRemarks })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update teacher remarks' }
  }
}

export async function approveReportCardAction(input: ApproveReportCardInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = approveReportCardSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: updated, error } = await supabase
      .from('report_cards')
      .update({
        status: 'approved',
        principal_remarks: validated.principalRemarks || null,
        approved_by: authState.user.profileId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.reportCardId)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'APPROVE_REPORT_CARD', 'report_cards', updated.id, null, { status: 'approved' })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve report card' }
  }
}

export async function publishReportCardAction(input: PublishReportCardInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = publishReportCardSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: updated, error } = await supabase
      .from('report_cards')
      .update({
        status: 'published',
        published_by: authState.user.profileId,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('examination_id', validated.examinationId)
      .eq('class_id', validated.classId)
      .eq('school_id', schoolId)
      .in('status', ['generated', 'approved'])
      .select()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'PUBLISH_CLASS_REPORT_CARDS', 'report_cards', validated.examinationId, null, { count: updated?.length })

    return { success: true, count: updated?.length }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to publish report cards' }
  }
}

export async function correctReportCardAction(input: CorrectReportCardInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = correctReportCardSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: oldCard } = await supabase
      .from('report_cards')
      .select('*')
      .eq('id', validated.reportCardId)
      .eq('school_id', schoolId)
      .single()

    if (!oldCard) return { success: false, error: 'Report card record not found' }

    // Revoke old version
    await supabase.from('report_cards').update({ status: 'revoked', revocation_reason: `Replaced by Version ${oldCard.version + 1}` }).eq('id', oldCard.id)

    // Insert new version
    const { data: newCard, error } = await supabase
      .from('report_cards')
      .insert({
        school_id: schoolId,
        academic_session_id: oldCard.academic_session_id,
        student_id: oldCard.student_id,
        student_academic_history_id: oldCard.student_academic_history_id,
        class_id: oldCard.class_id,
        section_id: oldCard.section_id,
        examination_id: oldCard.examination_id,
        result_id: oldCard.result_id,
        template_id: oldCard.template_id,
        version: oldCard.version + 1,
        previous_report_card_id: oldCard.id,
        status: 'published',
        attendance_days: oldCard.attendance_days,
        present_days: oldCard.present_days,
        absent_days: oldCard.absent_days,
        leave_days: oldCard.leave_days,
        attendance_percentage: oldCard.attendance_percentage,
        overall_percentage: oldCard.overall_percentage,
        overall_grade: oldCard.overall_grade,
        result_status: oldCard.result_status,
        promotion_status: oldCard.promotion_status,
        teacher_remarks: validated.teacherRemarks ?? oldCard.teacher_remarks,
        principal_remarks: validated.principalRemarks ?? oldCard.principal_remarks,
        correction_reason: validated.reason,
        published_by: authState.user.profileId,
        published_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CORRECT_REPORT_CARD_VERSION', 'report_cards', newCard.id, oldCard, {
      newVersion: newCard.version,
      reason: validated.reason,
    })

    return { success: true, data: newCard }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to correct report card version' }
  }
}

// ============================================================
// ACADEMIC CERTIFICATE ISSUANCE & REVOCATION ACTIONS
// ============================================================

export async function issueCertificateAction(input: IssueCertificateInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) {
      return { success: false, error: 'Forbidden: Only Super Admin, Admin, or Principal can issue certificates' }
    }

    const validated = issueCertificateSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Fetch Student & Active History
    const { data: student } = await supabase
      .from('students')
      .select('*, classes(name), sections(name)')
      .eq('id', validated.studentId)
      .eq('school_id', schoolId)
      .single()

    if (!student) return { success: false, error: 'Student record not found' }

    const { data: history } = await supabase
      .from('student_academic_history')
      .select('id')
      .eq('student_id', student.id)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .maybeSingle()

    // Fetch Certificate Type ID
    const { data: certType } = await supabase
      .from('certificate_types')
      .select('id, name')
      .eq('code', validated.certificateTypeCode)
      .eq('school_id', schoolId)
      .single()

    if (!certType) return { success: false, error: `Certificate type '${validated.certificateTypeCode}' not configured` }

    // Execute atomic RPC to generate unique certificate number
    const { data: certNumber, error: rpcErr } = await supabase.rpc('generate_certificate_number', {
      p_school_id: schoolId,
      p_certificate_type_code: validated.certificateTypeCode,
      p_academic_year: validated.academicYear,
    })

    if (rpcErr || !certNumber) return { success: false, error: rpcErr?.message || 'Failed to generate certificate number' }

    // Build immutable data snapshot
    const dataSnapshot = {
      studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      admissionNumber: student.admission_number,
      fatherName: student.father_name,
      motherName: student.mother_name,
      dateOfBirth: student.date_of_birth,
      className: student.classes?.name || 'Class',
      sectionName: student.sections?.name || '',
      certificateTypeCode: validated.certificateTypeCode,
      certificateTypeName: certType.name,
      reason: validated.reason || null,
      remarks: validated.remarks || null,
      conductRemarks: validated.conductRemarks || 'GOOD',
      academicYear: validated.academicYear,
      issueDate: new Date().toISOString().split('T')[0],
    }

    const { data: cert, error } = await supabase
      .from('certificates')
      .insert({
        school_id: schoolId,
        student_id: student.id,
        student_academic_history_id: history?.id || null,
        certificate_type_id: certType.id,
        certificate_number: certNumber,
        status: 'ISSUED',
        data_snapshot: dataSnapshot,
        issued_by: authState.user.profileId,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'ISSUE_ACADEMIC_CERTIFICATE', 'certificates', cert.id, null, {
      certificateNumber: certNumber,
      certificateType: validated.certificateTypeCode,
    })

    return { success: true, data: cert }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to issue academic certificate' }
  }
}

export async function revokeCertificateAction(input: RevokeCertificateInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = revokeCertificateSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: cert } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', validated.certificateId)
      .eq('school_id', schoolId)
      .single()

    if (!cert) return { success: false, error: 'Certificate record not found' }
    if (cert.status === 'REVOKED') return { success: false, error: 'Certificate is already revoked' }

    const { data: updated, error } = await supabase
      .from('certificates')
      .update({
        status: 'REVOKED',
        revocation_reason: validated.reason,
        revoked_by: authState.user.profileId,
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', cert.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'REVOKE_ACADEMIC_CERTIFICATE', 'certificates', updated.id, cert, {
      status: 'REVOKED',
      reason: validated.reason,
    })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to revoke certificate' }
  }
}
