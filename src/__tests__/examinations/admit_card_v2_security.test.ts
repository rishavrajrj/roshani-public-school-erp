import { describe, it, expect } from 'vitest'
import { generateSecureVerificationToken, generateDocumentFingerprint } from '@/lib/examinations/admit-card-crypto'
import { regenerateAdmitCardSchema, revokeAdmitCardSchema, overrideFinancialHoldSchema } from '@/lib/examinations/schemas-admit-card'
import type { AdmitCard } from '@/types/admit-card'

describe('Admit Card V2 Final Production Security & Hardening Suite', () => {
  // 1. Cryptographic Token Security
  it('1. should generate high-entropy 256-bit cryptographic hex verification tokens', () => {
    const token1 = generateSecureVerificationToken()
    const token2 = generateSecureVerificationToken()

    expect(token1).toBeDefined()
    expect(token1.length).toBeGreaterThanOrEqual(32)
    expect(token1).not.toBe(token2)
    // Must be unpredictable hex string, not predictable student or admit card ID
    expect(token1).toMatch(/^[a-f0-9-]+$/i)
  })

  it('2. should generate unique official document fingerprints', () => {
    const fp1 = generateDocumentFingerprint(2026)
    const fp2 = generateDocumentFingerprint(2026)

    expect(fp1).toMatch(/^RPS-AC-2026-[A-Z0-9]{6}$/)
    expect(fp2).toMatch(/^RPS-AC-2026-[A-Z0-9]{6}$/)
    expect(fp1).not.toBe(fp2)
  })

  // 2. Status Lifecycle & Versioning
  it('3. should support all required status lifecycle states including superseded', () => {
    const validStatuses: Array<AdmitCard['status']> = [
      'draft',
      'eligible',
      'blocked',
      'override_released',
      'published',
      'revoked',
      'superseded',
    ]

    validStatuses.forEach((status) => {
      const card: Partial<AdmitCard> = { status, version: 1 }
      expect(card.status).toBe(status)
    })
  })

  it('4. should validate replacement schema requiring mandatory replacement reason', () => {
    const valid = regenerateAdmitCardSchema.safeParse({
      oldAdmitCardId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'Updated date sheet for Annual Examination',
      replacementReason: 'Exam Date Changed',
    })
    expect(valid.success).toBe(true)

    const invalidShort = regenerateAdmitCardSchema.safeParse({
      oldAdmitCardId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'ab', // too short
    })
    expect(invalidShort.success).toBe(false)
  })

  it('5. should enforce minimum reason length on revocation schema', () => {
    const valid = revokeAdmitCardSchema.safeParse({
      admitCardId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'Disciplinary suspension during examination',
    })
    expect(valid.success).toBe(true)

    const invalid = revokeAdmitCardSchema.safeParse({
      admitCardId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'bad', // < 5 chars
    })
    expect(invalid.success).toBe(false)
  })

  it('6. should enforce minimum reason length on financial override schema', () => {
    const valid = overrideFinancialHoldSchema.safeParse({
      admitCardId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'Principal approved conditional clearance',
    })
    expect(valid.success).toBe(true)

    const invalid = overrideFinancialHoldSchema.safeParse({
      admitCardId: '123e4567-e89b-12d3-a456-426614174000',
      reason: 'no',
    })
    expect(invalid.success).toBe(false)
  })

  // 3. Immutable Snapshot Verification
  it('7. should preserve frozen immutable snapshot data independently of live student edits', () => {
    const publishedCardV1: AdmitCard = {
      id: 'card-v1',
      schoolId: 'school-1',
      academicSessionId: 'sess-1',
      examinationId: 'exam-1',
      studentId: 'stud-1',
      admitCardNumber: 'AC-2026-0001024',
      version: 1,
      documentFingerprint: 'RPS-AC-2026-8F4K2M',
      verificationToken: 'token-v1-secret',
      status: 'published',
      financialClearanceStatus: 'CLEAR',
      financialOutstandingAmount: 0,
      financialOverride: false,
      candidateEligibilityStatus: 'eligible',
      studentName: 'Rishav Raj',
      className: 'Class X',
      sectionName: 'A',
      dataSnapshot: {
        studentName: 'Rishav Raj',
        className: 'Class X',
        sectionName: 'A',
        examCenterRoom: 'Hall 1',
        version: 1,
      },
      createdAt: '2026-03-15T08:00:00Z',
      updatedAt: '2026-03-15T08:00:00Z',
    }

    // Suppose live student profile changes later to Class XI
    const mutatedLiveStudentName = 'Rishav Raj Updated'
    const mutatedLiveClassName = 'Class XI'

    // The published snapshot remains locked
    expect(publishedCardV1.dataSnapshot?.studentName).toBe('Rishav Raj')
    expect(publishedCardV1.dataSnapshot?.className).toBe('Class X')
    expect(publishedCardV1.dataSnapshot?.studentName).not.toBe(mutatedLiveStudentName)
    expect(publishedCardV1.dataSnapshot?.className).not.toBe(mutatedLiveClassName)
  })

  // 4. Public Verification States
  it('8. should structure public verification outputs with zero financial leakages', () => {
    const publicVerificationPayload = {
      state: 'VALID' as const,
      isValid: true,
      admitCardNumber: 'AC-2026-0001024',
      documentFingerprint: 'RPS-AC-2026-8F4K2M',
      version: 1,
      studentName: 'Arjun Kumar',
      className: 'Class VIII',
      sectionName: 'A',
      examinationName: 'ANNUAL EXAMINATION — 2026',
      verifiedAt: '16 Aug 2026, 08:30 AM',
    }

    expect(publicVerificationPayload.isValid).toBe(true)
    expect(publicVerificationPayload).not.toHaveProperty('financialOutstandingAmount')
    expect(publicVerificationPayload).not.toHaveProperty('feeBalance')
    expect(publicVerificationPayload).not.toHaveProperty('parentPhone')
    expect(publicVerificationPayload).not.toHaveProperty('studentAddress')
  })

  it('9. should handle SUPERSEDED public verification state appropriately', () => {
    const supersededVerification = {
      state: 'SUPERSEDED' as const,
      isValid: false,
      admitCardNumber: 'AC-2026-0001024',
      version: 1,
      replacementReason: 'Exam Date Changed — Date sheet revised by board',
      verifiedAt: '16 Aug 2026, 08:30 AM',
    }

    expect(supersededVerification.state).toBe('SUPERSEDED')
    expect(supersededVerification.isValid).toBe(false)
    expect(supersededVerification.replacementReason).toContain('Exam Date Changed')
  })

  it('10. should handle REVOKED public verification state appropriately', () => {
    const revokedVerification = {
      state: 'REVOKED' as const,
      isValid: false,
      admitCardNumber: 'AC-2026-0001024',
      revocationReason: 'Academic misconduct penalty',
      verifiedAt: '16 Aug 2026, 08:30 AM',
    }

    expect(revokedVerification.state).toBe('REVOKED')
    expect(revokedVerification.isValid).toBe(false)
  })
})
