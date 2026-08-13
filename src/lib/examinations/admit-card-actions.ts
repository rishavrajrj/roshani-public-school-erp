'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { checkCandidateEligibility } from './eligibility-service'
import { getFinancialClearance } from '@/lib/fees/clearance-service'
import {
  generateAdmitCardSchema,
  bulkGenerateAdmitCardsSchema,
  overrideFinancialHoldSchema,
  publishAdmitCardSchema,
  revokeAdmitCardSchema,
  regenerateAdmitCardSchema,
  type GenerateAdmitCardInput,
  type BulkGenerateAdmitCardsInput,
  type OverrideFinancialHoldInput,
  type PublishAdmitCardInput,
  type RevokeAdmitCardInput,
  type RegenerateAdmitCardInput,
} from './schemas-admit-card'
import type { BulkGenerationSummary } from '@/types/admit-card'

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
// GENERATE SINGLE ADMIT CARD
// ============================================================

export async function generateAdmitCardAction(input: GenerateAdmitCardInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = generateAdmitCardSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // 1. Run Candidate Eligibility Check
    const eligibility = await checkCandidateEligibility(validated.studentId, validated.examinationId)
    if (!eligibility.isEligible) {
      return { success: false, error: `Candidate is ineligible: ${eligibility.reasons.join(', ')}`, eligibility }
    }

    // 2. Fetch Examination Details for Numbering Prefix
    const { data: exam } = await supabase
      .from('examinations')
      .select('*, academic_sessions(name)')
      .eq('id', validated.examinationId)
      .eq('school_id', schoolId)
      .single()

    if (!exam) return { success: false, error: 'Examination master not found' }

    // 3. Check existing active Admit Card
    const { data: existing } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('school_id', schoolId)
      .eq('examination_id', validated.examinationId)
      .eq('student_id', validated.studentId)
      .ne('status', 'revoked')
      .maybeSingle()

    if (existing) {
      if (existing.status === 'published') {
        return { success: false, error: `Admit Card ${existing.admit_card_number} is already published for this student`, data: existing }
      }
    }

    // 4. Determine Status based on Financial Clearance Gate
    const financialStatus = eligibility.financialClearanceStatus
    const isFinanciallyCleared = financialStatus === 'CLEAR' || financialStatus === 'WAIVED'
    const cardStatus = isFinanciallyCleared ? 'eligible' : 'blocked'

    // 5. Generate Concurrency-Safe Admit Card Number via RPC
    const { data: cardNumber } = await supabase.rpc('generate_admit_card_number', {
      p_school_id: schoolId,
      p_session_name: exam.academic_sessions?.name || 'SESSION',
      p_exam_code: exam.code || 'EXAM',
    })

    // 6. Insert Admit Card
    const cardData = {
      school_id: schoolId,
      academic_session_id: exam.academic_session_id,
      examination_id: validated.examinationId,
      student_id: validated.studentId,
      student_academic_history_id: eligibility.academicHistoryId || null,
      admit_card_number: cardNumber || `AC/${Date.now()}`,
      status: cardStatus,
      financial_clearance_status: financialStatus,
      financial_outstanding_amount: eligibility.totalOutstanding,
      financial_override: false,
      candidate_eligibility_status: 'eligible',
      updated_at: new Date().toISOString(),
    }

    let resultCard
    if (existing) {
      const { data, error } = await supabase
        .from('admit_cards')
        .update(cardData)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return { success: false, error: error.message }
      resultCard = data
    } else {
      const { data, error } = await supabase
        .from('admit_cards')
        .insert(cardData)
        .select()
        .single()
      if (error) return { success: false, error: error.message }
      resultCard = data
    }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'GENERATE_ADMIT_CARD', 'admit_cards', resultCard.id, null, {
      admitCardNumber: resultCard.admit_card_number,
      status: resultCard.status,
      financialClearanceStatus: financialStatus,
      outstandingAmount: eligibility.totalOutstanding,
    })

    return { success: true, data: resultCard }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate Admit Card' }
  }
}

