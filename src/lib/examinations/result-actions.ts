'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getFinancialClearance } from '@/lib/fees/clearance-service'
import { calculateStudentResultEngine } from './result-calculation-engine'
import {
  batchSaveMarksSchema,
  submitMarksSchema,
  correctSubmittedMarkSchema,
  lockMarksSchema,
  unlockMarksSchema,
  calculateResultsSchema,
  approveResultsSchema,
  overrideResultFinancialHoldSchema,
  publishResultsSchema,
  revokeResultSchema,
  type BatchSaveMarksInput,
  type SubmitMarksInput,
  type CorrectSubmittedMarkInput,
  type LockMarksInput,
  type UnlockMarksInput,
  type CalculateResultsInput,
  type ApproveResultsInput,
  type OverrideResultFinancialHoldInput,
  type PublishResultsInput,
  type RevokeResultInput,
} from './schemas-results'
import type { ResultCalculationSummary } from '@/types/result'

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
// MARKS ENTRY & SUBMISSION ACTIONS
// ============================================================

export async function saveMarksAction(input: BatchSaveMarksInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher'])) return { success: false, error: 'Forbidden' }

    const validated = batchSaveMarksSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Fetch Examination & Subject Config
    const { data: exam } = await supabase
      .from('examinations')
      .select('*, academic_sessions(id)')
      .eq('id', validated.examinationId)
      .eq('school_id', schoolId)
      .single()

    if (!exam) return { success: false, error: 'Examination master not found' }

    const { data: config } = await supabase
      .from('examination_subject_configs')
      .select('*')
      .eq('examination_id', validated.examinationId)
      .eq('class_id', validated.classId)
      .eq('subject_id', validated.subjectId)
      .eq('school_id', schoolId)
      .single()

    const maxMarks = config ? Number(config.maximum_marks) : 100
    const passMarks = config ? Number(config.passing_marks) : 33

    const upserts = []
    for (const m of validated.marks) {
      const theory = m.theoryMarksObtained || 0
      const practical = m.practicalMarksObtained || 0
      const internal = m.internalMarksObtained || 0
      const total = m.attendanceStatus === 'present' ? (theory + practical + internal) : 0

      if (total > maxMarks) {
        return { success: false, error: `Marks obtained (${total}) cannot exceed maximum subject marks (${maxMarks})` }
      }

      const isPass = m.attendanceStatus === 'present' && total >= passMarks

      upserts.push({
        school_id: schoolId,
        academic_session_id: exam.academic_session_id,
        examination_id: validated.examinationId,
        student_id: m.studentId,
        class_id: validated.classId,
        section_id: validated.sectionId || null,
        subject_id: validated.subjectId,
        examination_subject_config_id: config?.id || null,
        attendance_status: m.attendanceStatus,
        theory_marks_obtained: theory,
        practical_marks_obtained: practical,
        internal_marks_obtained: internal,
        total_marks_obtained: total,
        is_pass: isPass,
        status: 'draft',
        created_by: authState.user.profileId,
        updated_by: authState.user.profileId,
        updated_at: new Date().toISOString(),
      })
    }

    const { data: saved, error } = await supabase
      .from('student_marks')
      .upsert(upserts, { onConflict: 'examination_id,student_id,subject_id' })
      .select()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'SAVE_STUDENT_MARKS', 'student_marks', validated.examinationId, null, {
      count: saved?.length,
      classId: validated.classId,
      subjectId: validated.subjectId,
    })

    return { success: true, count: saved?.length }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save marks' }
  }
}

export async function submitMarksAction(input: SubmitMarksInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher'])) return { success: false, error: 'Forbidden' }

    const validated = submitMarksSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    let query = supabase
      .from('student_marks')
      .update({
        status: 'submitted',
        submitted_by: authState.user.profileId,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('examination_id', validated.examinationId)
      .eq('class_id', validated.classId)
      .eq('subject_id', validated.subjectId)
      .eq('school_id', schoolId)

    if (validated.sectionId) {
      query = query.eq('section_id', validated.sectionId)
    }

    const { data: updated, error } = await query.select()
    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'SUBMIT_MARKS', 'student_marks', validated.examinationId, null, {
      count: updated?.length,
      classId: validated.classId,
      subjectId: validated.subjectId,
    })

    return { success: true, count: updated?.length }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit marks' }
  }
}

