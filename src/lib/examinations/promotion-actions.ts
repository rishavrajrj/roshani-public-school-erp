'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { evaluateStudentPromotionEngine } from './promotion-evaluation-engine'
import {
  recommendPromotionSchema,
  batchRecommendPromotionSchema,
  approvePromotionSchema,
  executePromotionSchema,
  batchExecutePromotionSchema,
  updateStudentLifecycleSchema,
  type RecommendPromotionInput,
  type BatchRecommendPromotionInput,
  type ApprovePromotionInput,
  type ExecutePromotionInput,
  type BatchExecutePromotionInput,
  type UpdateStudentLifecycleInput,
} from './schemas-promotion'
import type { PromotionEvaluationResult } from '@/types/promotion'

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
// PROMOTION EVALUATION & RECOMMENDATION ACTIONS
// ============================================================

export async function evaluateClassPromotionAction(
  sourceSessionId: string,
  examinationId: string,
  sourceClassId: string
): Promise<{ success: boolean; data?: PromotionEvaluationResult[]; error?: string }> {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher'])) return { success: false, error: 'Forbidden' }

    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Fetch enrolled students in class for session via student_academic_history
    const { data: enrollments } = await supabase
      .from('student_academic_history')
      .select('student_id')
      .eq('school_id', schoolId)
      .eq('academic_session_id', sourceSessionId)
      .eq('class_id', sourceClassId)

    if (!enrollments || enrollments.length === 0) {
      return { success: true, data: [] }
    }

    const evaluations: PromotionEvaluationResult[] = []
    for (const enc of enrollments) {
      const evalRes = await evaluateStudentPromotionEngine(
        schoolId,
        sourceSessionId,
        examinationId,
        enc.student_id,
        sourceClassId
      )
      if (evalRes) evaluations.push(evalRes)
    }

    return { success: true, data: evaluations }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to evaluate class promotion' }
  }
}

export async function recommendPromotionAction(input: RecommendPromotionInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher'])) return { success: false, error: 'Forbidden' }

    const validated = recommendPromotionSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: record, error } = await supabase
      .from('promotion_records')
      .upsert(
        {
          school_id: schoolId,
          student_id: validated.studentId,
          source_academic_history_id: validated.sourceAcademicHistoryId,
          source_academic_session_id: validated.sourceAcademicSessionId,
          target_academic_session_id: validated.targetAcademicSessionId,
          source_class_id: validated.sourceClassId,
          target_class_id: validated.targetClassId || null,
          target_section_id: validated.targetSectionId || null,
          source_result_id: validated.sourceResultId || null,
          decision: validated.decision,
          conditional: validated.conditional,
          condition_description: validated.conditionDescription || null,
          reason: validated.reason || null,
          recommended_by: authState.user.profileId,
          recommended_at: new Date().toISOString(),
          status: 'recommended',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'school_id,target_academic_session_id,student_id' }
      )
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'RECOMMEND_PROMOTION', 'promotion_records', record.id, null, {
      decision: validated.decision,
      studentId: validated.studentId,
    })

    return { success: true, data: record }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to record promotion recommendation' }
  }
}

export async function batchRecommendPromotionsAction(input: BatchRecommendPromotionInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal', 'Teacher'])) return { success: false, error: 'Forbidden' }

    const validated = batchRecommendPromotionSchema.parse(input)
    let count = 0

    for (const rec of validated.recommendations) {
      const res = await recommendPromotionAction(rec)
      if (res.success) count++
    }

    return { success: true, count }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to execute batch promotion recommendations' }
  }
}

// ============================================================
// PROMOTION APPROVAL & ATOMIC EXECUTION ACTIONS
// ============================================================

export async function approvePromotionAction(input: ApprovePromotionInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) {
      return { success: false, error: 'Forbidden: Only Super Admin, Admin, or Principal can approve promotions' }
    }

    const validated = approvePromotionSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: rec } = await supabase
      .from('promotion_records')
      .select('*')
      .eq('id', validated.promotionRecordId)
      .eq('school_id', schoolId)
      .single()

    if (!rec) return { success: false, error: 'Promotion record not found' }
    if (rec.status === 'executed') return { success: false, error: 'Promotion is already executed' }

    // Enforce Self-Approval Protection
    if (rec.recommended_by && rec.recommended_by === authState.user.profileId) {
      return { success: false, error: 'Self-approval protection: An administrator cannot approve a promotion they recommended.' }
    }

    const { data: updated, error } = await supabase
      .from('promotion_records')
      .update({
        status: 'approved',
        approved_by: authState.user.profileId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rec.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'APPROVE_PROMOTION', 'promotion_records', updated.id, rec, { status: 'approved' })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve promotion' }
  }
}

export async function executePromotionAction(input: ExecutePromotionInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) {
      return { success: false, error: 'Forbidden: Only Super Admin, Admin, or Principal can execute promotions' }
    }

    const validated = executePromotionSchema.parse(input)
    const supabase = (await createClient()) as any

    // Execute atomic RPC function
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('execute_student_promotion', {
      p_promotion_record_id: validated.promotionRecordId,
      p_actor_profile_id: authState.user.profileId,
    })

    if (rpcErr) return { success: false, error: rpcErr.message }

    await writeAuditLog(supabase, authState.user.schoolId, authState.user.profileId, 'EXECUTE_PROMOTION', 'promotion_records', validated.promotionRecordId, null, rpcRes)

    return { success: true, data: rpcRes }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to execute promotion' }
  }
}

export async function executeBulkPromotionsAction(input: BatchExecutePromotionInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = batchExecutePromotionSchema.parse(input)
    let executedCount = 0

    for (const recordId of validated.promotionRecordIds) {
      const res = await executePromotionAction({ promotionRecordId: recordId })
      if (res.success) executedCount++
    }

    return { success: true, count: executedCount }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to execute bulk promotions' }
  }
}

// ============================================================
// STUDENT LIFECYCLE MANAGEMENT (TRANSFER / WITHDRAWAL / GRADUATION)
// ============================================================

export async function updateStudentStatusLifecycleAction(input: UpdateStudentLifecycleInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = updateStudentLifecycleSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', validated.studentId)
      .eq('school_id', schoolId)
      .single()

    if (!student) return { success: false, error: 'Student record not found' }

    const { data: updated, error } = await supabase
      .from('students')
      .update({
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', student.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'UPDATE_STUDENT_LIFECYCLE_STATUS', 'students', updated.id, student, {
      oldStatus: student.status,
      newStatus: validated.status,
      reason: validated.reason,
    })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update student lifecycle status' }
  }
}
