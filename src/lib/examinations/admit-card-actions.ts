'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { checkCandidateEligibility } from './eligibility-service'
import { getFinancialClearance } from '@/lib/fees/clearance-service'
import { generateSecureVerificationToken, generateDocumentFingerprint } from './admit-card-crypto'
import {
  generateAdmitCardSchema,
  bulkGenerateAdmitCardsSchema,
  overrideFinancialHoldSchema,
  publishAdmitCardSchema,
  bulkPublishAdmitCardsSchema,
  revokeAdmitCardSchema,
  regenerateAdmitCardSchema,
  type GenerateAdmitCardInput,
  type BulkGenerateAdmitCardsInput,
  type OverrideFinancialHoldInput,
  type PublishAdmitCardInput,
  type BulkPublishAdmitCardsInput,
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

/**
 * Builds an authoritative, immutable data snapshot for the admit card at generation/publication time.
 */
async function buildAdmitCardSnapshot(
  supabase: any,
  schoolId: string,
  studentId: string,
  examinationId: string,
  cardMeta: {
    admitCardNumber: string
    version: number
    fingerprint: string
    verificationToken: string
    issueDate?: string
  }
) {
  // 1. Fetch Student Details
  const { data: student } = await supabase
    .from('students')
    .select(`
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
    `)
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .single()

  // 2. Fetch Examination Details
  const { data: exam } = await supabase
    .from('examinations')
    .select('*, academic_sessions(name), schools(name)')
    .eq('id', examinationId)
    .eq('school_id', schoolId)
    .single()

  // 3. Fetch Examination Schedules
  const { data: schedules } = await supabase
    .from('examination_schedules')
    .select('*, subjects(name, code)')
    .eq('examination_id', examinationId)
    .eq('school_id', schoolId)
    .order('exam_date', { ascending: true })
    .order('start_time', { ascending: true })

  const timetable = schedules?.map((s: any, idx: number) => ({
    sNo: idx + 1,
    date: s.exam_date,
    subjectName: s.subjects?.name || 'Subject',
    subjectCode: s.subjects?.code || 'SUB-00',
    subjectType: s.subjects?.name?.toLowerCase().includes('lab') || s.subjects?.name?.toLowerCase().includes('practical') ? 'Practical' : 'Theory',
    startTime: s.start_time,
    endTime: s.end_time,
    durationMinutes: s.duration_minutes,
    room: s.room || 'Main Hall',
    venue: s.venue || 'Roshani Public School — Main Campus',
    maximumMarks: Number(s.maximum_marks),
    status: 'Eligible',
  })) || []

  const fullName = student
    ? [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').trim()
    : 'Student'

  let fatherName = 'N/A'
  let motherName = 'N/A'
  if (student?.student_guardians && Array.isArray(student.student_guardians)) {
    const father = student.student_guardians.find((g: any) => g.relationship?.toLowerCase() === 'father')
    const mother = student.student_guardians.find((g: any) => g.relationship?.toLowerCase() === 'mother')
    if (father?.guardians?.full_name) fatherName = father.guardians.full_name
    if (mother?.guardians?.full_name) motherName = mother.guardians.full_name
  }

  const firstSched = schedules?.[0]

  return {
    studentName: fullName,
    admissionNumber: student?.admission_number || 'N/A',
    rollNumber: student?.roll_number || 'N/A',
    className: student?.classes?.name || 'Class',
    sectionName: student?.sections?.name || '',
    fatherName,
    motherName,
    dateOfBirth: student?.date_of_birth || null,
    gender: student?.gender || 'N/A',
    house: 'Tagore House',
    examinationCenter: firstSched?.venue || 'Roshani Public School — Main Campus',
    examCenterRoom: firstSched?.room || 'Main Hall / Room 101',
    photoUrl: student?.photo_url || null,
    examinationName: exam?.name || 'Annual Examination',
    examinationCode: exam?.code || 'ANNUAL',
    academicSessionName: exam?.academic_sessions?.name || '2025–2026',
    schoolName: exam?.schools?.name || 'Roshani Public School',
    admitCardNumber: cardMeta.admitCardNumber,
    version: cardMeta.version,
    documentFingerprint: cardMeta.fingerprint,
    verificationToken: cardMeta.verificationToken,
    issueDate: cardMeta.issueDate || new Date().toISOString().split('T')[0],
    timetable,
  }
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

    // 2. Fetch Examination Details
    const { data: exam } = await supabase
      .from('examinations')
      .select('*, academic_sessions(name)')
      .eq('id', validated.examinationId)
      .eq('school_id', schoolId)
      .single()

    if (!exam) return { success: false, error: 'Examination master not found' }

    // 3. Check existing active (non-revoked, non-superseded) Admit Card
    const { data: existing } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('school_id', schoolId)
      .eq('examination_id', validated.examinationId)
      .eq('student_id', validated.studentId)
      .not('status', 'in', '("revoked","superseded")')
      .maybeSingle()

    if (existing) {
      if (existing.status === 'published') {
        return { success: false, error: `Admit Card ${existing.admit_card_number} is already published for this student`, data: existing }
      }
    }

    // 4. Financial Clearance Gate
    const financialStatus = eligibility.financialClearanceStatus
    const isFinanciallyCleared = financialStatus === 'CLEAR' || financialStatus === 'WAIVED'
    const cardStatus = isFinanciallyCleared ? 'eligible' : 'blocked'

    // 5. Generate Concurrency-Safe Admit Card Number & Crypto Token
    let cardNumber = existing?.admit_card_number
    if (!cardNumber) {
      const { data: generatedNumber } = await supabase.rpc('generate_admit_card_number', {
        p_school_id: schoolId,
        p_session_name: exam.academic_sessions?.name || 'SESSION',
        p_exam_code: exam.code || 'EXAM',
      })
      cardNumber = generatedNumber || `AC/${Date.now()}`
    }

    const verificationToken = existing?.verification_token || generateSecureVerificationToken()
    const fingerprint = existing?.document_fingerprint || generateDocumentFingerprint(new Date().getFullYear())
    const version = existing?.version || 1

    // 6. Build Snapshot
    const snapshot = await buildAdmitCardSnapshot(supabase, schoolId, validated.studentId, validated.examinationId, {
      admitCardNumber: cardNumber,
      version,
      fingerprint,
      verificationToken,
    })

    const cardData = {
      school_id: schoolId,
      academic_session_id: exam.academic_session_id,
      examination_id: validated.examinationId,
      student_id: validated.studentId,
      student_academic_history_id: eligibility.academicHistoryId || null,
      admit_card_number: cardNumber,
      version,
      document_fingerprint: fingerprint,
      verification_token: verificationToken,
      status: cardStatus,
      financial_clearance_status: financialStatus,
      financial_outstanding_amount: eligibility.totalOutstanding,
      financial_override: false,
      candidate_eligibility_status: 'eligible',
      data_snapshot: snapshot,
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
      version: resultCard.version,
      documentFingerprint: resultCard.document_fingerprint,
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

    const { data: exam } = await supabase
      .from('examinations')
      .select('*, academic_sessions(id, name)')
      .eq('id', validated.examinationId)
      .eq('school_id', schoolId)
      .single()

    if (!exam) return { success: false, error: 'Examination not found' }

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
      ineligible: summary.ineligibleCount,
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
    
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) {
      return { success: false, error: 'Forbidden: Only Super Admin, Admin, or Principal can override financial holds' }
    }

    const validated = overrideFinancialHoldSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    const { data: card } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('id', validated.admitCardId)
      .eq('school_id', schoolId)
      .single()

    if (!card) return { success: false, error: 'Admit Card not found' }
    if (card.status === 'published') return { success: false, error: 'Admit Card is already published' }
    if (card.status === 'revoked' || card.status === 'superseded') return { success: false, error: 'Cannot override an inactive Admit Card' }

    const clearance = await getFinancialClearance(card.student_id, card.academic_session_id)

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
// PUBLISH ADMIT CARD (FREEZES IMMUTABLE SNAPSHOT)
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
    if (card.status === 'revoked' || card.status === 'superseded') {
      return { success: false, error: `Cannot publish an inactive Admit Card (status: ${card.status})` }
    }
    if (card.status === 'published') return { success: false, error: 'Admit Card is already published' }

    // Live Financial Clearance Re-check
    if (card.status !== 'override_released') {
      const clearance = await getFinancialClearance(card.student_id, card.academic_session_id)
      if (clearance.status !== 'CLEAR' && clearance.status !== 'WAIVED') {
        await supabase
          .from('admit_cards')
          .update({ status: 'blocked', updated_at: new Date().toISOString() })
          .eq('id', card.id)
        return {
          success: false,
          error: `Financial clearance check failed at publication time (Status: ${clearance.status}, Outstanding: ₹${clearance.totalOutstanding}). Status reverted to blocked.`,
        }
      }
    }

    // Freeze definitive immutable snapshot
    const issueDate = new Date().toISOString().split('T')[0]
    const snapshot = await buildAdmitCardSnapshot(supabase, schoolId, card.student_id, card.examination_id, {
      admitCardNumber: card.admit_card_number,
      version: card.version || 1,
      fingerprint: card.document_fingerprint || generateDocumentFingerprint(),
      verificationToken: card.verification_token,
      issueDate,
    })

    const { data: updated, error } = await supabase
      .from('admit_cards')
      .update({
        status: 'published',
        published_by: authState.user.profileId,
        published_at: new Date().toISOString(),
        data_snapshot: snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq('id', card.id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'PUBLISH_ADMIT_CARD', 'admit_cards', updated.id, card, {
      status: 'published',
      publishedAt: updated.published_at,
      version: updated.version,
      documentFingerprint: updated.document_fingerprint,
    })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to publish Admit Card' }
  }
}

// ============================================================
// BULK PUBLISH ADMIT CARDS
// ============================================================

export async function bulkPublishAdmitCardsAction(input: BulkPublishAdmitCardsInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') return { success: false, error: 'Unauthorized' }
    if (!hasAnyRole(authState.user, ['Super Admin', 'Admin', 'Principal'])) return { success: false, error: 'Forbidden' }

    const validated = bulkPublishAdmitCardsSchema.parse(input)
    const supabase = (await createClient()) as any
    const schoolId = authState.user.schoolId

    // Find all eligible cards for this exam
    let query = supabase
      .from('admit_cards')
      .select('id, status')
      .eq('school_id', schoolId)
      .eq('examination_id', validated.examinationId)
      .in('status', ['eligible', 'override_released'])

    const { data: cards } = await query
    if (!cards || cards.length === 0) {
      return { success: false, error: 'No eligible Admit Cards found ready for publication' }
    }

    let publishedCount = 0
    let failedCount = 0

    for (const card of cards) {
      const res = await publishAdmitCardAction({ admitCardId: card.id })
      if (res.success) {
        publishedCount++
      } else {
        failedCount++
      }
    }

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'BULK_PUBLISH_ADMIT_CARDS', 'admit_cards', validated.examinationId, null, {
      totalCandidates: cards.length,
      publishedCount,
      failedCount,
    })

    return { success: true, publishedCount, failedCount, total: cards.length }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to bulk publish Admit Cards' }
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

    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'REVOKE_ADMIT_CARD', 'admit_cards', updated.id, card, {
      status: 'revoked',
      reason: validated.reason,
      revokedBy: authState.user.profileId,
    })

    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to revoke Admit Card' }
  }
}