export async function correctSubmittedMarkAction(input: CorrectSubmittedMarkInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher'])) return { success: false, error: 'Forbidden' }

    const validated = correctSubmittedMarkSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: oldMark } = await supabase
      .from('student_marks')
      .select('*, examination_subject_configs(maximum_marks, passing_marks)')
      .eq('id', validated.markId)
      .eq('school_id', schoolId)
      .single()

    if (!oldMark) return { success: false, error: 'Mark entry not found' }
    if (oldMark.status === 'locked') return { success: false, error: 'Cannot edit locked marks. Perform an official administrative unlock first.' }

    const maxMarks = oldMark.examination_subject_configs ? Number(oldMark.examination_subject_configs.maximum_marks) : 100
    const passMarks = oldMark.examination_subject_configs ? Number(oldMark.examination_subject_configs.passing_marks) : 33

    const total = validated.attendanceStatus === 'present'
      ? (validated.theoryMarksObtained + validated.practicalMarksObtained + validated.internalMarksObtained)
      : 0

    if (total > maxMarks) {
      return { success: false, error: `Total corrected marks (${total}) cannot exceed maximum subject marks (${maxMarks})` }
    }

    const isPass = validated.attendanceStatus === 'present' && total >= passMarks

    const { data: updated, error } = await supabase
      .from('student_marks')
      .update({
        attendance_status: validated.attendanceStatus,
        theory_marks_obtained: validated.theoryMarksObtained,
        practical_marks_obtained: validated.practicalMarksObtained,
        internal_marks_obtained: validated.internalMarksObtained,
        total_marks_obtained: total,
        is_pass: isPass,
        correction_reason: validated.reason,
        updated_by: authState.user.profileId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.markId)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CORRECT_SUBMITTED_MARK', 'student_marks', updated.id, oldMark, {
      newTotal: total,
      reason: validated.reason,
    })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to correct mark entry' }
  }
}

export async function lockMarksAction(input: LockMarksInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = lockMarksSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: updated, error } = await supabase
      .from('student_marks')
      .update({
        status: 'locked',
        locked_by: authState.user.profileId,
        locked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('examination_id', validated.examinationId)
      .eq('class_id', validated.classId)
      .eq('subject_id', validated.subjectId)
      .eq('school_id', schoolId)
      .select()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'LOCK_MARKS', 'student_marks', validated.examinationId, null, { count: updated?.length })

    return { success: true, count: updated?.length }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to lock marks' }
  }
}

