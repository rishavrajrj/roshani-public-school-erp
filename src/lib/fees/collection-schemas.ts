import { z } from 'zod'

export const applyStudentCreditSchema = z.object({
  studentCreditId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive('Credit amount to apply must be positive'),
})

export const clearChequeSchema = z.object({
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
})

export const bounceChequeSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().trim().min(3, 'Reason required for bounced cheque'),
})

export const createCashMovementSchema = z.object({
  movementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD required'),
  sourceAccountCode: z.string().min(1),
  destinationAccountCode: z.string().min(1),
  amount: z.number().positive('Movement amount must be positive'),
  reason: z.string().trim().min(3, 'Reason required'),
  reference: z.string().trim().optional(),
})

export const submitReconciliationSchema = z.object({
  reconciliationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD required'),
  physicalCash: z.number().min(0, 'Physical cash cannot be negative'),
  openingBalance: z.number().min(0).optional(),
  reason: z.string().trim().optional(),
})

export const reviewReconciliationSchema = z.object({
  reconciliationId: z.string().uuid(),
})

export const lockReconciliationSchema = z.object({
  reconciliationId: z.string().uuid(),
})

export const initializeOpeningBalanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD required'),
  amount: z.number().min(0),
  reason: z.string().trim().min(3, 'Reason required'),
})

export const approveRefundSchema = z.object({
  refundId: z.string().uuid(),
})

export const processRefundSchema = z.object({
  refundId: z.string().uuid(),
})

export type ApplyStudentCreditInput = z.infer<typeof applyStudentCreditSchema>
export type ClearChequeInput = z.infer<typeof clearChequeSchema>
export type BounceChequeInput = z.infer<typeof bounceChequeSchema>
export type CreateCashMovementInput = z.infer<typeof createCashMovementSchema>
export type SubmitReconciliationInput = z.infer<typeof submitReconciliationSchema>
export type ReviewReconciliationInput = z.infer<typeof reviewReconciliationSchema>
export type LockReconciliationInput = z.infer<typeof lockReconciliationSchema>
export type InitializeOpeningBalanceInput = z.infer<typeof initializeOpeningBalanceSchema>
export type ApproveRefundInput = z.infer<typeof approveRefundSchema>
export type ProcessRefundInput = z.infer<typeof processRefundSchema>