// ============================================================
// BULK GENERATE ADMIT CARDS
// ============================================================

export async function bulkGenerateAdmitCardsAction(input: BulkGenerateAdmitCardsInput): Promise<{ success: boolean; summary?: BulkGenerationSummary; error?: string }> {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = bulkGenerateAdmitCardsSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Fetch Examination
    const { data: exam } = await supabase
      .from('examinations')
      .select('*, academic_sessions(id, name)')
      .eq('id', validated.examinationId)
      .eq('school_id', schoolId)
      .single()

    if (!exam) return { success: false, error: 'Examination not found' }

    // Fetch Students in Class via student_academic_history
    let query = supabase
      .from('student_academic_history')
      .select('student_id, students(id, first_name, last_name, admission_number, status)')
      .eq('school_id', schoolId)
      .eq('academic_session_id', exam.academic_session_id)
      .eq('class_id', validated.classId)

    if (validated.sectionId) {
      query = query.eq('section_id', validated.sectionId)
    }

    const { data: historyRecords } = await query
    if (!historyRecords || historyRecords.length === 0) {
      return { success: false, error: 'No active student enrollments found for the selected class/section' }
    }

    const summary: BulkGenerationSummary = {
      totalProcessed: 0,
      generatedEligible: 0,
      generatedBlocked: 0,
      skippedAlreadyPublished: 0,
      ineligibleCount: 0,
      results: [],
    }

    for (const rec of historyRecords) {
      const sId = rec.student_id
      const studentName = rec.students ? `${rec.students.first_name || ''} ${rec.students.last_name || ''}`.trim() : 'Student'
      const admNo = rec.students?.admission_number || 'N/A'
      summary.totalProcessed++

      // Generate single
      const res = await generateAdmitCardAction({ examinationId: validated.examinationId, studentId: sId })
      if (res.success && res.data) {
        if (res.data.status === 'eligible') summary.generatedEligible++
        if (res.data.status === 'blocked') summary.generatedBlocked++
        summary.results.push({
          studentId: sId,
          studentName,
          admissionNumber: admNo,
          status: res.data.status,
          financialClearanceStatus: res.data.financial_clearance_status,
          outstandingAmount: Number(res.data.financial_outstanding_amount),
          message: res.data.status === 'eligible' ? 'Admit Card Generated (Eligible)' : 'Admit Card Generated (Financially Blocked)',
        })
      } else {
        summary.ineligibleCount++
        summary.results.push({
          studentId: sId,
          studentName,
          admissionNumber: admNo,
          status: 'draft',
          financialClearanceStatus: 'OUTSTANDING',
          outstandingAmount: 0,
          message: res.error || 'Ineligible',
        })
      }
    }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'BULK_GENERATE_ADMIT_CARDS', 'admit_cards', validated.examinationId, null, {
      totalProcessed: summary.totalProcessed,
      eligible: summary.generatedEligible,
      blocked: summary.generatedBlocked,
    })

    return { success: true, summary }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed bulk Admit Card generation' }
  }
}

// ============================================================
// ADMINISTRATIVE FINANCIAL OVERRIDE
// ============================================================

