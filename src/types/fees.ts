export type FeeFrequency = 'one_time' | 'monthly' | 'quarterly' | 'half_yearly' | 'annual'

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'adjusted'

export type PaymentMethod = 'razorpay' | 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'pos'

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
  | 'OVERPAYMENT_CREDIT'
  | 'CHEQUE_BOUNCE'
  | 'CASH_MOVEMENT'

export type LedgerEntryType = 'DEBIT' | 'CREDIT'

export type RefundStatus = 'requested' | 'approved' | 'processed' | 'rejected' | 'cancelled'

export type ChequeStatus = 'pending' | 'cleared' | 'bounced' | 'failed' | 'refunded'

export type AccountType = 'ASSET' | 'LIABILITY' | 'REVENUE' | 'EXPENSE'

export type ReconciliationStatus = 'draft' | 'submitted' | 'reviewed' | 'locked'

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
  chequeDate?: string | null
  chequeStatus?: ChequeStatus | null
  status: PaymentStatus
  receivedBy?: string | null
  receivedByName?: string | null
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
  journalId?: string | null
  entryType?: LedgerEntryType | null
  accountName?: string | null
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
  processedBy?: string | null
  processedAt?: string | null
  createdAt: string
}

export interface StudentCredit {
  id: string
  schoolId: string
  academicSessionId: string
  studentId: string
  studentName?: string
  sourcePaymentId: string
  amount: number
  remainingAmount: number
  description: string
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
    upi: number
    pos: number
  }
}

// ============================================================
// Phase 5.1 Types
// ============================================================

export interface FinancialAccount {
  id: string
  schoolId: string
  code: string
  name: string
  accountType: AccountType
  isSystem: boolean
  active: boolean
  createdAt: string
}

export interface CollectionRegisterEntry {
  id: string
  paymentNumber: string
  paymentDate: string
  paymentMethod: PaymentMethod
  amount: number
  status: PaymentStatus
  transactionReference?: string | null
  chequeNumber?: string | null
  bankName?: string | null
  chequeDate?: string | null
  chequeStatus?: ChequeStatus | null
  receivedByName?: string | null
  receivedByRole?: string | null
  studentName: string
  admissionNumber: string
  className?: string | null
  sectionName?: string | null
  receiptNumber?: string | null
  invoiceNumber?: string | null
  createdAt: string
}

export interface DateRangeCollectionReport {
  totalCollection: number
  cash: number
  upi: number
  bankTransfer: number
  cheque: number
  pos: number
  razorpay: number
  refunds: number
  netCollection: number
}

export interface StaffCollectionEntry {
  staffId: string
  staffName: string
  staffRole: string
  cash: number
  upi: number
  bankTransfer: number
  cheque: number
  pos: number
  razorpay: number
  total: number
}

export interface PaymentModeReportEntry {
  method: string
  transactionCount: number
  grossCollection: number
  refunds: number
  netCollection: number
}

export interface DailyReconciliation {
  id: string
  schoolId: string
  reconciliationDate: string
  openingBalance: number
  cashReceived: number
  cashRefunded: number
  expectedCash: number
  physicalCash: number
  difference: number
  reason?: string | null
  preparedByName?: string | null
  reviewedByName?: string | null
  status: ReconciliationStatus
  createdAt: string
  reviewedAt?: string | null
}

export interface CashMovement {
  id: string
  schoolId: string
  movementDate: string
  sourceAccountCode: string
  destinationAccountCode: string
  amount: number
  reason: string
  reference?: string | null
  actorName?: string | null
  journalId?: string | null
  createdAt: string
}

export interface CreditAllocation {
  id: string
  schoolId: string
  studentCreditId: string
  invoiceId: string
  invoiceNumber?: string | null
  amount: number
  allocatedAt: string
}

export interface EnhancedDashboardSummary extends FeeDashboardSummary {
  todayCashCollection: number
  todayDigitalCollection: number
  chequePendingCount: number
  chequePendingAmount: number
  totalStudentCredits: number
  refundsThisMonth: number
  collectionByStaff: Array<{
    staffName: string
    total: number
  }>
}
