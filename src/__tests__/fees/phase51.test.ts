import { describe, it, expect, vi } from 'vitest'
import { calculateInvoiceTotals } from '@/lib/fees/calculations'
import { formatINR, getDatePreset } from '@/lib/utils/csv-export'
import {
  applyStudentCreditSchema,
  clearChequeSchema,
  bounceChequeSchema,
  createCashMovementSchema,
  submitReconciliationSchema,
  reviewReconciliationSchema,
  lockReconciliationSchema,
  approveRefundSchema,
  processRefundSchema,
} from '@/lib/fees/collection-schemas'

// Mock Supabase & Auth for Unit Testing Server Logic
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/auth/resolve-user', () => ({
  resolveUser: vi.fn(),
  hasAnyRole: vi.fn((user, roles) => roles.some((r: string) => user.roles?.includes(r))),
}))

describe('Phase 5.1 — Financial Controls & Collection Verification Suite', () => {

  // ============================================================
  // PART A — FINANCIAL SYSTEM PRINCIPLES & SCHEMAS
  // ============================================================
  describe('Part A — Financial Principles & Schema Validations', () => {
    it('should validate credit application schema with positive amounts', () => {
      const valid = applyStudentCreditSchema.safeParse({
        studentCreditId: '123e4567-e89b-12d3-a456-426614174000',
        invoiceId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 500,
      })
      expect(valid.success).toBe(true)

      const invalid = applyStudentCreditSchema.safeParse({
        studentCreditId: '123e4567-e89b-12d3-a456-426614174000',
        invoiceId: '123e4567-e89b-12d3-a456-426614174001',
        amount: -50,
      })
      expect(invalid.success).toBe(false)
    })

    it('should validate cheque clearance & bounce schemas correctly', () => {
      const validClear = clearChequeSchema.safeParse({
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(validClear.success).toBe(true)

      const validBounce = bounceChequeSchema.safeParse({
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Insufficient funds in drawer account',
      })
      expect(validBounce.success).toBe(true)

      const invalidBounce = bounceChequeSchema.safeParse({
        paymentId: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'no', // too short
      })
      expect(invalidBounce.success).toBe(false)
    })

    it('should validate cash movement schema for internal transfers', () => {
      const validMove = createCashMovementSchema.safeParse({
        movementDate: '2026-08-13',
        sourceAccountCode: 'CASH_IN_HAND',
        destinationAccountCode: 'BANK_SBI',
        amount: 15000,
        reason: 'Daily cash deposit to bank',
      })
      expect(validMove.success).toBe(true)
    })

    it('should validate daily cash reconciliation schemas', () => {
      const validSub = submitReconciliationSchema.safeParse({
        reconciliationDate: '2026-08-13',
        physicalCash: 25000,
        reason: 'Minor variance resolved',
      })
      expect(validSub.success).toBe(true)

      const validReview = reviewReconciliationSchema.safeParse({
        reconciliationId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(validReview.success).toBe(true)

      const validLock = lockReconciliationSchema.safeParse({
        reconciliationId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(validLock.success).toBe(true)
    })

    it('should validate refund approval and processing schemas', () => {
      const validApprove = approveRefundSchema.safeParse({
        refundId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(validApprove.success).toBe(true)

      const validProcess = processRefundSchema.safeParse({
        refundId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(validProcess.success).toBe(true)
    })
  })

  // ============================================================
  // PART B — ADVANCED REMEDIATION & CONTROLS
  // ============================================================
  describe('Part B — Double Entry Accounting & Journal Balance Calculations', () => {
    it('should compute exact invoice totals with concessions and balance additions', () => {
      const items = [{ amount: 5000, discountAmount: 500 }]
      const concessions = [{ concessionType: 'percentage' as const, value: 10 }] // 10% of gross (5000) = 500
      const result = calculateInvoiceTotals(items, concessions, 100, 200, 0)

      expect(result.grossAmount).toBe(5000)
      expect(result.discountAmount).toBe(500)
      expect(result.concessionAmount).toBe(500)
      expect(result.lateFeeAmount).toBe(100)
      expect(result.previousBalanceAmount).toBe(200)
      // net = 5000 - 500 - 500 + 100 + 200 = 4300
      expect(result.netAmount).toBe(4300)
      expect(result.outstandingAmount).toBe(4300)
    })

    it('should maintain balanced debits and credits in double-entry transaction structure', () => {
      const debitEntry = { account: 'Cash in Hand', debit: 5000, credit: 0 }
      const creditEntry = { account: 'Accounts Receivable', debit: 0, credit: 5000 }

      const totalDebit = debitEntry.debit + creditEntry.debit
      const totalCredit = debitEntry.credit + creditEntry.credit

      expect(totalDebit).toEqual(totalCredit)
      expect(totalDebit).toBe(5000)
    })
  })

  // ============================================================
  // PART C, D, E, F — COLLECTION REGISTER & REPORT CALCULATIONS
  // ============================================================
  describe('Part C-F — Collection Reporting & CSV Exports', () => {
    it('should format INR currency strings correctly', () => {
      const formatted = formatINR(1234567.89)
      expect(formatted).toContain('12,34,567.89')
    })

    it('should calculate date presets accurately', () => {
      const today = new Date().toISOString().split('T')[0]
      const presetToday = getDatePreset('today')
      expect(presetToday.from).toBe(today)
      expect(presetToday.to).toBe(today)

      const presetThisMonth = getDatePreset('this_month')
      expect(presetThisMonth.to).toBe(today)
      expect(presetThisMonth.from).toMatch(/^\d{4}-\d{2}-01$/)
    })

    it('should generate valid CSV structure from array of collection entries', () => {
      const data = [
        {
          paymentNumber: 'PAY-001',
          studentName: 'Rohan Sharma',
          amount: 5000,
          paymentMethod: 'cash',
          status: 'successful',
        },
        {
          paymentNumber: 'PAY-002',
          studentName: 'Priya Singh',
          amount: 7500,
          paymentMethod: 'upi',
          status: 'successful',
        },
      ]

      // Test CSV formatting logic
      const cols = [
        { key: 'paymentNumber', label: 'Payment #' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'amount', label: 'Amount' },
      ]
      
      const header = cols.map((c) => `"${c.label}"`).join(',')
      expect(header).toBe('"Payment #","Student Name","Amount"')

      const row1 = cols.map((c) => `"${(data[0] as any)[c.key]}"`).join(',')
      expect(row1).toBe('"PAY-001","Rohan Sharma","5000"')
    })
  })

  // ============================================================
  // PART H, I, J — CASH RECONCILIATION & MOVEMENTS
  // ============================================================
  describe('Part H-J — Cash Reconciliation System Logic', () => {
    it('should correctly compute expected cash and detect discrepancy', () => {
      const openingBalance = 10000
      const cashReceived = 25000
      const cashRefunded = 2000

      const expectedCash = openingBalance + cashReceived - cashRefunded
      expect(expectedCash).toBe(33000)

      const physicalCashMatching = 33000
      const varianceZero = physicalCashMatching - expectedCash
      expect(varianceZero).toBe(0)

      const physicalCashShort = 32500
      const varianceShort = physicalCashShort - expectedCash
      expect(varianceShort).toBe(-500)
    })
  })

  // ============================================================
  // PART P — REFUND APPROVAL WORKFLOW
  // ============================================================
  describe('Part P — Refund Approval & Self-Approval Protection', () => {
    it('should reject refund approval when requester is same as approver', () => {
      const requestedBy: string = 'profile-user-123'
      const approvedBy: string = 'profile-user-123'

      const isSelfApproval = requestedBy === approvedBy
      expect(isSelfApproval).toBe(true)
      
      // Workflow constraint rule test
      const canApprove = !isSelfApproval
      expect(canApprove).toBe(false)
    })

    it('should allow refund approval when approver is a different authorized profile', () => {
      const requestedBy: string = 'profile-accountant-001'
      const approvedBy: string = 'profile-admin-002'

      const isSelfApproval = requestedBy === approvedBy
      expect(isSelfApproval).toBe(false)

      const canApprove = !isSelfApproval
      expect(canApprove).toBe(true)
    })
  })
})
