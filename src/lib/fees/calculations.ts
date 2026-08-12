import type { FinancialClearanceStatus } from '@/types/fees'

export interface InvoiceItemCalculationInput {
  amount: number
  discountAmount?: number
}

export interface ConcessionInput {
  feeHeadId?: string | null
  concessionType: 'percentage' | 'fixed_amount'
  value: number
}

export interface InvoiceTotalsResult {
  grossAmount: number
  discountAmount: number
  concessionAmount: number
  lateFeeAmount: number
  previousBalanceAmount: number
  netAmount: number
  outstandingAmount: number
}

/**
 * Server-side authoritative invoice totals calculation.
 * Ensures numeric precision using 2 decimal places roundings.
 */
export function calculateInvoiceTotals(
  items: InvoiceItemCalculationInput[],
  concessions: ConcessionInput[] = [],
  lateFeeAmount = 0,
  previousBalanceAmount = 0,
  paidAmount = 0
): InvoiceTotalsResult {
  let grossAmount = 0
  let discountAmount = 0

  for (const item of items) {
    const amt = Math.max(0, Number(item.amount) || 0)
    const disc = Math.max(0, Number(item.discountAmount) || 0)
    grossAmount += amt
    discountAmount += Math.min(amt, disc)
  }

  // Calculate concession amount
  let concessionAmount = 0
  for (const c of concessions) {
    if (c.concessionType === 'percentage') {
      concessionAmount += (grossAmount * Math.min(100, Math.max(0, c.value))) / 100
    } else {
      concessionAmount += Math.max(0, c.value)
    }
  }

  // Cap concession at (gross - discount)
  concessionAmount = Math.min(grossAmount - discountAmount, concessionAmount)

  const lateFee = Math.max(0, Number(lateFeeAmount) || 0)
  const prevBal = Math.max(0, Number(previousBalanceAmount) || 0)

  // Net = Gross - Discount - Concession + LateFee + PreviousBalance
  const netAmount = Math.max(0, grossAmount - discountAmount - concessionAmount + lateFee + prevBal)
  const paid = Math.max(0, Number(paidAmount) || 0)
  const outstandingAmount = Math.max(0, netAmount - paid)

  return {
    grossAmount: Number(grossAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    concessionAmount: Number(concessionAmount.toFixed(2)),
    lateFeeAmount: Number(lateFee.toFixed(2)),
    previousBalanceAmount: Number(prevBal.toFixed(2)),
    netAmount: Number(netAmount.toFixed(2)),
    outstandingAmount: Number(outstandingAmount.toFixed(2)),
  }
}

/**
 * Server-side late fee calculation logic based on configurable policy.
 */
export function calculateLateFee(
  dueDateStr: string,
  currentDateStr: string,
  baseAmount: number,
  policy: { type: 'fixed' | 'percentage'; rate: number; gracePeriodDays?: number } = {
    type: 'fixed',
    rate: 100,
    gracePeriodDays: 0,
  }
): number {
  const dueDate = new Date(dueDateStr)
  const currentDate = new Date(currentDateStr)

  if (currentDate <= dueDate) {
    return 0
  }

  const diffTime = currentDate.getTime() - dueDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const graceDays = policy.gracePeriodDays || 0

  if (diffDays <= graceDays) {
    return 0
  }

  if (policy.type === 'percentage') {
    const fee = (baseAmount * policy.rate) / 100
    return Number(fee.toFixed(2))
  }

  return Number(policy.rate.toFixed(2))
}

/**
 * Determines Financial Clearance status for a student.
 */
export function determineClearanceStatus(
  totalBilled: number,
  totalPaid: number,
  totalOutstanding: number,
  isWaived = false,
  isOnHold = false
): FinancialClearanceStatus {
  if (isOnHold) {
    return 'ON_HOLD'
  }
  if (isWaived) {
    return 'WAIVED'
  }
  if (totalOutstanding <= 0 || totalPaid >= totalBilled) {
    return 'CLEAR'
  }
  if (totalPaid > 0 && totalOutstanding > 0) {
    return 'PARTIAL'
  }
  return 'OUTSTANDING'
}
