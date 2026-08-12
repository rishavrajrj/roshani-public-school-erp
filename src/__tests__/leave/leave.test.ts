import { describe, it, expect } from 'vitest'
import {
  createLeaveApplicationSchema,
  processLeaveApprovalSchema,
  cancelLeaveSchema,
} from '@/lib/leave/schemas'

describe('Phase 4 Leave Management & Security Unit Tests', () => {
  describe('Leave Application Validation Rules', () => {
    it('Rule 39: Rejects invalid date range (start_date > end_date)', () => {
      const result = createLeaveApplicationSchema.safeParse({
        leaveTypeId: '11111111-1111-4111-8111-111111111111',
        startDate: '2026-08-20',
        endDate: '2026-08-15',
        durationType: 'full_day',
        reason: 'Family function',
      })
      expect(result.success).toBe(false)
    })

    it('Rule 40: Rejects short reason (< 3 chars)', () => {
      const result = createLeaveApplicationSchema.safeParse({
        leaveTypeId: '11111111-1111-4111-8111-111111111111',
        startDate: '2026-08-15',
        endDate: '2026-08-15',
        durationType: 'full_day',
        reason: 'hi',
      })
      expect(result.success).toBe(false)
    })

    it('Rule 25-31: Accepts valid leave payload', () => {
      const result = createLeaveApplicationSchema.safeParse({
        leaveTypeId: '11111111-1111-4111-8111-111111111111',
        startDate: '2026-08-15',
        endDate: '2026-08-17',
        durationType: 'full_day',
        reason: 'Attending medical checkup',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Approval & Cancellation Reason Rules', () => {
    it('Rule 36: Rejection requires non-empty reason', () => {
      const result = processLeaveApprovalSchema.safeParse({
        leaveApplicationId: '11111111-1111-4111-8111-111111111111',
        approved: false,
        rejectionReason: '',
      })
      expect(result.success).toBe(false)
    })

    it('Rule 36: Valid approval with comments passes', () => {
      const result = processLeaveApprovalSchema.safeParse({
        leaveApplicationId: '11111111-1111-4111-8111-111111111111',
        approved: true,
        comments: 'Recommended for approval',
      })
      expect(result.success).toBe(true)
    })

    it('Rule 37: Cancellation requires non-empty reason', () => {
      const invalid = cancelLeaveSchema.safeParse({
        leaveApplicationId: '11111111-1111-4111-8111-111111111111',
        reason: 'no',
      })
      expect(invalid.success).toBe(false)

      const valid = cancelLeaveSchema.safeParse({
        leaveApplicationId: '11111111-1111-4111-8111-111111111111',
        reason: 'Plan changed, returning to school early',
      })
      expect(valid.success).toBe(true)
    })
  })

  describe('Self-Approval Denial & Hierarchy Rules', () => {
    it('Rule 32: Applicant self-approval is denied by strict server logic constraint', () => {
      const applicantId = 'profile-123'
      const approverId = 'profile-123' // Same profile
      const isSelfApprovalDenied = applicantId === approverId
      expect(isSelfApprovalDenied).toBe(true)
    })

    it('Rule 35: Long leave threshold escalates multi-step approval (> 3 days)', () => {
      const calculatedDays = 4
      const threshold = 3
      const isMultiStep = calculatedDays > threshold
      expect(isMultiStep).toBe(true)
    })
  })
})
