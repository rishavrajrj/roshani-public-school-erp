import { z } from 'zod'

export const createFeeHeadSchema = z.object({
  code: z.string().trim().min(2, 'Code must be at least 2 characters').toUpperCase(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  description: z.string().trim().optional(),
})

export const createFeeStructureItemSchema = z.object({
  feeHeadId: z.string().uuid('Valid Fee Head ID required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'half_yearly', 'annual']),
  dueDay: z.number().min(1).max(31).default(10),
  isMandatory: z.boolean().default(true),
})

export const createFeeStructureSchema = z.object({
  academicSessionId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(3, 'Structure name required'),
  description: z.string().trim().optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD required'),
  items: z.array(createFeeStructureItemSchema).min(1, 'At least 1 fee item required'),
})

export const assignFeeStructureSchema = z.object({
  academicSessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  feeStructureId: z.string().uuid(),
})

export const applyConcessionSchema = z.object({
  academicSessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  feeHeadId: z.string().uuid().optional().nullable(),
  concessionType: z.enum(['percentage', 'fixed_amount']),
  value: z.number().positive('Value must be positive'),
  reason: z.string().trim().min(3, 'A reason (at least 3 characters) is required'),
})

export const generateInvoiceSchema = z.object({
  academicSessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  previousBalanceAmount: z.number().min(0).default(0),
  items: z.array(
    z.object({
      feeHeadId: z.string().uuid(),
      description: z.string().trim().min(2),
      amount: z.number().min(0),
      discountAmount: z.number().min(0).default(0),
    })
  ).min(1, 'At least 1 invoice line item required'),
}).refine((data) => data.dueDate >= data.issueDate, {
  message: 'Due date must be on or after issue date',
  path: ['dueDate'],
})

// Fix #4: Added 'upi' and 'pos' payment methods
export const recordManualPaymentSchema = z.object({
  academicSessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'cheque', 'upi', 'pos']),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transactionReference: z.string().trim().optional(),
  chequeNumber: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  chequeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const createRazorpayOrderSchema = z.object({
  academicSessionId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive('Order amount must be greater than 0'),
})

export const verifyRazorpayPaymentSchema = z.object({
  academicSessionId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
})

export const requestRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().trim().min(3, 'A non-empty reason is required'),
})

export const processRefundSchema = z.object({
  refundId: z.string().uuid(),
  approved: z.boolean(),
  reason: z.string().trim().optional(),
})

export const createAdjustmentSchema = z.object({
  invoiceId: z.string().uuid(),
  adjustmentType: z.enum(['CREDIT', 'DEBIT']),
  amount: z.number().positive('Adjustment amount must be positive'),
  reason: z.string().trim().min(3, 'Reason required'),
})

export type CreateFeeHeadInput = z.infer<typeof createFeeHeadSchema>
export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>
export type AssignFeeStructureInput = z.infer<typeof assignFeeStructureSchema>
export type ApplyConcessionInput = z.infer<typeof applyConcessionSchema>
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>
export type RecordManualPaymentInput = z.infer<typeof recordManualPaymentSchema>
export type CreateRazorpayOrderInput = z.infer<typeof createRazorpayOrderSchema>
export type VerifyRazorpayPaymentInput = z.infer<typeof verifyRazorpayPaymentSchema>
export type RequestRefundInput = z.infer<typeof requestRefundSchema>
export type ProcessRefundInput = z.infer<typeof processRefundSchema>
export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>