export async function unlockMarksAction(input: UnlockMarksInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = unlockMarksSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: updated, error } = await supabase
      .from('student_marks')
      .update({
        status: 'submitted',
        correction_reason: `Unlocked by Admin: ${validated.reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('examination_id', validated.examinationId)
      .eq('class_id', validated.classId)
      .eq('subject_id', validated.subjectId)
      .eq('school_id', schoolId)
      .select()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'UNLOCK_MARKS', 'student_marks', validated.examinationId, null, { reason: validated.reason, count: updated?.length })

    return { success: true, count: updated?.length }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to unlock marks' }
  }
}

// ============================================================
// RESULT CALCULATION & APPROVAL ACTIONS
// ============================================================

export async function calculateClassResultsAction(input: CalculateResultsInput): Promise<{ success: boolean; summary?: ResultCalculationSummary; error?: string }> {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = calculateResultsSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Fetch Examination Master
    const { data: exam } = await supabase
      .from('examinations')
      .select('*, academic_sessions(id)')
      .eq('id', validated.examinationId)
      .eq('school_id', schoolId)
      .single()

    if (!exam) return { success: false, error: 'Examination master not found' }

    // Fetch enrolled students in class via student_academic_history
    let query = supabase
      .from('student_academic_history')
      .select('student_id')
      .eq('school_id', schoolId)
      .eq('academic_session_id', exam.academic_session_id)
      .eq('class_id', validated.classId)

    if (validated.sectionId) query = query.eq('section_id', validated.sectionId)

    const { data: enrollments } = await query
    if (!enrollments || enrollments.length === 0) {
      return { success: false, error: 'No active student enrollments found for the selected class/section' }
    }

    const summary: ResultCalculationSummary = {
      totalStudents: enrollments.length,
      calculatedCount: 0,
      passedCount: 0,
      failedCount: 0,
      blockedCount: 0,
      results: [],
    }

    for (const enc of enrollments) {
      const sId = enc.student_id
      const calc = await calculateStudentResultEngine(schoolId, validated.examinationId, sId, validated.classId)
      if (!calc) continue

      // Check current financial clearance gate
      const clearance = await getFinancialClearance(sId, exam.academic_session_id)
      const isFinanciallyCleared = clearance.status === 'CLEAR' || clearance.status === 'WAIVED'
      const resultLifecycleStatus = isFinanciallyCleared ? 'calculated' : 'blocked'

      if (calc.resultStatus === 'PASS') summary.passedCount++
      else summary.failedCount++

      if (!isFinanciallyCleared) summary.blockedCount++
      summary.calculatedCount++

      // Upsert into student_results
      const { data: resultRecord } = await supabase
        .from('student_results')
        .upsert(
          {
            school_id: schoolId,
            academic_session_id: exam.academic_session_id,
            examination_id: validated.examinationId,
            student_id: sId,
            student_academic_history_id: calc.academicHistoryId || null,
            class_id: validated.classId,
            section_id: calc.sectionId || null,
            total_marks_obtained: calc.totalMarksObtained,
            maximum_marks: calc.maximumMarks,
            percentage: calc.percentage,
            result_status: calc.resultStatus,
            grade: calc.grade,
            status: resultLifecycleStatus,
            financial_clearance_status: clearance.status,
            financial_outstanding_amount: clearance.totalOutstanding,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'school_id,academic_session_id,examination_id,student_id' }
        )
        .select()
        .single()

      if (resultRecord) {
        summary.results.push({
          id: resultRecord.id,
          schoolId,
          academicSessionId: exam.academic_session_id,
          examinationId: validated.examinationId,
          studentId: sId,
          classId: validated.classId,
          totalMarksObtained: calc.totalMarksObtained,
          maximumMarks: calc.maximumMarks,
          percentage: calc.percentage,
          resultStatus: calc.resultStatus,
          grade: calc.grade,
          status: resultLifecycleStatus,
          financialClearanceStatus: clearance.status,
          financialOutstandingAmount: clearance.totalOutstanding,
          financialOverride: resultRecord.financial_override || false,
          version: resultRecord.version || 1,
          createdAt: resultRecord.created_at,
          updatedAt: resultRecord.updated_at,
        })
      }
    }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'CALCULATE_CLASS_RESULTS', 'student_results', validated.examinationId, null, {
      calculated: summary.calculatedCount,
      passed: summary.passedCount,
      failed: summary.failedCount,
      blocked: summary.blockedCount,
    })

    return { success: true, summary }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to calculate class results' }
  }
}

export async function approveResultsAction(input: ApproveResultsInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = approveResultsSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: updated, error } = await supabase
      .from('student_results')
      .update({
        status: 'approved',
        approved_by: authState.user.profileId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('examination_id', validated.examinationId)
      .eq('class_id', validated.classId)
      .eq('school_id', schoolId)
      .in('status', ['calculated', 'override_released'])
      .select()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'APPROVE_CLASS_RESULTS', 'student_results', validated.examinationId, null, { count: updated?.length })

    return { success: true, count: updated?.length }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve results' }
  }
}

// ============================================================
// ADMINISTRATIVE RESULT FINANCIAL OVERRIDE
// ============================================================

export async function overrideResultFinancialHoldAction(input: OverrideResultFinancialHoldInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) {
      return { success: false, error: 'Forbidden: Only Super Admin, Admin, or Principal can override result financial holds' }
    }

    const validated = overrideResultFinancialHoldSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: res } = await supabase
      .from('student_results')
      .select('*')
      .eq('id', validated.resultId)
      .eq('school_id', schoolId)
      .single()

    if (!res) return { success: false, error: 'Student result record not found' }
    if (res.status === 'published') return { success: false, error: 'Result is already published' }
    if (res.status === 'revoked') return { success: false, error: 'Cannot override a revoked result' }

    // Recalculate authoritative financial clearance snapshot
    const clearance = await getFinancialClearance(res.student_id, res.academic_session_id)

    // Execute Override on Result Document Gate ONLY
    // NOTE: Financial ledger, invoices, payments, and fee balances remain 100% UNTOUCHED
    const { data: updated, error } = await supabase
      .from('student_results')
      .update({
        status: 'override_released',
        financial_override: true,
        override_reason: validated.reason,
        override_by: authState.user.profileId,
        override_at: new Date().toISOString(),
        financial_clearance_status: clearance.status,
        financial_outstanding_amount: clearance.totalOutstanding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', res.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'OVERRIDE_RESULT_FINANCIAL_HOLD', 'student_results', updated.id, res, {
      overrideReason: validated.reason,
      overrideBy: authState.user.profileId,
      financialSnapshotStatus: clearance.status,
      financialOutstandingAmount: clearance.totalOutstanding,
      newStatus: 'override_released',
    })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to override result financial hold' }
  }
}

// ============================================================
// RESULT PUBLICATION & REVOCATION
// ============================================================

export async function publishResultsAction(input: PublishResultsInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = publishResultsSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Verify Examination Master Status === 'completed'
    const { data: exam } = await supabase
      .from('examinations')
      .select('status')
      .eq('id', validated.examinationId)
      .eq('school_id', schoolId)
      .single()

    if (!exam) return { success: false, error: 'Examination master not found' }
    if (exam.status !== 'completed' && exam.status !== 'published') {
      return { success: false, error: `Cannot publish results while examination status is '${exam.status}'. Examination must be completed.` }
    }

    // F4 Fix: Fetch candidates and re-check financial clearance at publication time
    const { data: candidates } = await supabase
      .from('student_results')
      .select('id, student_id, academic_session_id, status')
      .eq('examination_id', validated.examinationId)
      .eq('class_id', validated.classId)
      .eq('school_id', schoolId)
      .in('status', ['approved', 'override_released'])

    if (candidates && candidates.length > 0) {
      for (const cand of candidates) {
        if (cand.status === 'approved') {
          const clearance = await getFinancialClearance(cand.student_id, cand.academic_session_id)
          if (clearance.status !== 'CLEAR' && clearance.status !== 'WAIVED') {
            await supabase
              .from('student_results')
              .update({ status: 'withheld', updated_at: new Date().toISOString() })
              .eq('id', cand.id)
          }
        }
      }
    }

    // Publish approved (that passed clearance re-check) or override_released results
    const { data: updated, error } = await supabase
      .from('student_results')
      .update({
        status: 'published',
        published_by: authState.user.profileId,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('examination_id', validated.examinationId)
      .eq('class_id', validated.classId)
      .eq('school_id', schoolId)
      .in('status', ['approved', 'override_released'])
      .select()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'PUBLISH_CLASS_RESULTS', 'student_results', validated.examinationId, null, { count: updated?.length })

    return { success: true, count: updated?.length }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to publish class results' }
  }
}

export async function revokeResultAction(input: RevokeResultInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = revokeResultSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: res } = await supabase
      .from('student_results')
      .select('*')
      .eq('id', validated.resultId)
      .eq('school_id', schoolId)
      .single()

    if (!res) return { success: false, error: 'Result not found' }
    if (res.status === 'revoked') return { success: false, error: 'Result is already revoked' }

    const { data: updated, error } = await supabase
      .from('student_results')
      .update({
        status: 'revoked',
        revocation_reason: validated.reason,
        revoked_by: authState.user.profileId,
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', res.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'REVOKE_STUDENT_RESULT', 'student_results', updated.id, res, { status: 'revoked', reason: validated.reason })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to revoke result' }
  }
}