// ============================================================
// REGENERATE / REPLACE ADMIT CARD (CREATES VERSION N+1 & SUPERSEDES)
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

    const fullReason = validated.replacementReason
      ? validated.replacementReason === 'Other' && validated.customExplanation
        ? `Other: ${validated.customExplanation}`
        : `${validated.replacementReason} — ${validated.reason}`
      : validated.reason

    // 1. Mark old version as SUPERSEDED (Immutable history preservation)
    await supabase
      .from('admit_cards')
      .update({
        status: 'superseded',
        superseded_at: new Date().toISOString(),
        superseded_by: authState.user.profileId,
        replacement_reason: fullReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', oldCard.id)

    // 2. Eligibility & Financial clearance for new version
    const eligibility = await checkCandidateEligibility(oldCard.student_id, oldCard.examination_id)
    const financialStatus = eligibility.financialClearanceStatus
    const isFinanciallyCleared = financialStatus === 'CLEAR' || financialStatus === 'WAIVED' || oldCard.financial_override
    const nextStatus = isFinanciallyCleared ? 'eligible' : 'blocked'

    const nextVersion = (oldCard.version || 1) + 1
    const newVerificationToken = generateSecureVerificationToken()
    const newFingerprint = generateDocumentFingerprint(new Date().getFullYear())

    // 3. Build snapshot for Version N+1
    const snapshot = await buildAdmitCardSnapshot(supabase, schoolId, oldCard.student_id, oldCard.examination_id, {
      admitCardNumber: oldCard.admit_card_number,
      version: nextVersion,
      fingerprint: newFingerprint,
      verificationToken: newVerificationToken,
    })

    const newCardData = {
      school_id: schoolId,
      academic_session_id: oldCard.academic_session_id,
      examination_id: oldCard.examination_id,
      student_id: oldCard.student_id,
      student_academic_history_id: oldCard.student_academic_history_id,
      admit_card_number: oldCard.admit_card_number,
      version: nextVersion,
      document_fingerprint: newFingerprint,
      verification_token: newVerificationToken,
      status: nextStatus,
      financial_clearance_status: financialStatus,
      financial_outstanding_amount: eligibility.totalOutstanding,
      financial_override: oldCard.financial_override,
      override_reason: oldCard.override_reason,
      candidate_eligibility_status: 'eligible',
      previous_admit_card_id: oldCard.id,
      replacement_reason: fullReason,
      data_snapshot: snapshot,
      updated_at: new Date().toISOString(),
    }

    const { data: newCard, error: insertErr } = await supabase
      .from('admit_cards')
      .insert(newCardData)
      .select()
      .single()

    if (insertErr) return { success: false, error: insertErr.message }

    // 4. Audit Log
    await writeAuditLog(supabase, schoolId, authState.user.profileId, 'REPLACE_ADMIT_CARD', 'admit_cards', newCard.id, oldCard, {
      oldCardId: oldCard.id,
      newCardId: newCard.id,
      newVersion: nextVersion,
      reason: fullReason,
      documentFingerprint: newFingerprint,
    })

    return { success: true, data: newCard }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to replace Admit Card' }
  }
}
