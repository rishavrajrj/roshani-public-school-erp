export type FeeFrequency = 'one_time' | 'monthly' | 'quarterly' | 'half_yearly' | 'annual'

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'adjusted'

export type PaymentMethod = 'razorpay' | 'cash' | 'bank_transfer' | 'cheque'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export type LedgerTransactionType =
  | 'CHARGE'
  | 'PAYMENT'
  | 'DISCOUNT'
  | 'CONCESSION'
  | 'ADJUSTMENT'
  | 'REFUND'
  | 'REVERSAL'
  | 'LATE_FEE'

export type RefundStatus = 'requested' | 'approved' | 'processed' | 'rejected' | 'cancelled'

export type FinancialClearanceStatus = 'CLEAR' | 'PARTIAL' | 'OUTSTANDING' | 'WAIVED' | 'ON_HOLD'

export interface FeeHead {
  id: string
  schoolId: string
  code: string
  name: string
  description?: string | null
  active: boolean
  createdAt: string
}

export interface FeeStructureItem {
  id: string
  schoolId: string
  feeStructureId: string
  feeHeadId: string
  feeHeadName?: string
  feeHeadCode?: string
  amount: number
  frequency: FeeFrequency
  dueDay?: number | null
  isMandatory: boolean
  createdAt: string
}

export interface FeeStructure {
  id: string
  schoolId: string
  academicSessionId: string
  classId: string
  className?: string
  sectionId?: string | null
  sectionName?: string | null
  name: string
  description?: string | null
  version: number
  isActive: boolean
  effectiveFrom: string
  effectiveTo?: string | null
  createdAt: string
  items: FeeStructureItem[]
}

export interface InvoiceItem {
  id: string
  schoolId: string
  invoiceId: string
  feeHeadId: string
  feeHeadName?: string
  description: string
  amount: number
  discountAmount: number
  netAmount: number
  createdAt: string
}

export interface Invoice {
  id: string
  schoolId: string
  academicSessionId: string
  studentId: string
  studentName?: string
  admissionNumber?: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  grossAmount: number
  discountAmount: number
  concessionAmount: number
  lateFeeAmount: number
  previousBalanceAmount: number
  netAmount: number
  paidAmount: number
  outstandingAmount: number
  status: InvoiceStatus
  createdAt: string
  items?: InvoiceItem[]
}

export interface PaymentAllocation {
  id: string
  schoolId: string
  paymentId: string
  invoiceId: string
  amount: number
  allocatedAt: string
}

export interface Payment {
  id: string
  schoolId: string
  academicSessionId: string
  studentId: string
  studentName?: string
  admissionNumber?: string
  paymentNumber: string
  paymentDate: string
  paymentMethod: PaymentMethod
  amount: number
  currency: string
  razorpayOrderId?: string | null
  razorpayPaymentId?: string | null
  transactionReference?: string | null
  chequeNumber?: string | null
  bankName?: string | null
  status: PaymentStatus
  receivedBy?: string | null
  verifiedBy?: string | null
  verifiedAt?: string | null
  createdAt: string
  allocations?: PaymentAllocation[]
}

export interface FinancialLedgerEntry {
  id: string
  schoolId: string
  academicSessionId: string
  studentId: string
  studentName?: string
  invoiceId?: string | null
  paymentId?: string | null
  transactionType: LedgerTransactionType
  amount: number
  runningBalance: number
  description: string
  actorProfileId?: string | null
  actorName?: string | null
  createdAt: string
}

export interface RefundRequest {
  id: string
  schoolId: string
  paymentId: string
  studentId: string
  studentName?: string
  refundNumber: string
  amount: number
  reason: string
  status: RefundStatus
  requestedBy: string
  approvedBy?: string | null
  processedAt?: string | null
  createdAt: string
}

export interface FinancialClearanceSummary {
  studentId: string
  studentName?: string
  academicSessionId: string
  status: FinancialClearanceStatus
  totalBilled: number
  totalPaid: number
  totalDiscounts: number
  totalLateFees: number
  totalOutstanding: number
  calculatedAt: string
}

export interface FeeDashboardSummary {
  totalBilled: number
  totalCollected: number
  totalOutstanding: number
  totalOverdue: number
  todayCollection: number
  monthlyCollection: number
  pendingVerificationCount: number
  methodBreakdown: {
    razorpay: number
    cash: number
    bank_transfer: number
    cheque: number
  }
}
