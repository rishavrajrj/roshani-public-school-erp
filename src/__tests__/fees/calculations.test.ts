import { describe, it, expect } from 'vitest'
import {
  calculateInvoiceTotals,
  calculateLateFee,
  determineClearanceStatus,
} from '@/lib/fees/calculations'

describe('Phase 5 Financial Calculation Engine Unit Tests', () => {
  describe('Invoice Totals & Precision', () => {
    it('Calculates gross, discount, concession, late fee, net, and outstanding authoritatively', () => {
      const items = [
        { amount: 2000, discountAmount: 200 },
        { amount: 500, discountAmount: 0 },
      ]
      const concessions = [{ concessionType: 'percentage' as const, value: 10 }]

      const totals = calculateInvoiceTotals(items, concessions, 100, 400, 500)

      expect(totals.grossAmount).toBe(2500)
      expect(totals.discountAmount).toBe(200)
      // Concession 10% of 2500 = 250
      expect(totals.concessionAmount).toBe(250)
      expect(totals.lateFeeAmount).toBe(100)
      expect(totals.previousBalanceAmount).toBe(400)
      // Net = 2500 - 200 - 250 + 100 + 400 = 2550
      expect(totals.netAmount).toBe(2550)
      // Outstanding = 2550 - 500 = 2050
      expect(totals.outstandingAmount).toBe(2050)
    })

    it('Caps discounts and concessions so net amount never goes below 0', () => {
      const items = [{ amount: 1000, discountAmount: 1500 }]
      const totals = calculateInvoiceTotals(items, [], 0, 0, 0)
      expect(totals.discountAmount).toBe(1000)
      expect(totals.netAmount).toBe(0)
    })
  })

  describe('Late Fee Policy Engine', () => {
    it('Returns 0 when current date is on or before due date', () => {
      const fee = calculateLateFee('2026-08-20', '2026-08-15', 2000)
      expect(fee).toBe(0)
    })

    it('Calculates fixed late fee past due date', () => {
      const fee = calculateLateFee('2026-08-10', '2026-08-15', 2000, {
        type: 'fixed',
        rate: 100,
      })
      expect(fee).toBe(100)
    })

    it('Calculates percentage late fee past due date', () => {
      const fee = calculateLateFee('2026-08-10', '2026-08-15', 2000, {
        type: 'percentage',
        rate: 5,
      })
      expect(fee).toBe(100)
    })
  })

  describe('Financial Clearance Status Rules', () => {
    it('Returns CLEAR when total outstanding is 0', () => {
      const status = determineClearanceStatus(2000, 2000, 0)
      expect(status).toBe('CLEAR')
    })

    it('Returns PARTIAL when partial payment made and outstanding remains', () => {
      const status = determineClearanceStatus(2000, 1000, 1000)
      expect(status).toBe('PARTIAL')
    })

    it('Returns OUTSTANDING when no payment made and outstanding > 0', () => {
      const status = determineClearanceStatus(2000, 0, 2000)
      expect(status).toBe('OUTSTANDING')
    })

    it('Returns ON_HOLD when manually flagged on hold', () => {
      const status = determineClearanceStatus(2000, 2000, 0, false, true)
      expect(status).toBe('ON_HOLD')
    })
  })
})