export async function overrideFinancialHoldAction(input: OverrideFinancialHoldInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    
    // Strict Role Policy: Super Admin, Admin, Principal ONLY
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) {
      return { success: false, error: 'Forbidden: Only Super Admin, Admin, or Principal can override financial holds' }
    }

    const validated = overrideFinancialHoldSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Fetch Admit Card
    const { data: card } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('id', validated.admitCardId)
      .eq('school_id', schoolId)
      .single()

    if (!card) return { success: false, error: 'Admit Card not found' }
    if (card.status === 'published') return { success: false, error: 'Admit Card is already published' }
    if (card.status === 'revoked') return { success: false, error: 'Cannot override a revoked Admit Card' }

    // Recalculate authoritative financial clearance snapshot
    const clearance = await getFinancialClearance(card.student_id, card.academic_session_id)

    // Execute Override on Admit Card Document Gate ONLY
    // NOTE: Financial ledger, invoices, payments, and fee balances remain 100% UNTOUCHED
    const { data: updated, error } = await supabase
      .from('admit_cards')
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
      .eq('id', card.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Record Append-Only Audit Trail with Financial Snapshot
    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'OVERRIDE_FINANCIAL_HOLD', 'admit_cards', updated.id, card, {
      overrideReason: validated.reason,
      overrideBy: authState.user.profileId,
      financialSnapshotStatus: clearance.status,
      financialOutstandingAmount: clearance.totalOutstanding,
      newStatus: 'override_released',
    })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to override financial hold' }
  }
}

// ============================================================
// PUBLISH ADMIT CARD
// ============================================================

export async function publishAdmitCardAction(input: PublishAdmitCardInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = publishAdmitCardSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: card } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('id', validated.admitCardId)
      .eq('school_id', schoolId)
      .single()

    if (!card) return { success: false, error: 'Admit Card not found' }
    if (card.status === 'blocked') {
      return { success: false, error: 'Cannot publish a financially blocked Admit Card. Perform an explicit Admin Financial Override first.' }
    }
    if (card.status === 'revoked') return { success: false, error: 'Cannot publish a revoked Admit Card' }
    if (card.status === 'published') return { success: false, error: 'Admit Card is already published' }

    const { data: updated, error } = await supabase
      .from('admit_cards')
      .update({
        status: 'published',
        published_by: authState.user.profileId,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', card.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'PUBLISH_ADMIT_CARD', 'admit_cards', updated.id, card, { status: 'published', publishedAt: updated.published_at })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to publish Admit Card' }
  }
}

// ============================================================
// REVOKE ADMIT CARD
// ============================================================

export async function revokeAdmitCardAction(input: RevokeAdmitCardInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = revokeAdmitCardSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: card } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('id', validated.admitCardId)
      .eq('school_id', schoolId)
      .single()

    if (!card) return { success: false, error: 'Admit Card not found' }
    if (card.status === 'revoked') return { success: false, error: 'Admit Card is already revoked' }

    const { data: updated, error } = await supabase
      .from('admit_cards')
      .update({
        status: 'revoked',
        revocation_reason: validated.reason,
        revoked_by: authState.user.profileId,
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', card.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'REVOKE_ADMIT_CARD', 'admit_cards', updated.id, card, { status: 'revoked', reason: validated.reason })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to revoke Admit Card' }
  }
}

// ============================================================
// REGENERATE ADMIT CARD (PRESERVE HISTORY)
// ============================================================

export async function regenerateAdmitCardAction(input: RegenerateAdmitCardInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = regenerateAdmitCardSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: oldCard } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('id', validated.oldAdmitCardId)
      .eq('school_id', schoolId)
      .single()

    if (!oldCard) return { success: false, error: 'Previous Admit Card record not found' }

    // Mark old card as revoked to preserve history
    await supabase
      .from('admit_cards')
      .update({
        status: 'revoked',
        revocation_reason: `Regenerated: ${validated.reason}`,
        revoked_by: authState.user.profileId,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', oldCard.id)

    // Issue new card
    const genRes = await generateAdmitCardAction({ examinationId: oldCard.examination_id, studentId: oldCard.student_id })
    if (!genRes.success) return genRes

    // Store previous_admit_card_id link
    await supabase
      .from('admit_cards')
      .update({ previous_admit_card_id: oldCard.id })
      .eq('id', genRes.data.id)

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'REGENERATE_ADMIT_CARD', 'admit_cards', genRes.data.id, oldCard, {
      oldCardId: oldCard.id,
      reason: validated.reason,
    })

    return genRes
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to regenerate Admit Card' }
  }
}
