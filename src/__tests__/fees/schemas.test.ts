import { describe, it, expect } from 'vitest'
import {
  createFeeHeadSchema,
  generateInvoiceSchema,
  recordManualPaymentSchema,
  requestRefundSchema,
} from '@/lib/fees/schemas'

describe('Phase 5 Fee & Financial Zod Schemas Unit Tests', () => {
  it('Validates fee head creation payload', () => {
    const valid = createFeeHeadSchema.safeParse({
      code: 'TUITION',
      name: 'Tuition Fee',
      description: 'Monthly tuition',
    })
    expect(valid.success).toBe(true)

    const invalid = createFeeHeadSchema.safeParse({
      code: 'A',
      name: '',
    })
    expect(invalid.success).toBe(false)
  })

  it('Validates invoice generation payload and date rules', () => {
    const valid = generateInvoiceSchema.safeParse({
      academicSessionId: '11111111-1111-4111-8111-111111111111',
      studentId: '11111111-1111-4111-8111-111111111111',
      issueDate: '2026-08-01',
      dueDate: '2026-08-15',
      items: [
        {
          feeHeadId: '11111111-1111-4111-8111-111111111111',
          description: 'Tuition',
          amount: 2000,
        },
      ],
    })
    expect(valid.success).toBe(true)

    const invalidDates = generateInvoiceSchema.safeParse({
      academicSessionId: '11111111-1111-4111-8111-111111111111',
      studentId: '11111111-1111-4111-8111-111111111111',
      issueDate: '2026-08-20',
      dueDate: '2026-08-10',
      items: [
        {
          feeHeadId: '11111111-1111-4111-8111-111111111111',
          description: 'Tuition',
          amount: 2000,
        },
      ],
    })
    expect(invalidDates.success).toBe(false)
  })

  it('Validates manual payment recording payload', () => {
    const valid = recordManualPaymentSchema.safeParse({
      academicSessionId: '11111111-1111-4111-8111-111111111111',
      studentId: '11111111-1111-4111-8111-111111111111',
      paymentMethod: 'cash',
      amount: 1500,
      paymentDate: '2026-08-12',
    })
    expect(valid.success).toBe(true)

    const invalidAmount = recordManualPaymentSchema.safeParse({
      academicSessionId: '11111111-1111-4111-8111-111111111111',
      studentId: '11111111-1111-4111-8111-111111111111',
      paymentMethod: 'cash',
      amount: -500,
      paymentDate: '2026-08-12',
    })
    expect(invalidAmount.success).toBe(false)
  })

  it('Validates refund request payload', () => {
    const valid = requestRefundSchema.safeParse({
      paymentId: '11111111-1111-4111-8111-111111111111',
      amount: 500,
      reason: 'Duplicate payment mistake',
    })
    expect(valid.success).toBe(true)
  })
})
