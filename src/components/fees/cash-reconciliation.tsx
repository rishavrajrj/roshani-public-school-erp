'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/utils/csv-export'
import { submitReconciliationAction, reviewReconciliationAction, lockReconciliationAction } from '@/lib/fees/collection-actions'

interface CashReconciliationProps {
  todayReconciliation: {
    id: string
    reconciliationDate: string
    openingBalance: number
    cashReceived: number
    cashRefunded: number
    expectedCash: number
    physicalCash: number
    difference: number
    reason?: string | null
    status: string
    preparedByName?: string | null
    reviewedByName?: string | null
  } | null
  reconciliationHistory: Array<{
    id: string
    reconciliationDate: string
    openingBalance: number
    expectedCash: number
    physicalCash: number
    difference: number
    status: string
    preparedByName?: string | null
  }>
  userRoles: string[]
}

export function CashReconciliation({
  todayReconciliation,
  reconciliationHistory,
  userRoles,
}: CashReconciliationProps) {
  const router = useRouter()
  const [physicalCashInput, setPhysicalCashInput] = useState(
    todayReconciliation?.physicalCash?.toString() || ''
  )
  const [reasonInput, setReasonInput] = useState(todayReconciliation?.reason || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isAdminOrAccountant = userRoles.some(r => ['Super Admin', 'Admin', 'Accountant'].includes(r))
  const isSuperAdminOrAdmin = userRoles.some(r => ['Super Admin', 'Admin'].includes(r))

  // Derived values for the form if it's draft or missing
  const openingBalance = todayReconciliation?.openingBalance || 0
  const cashReceived = todayReconciliation?.cashReceived || 0
  const cashRefunded = todayReconciliation?.cashRefunded || 0
  const expectedCash = openingBalance + cashReceived - cashRefunded

  const physicalCashValue = parseFloat(physicalCashInput) || 0
  const difference = physicalCashValue - expectedCash

  const status = todayReconciliation?.status || 'draft'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdminOrAccountant) return
    if (!todayReconciliation?.id) return

    setErrorMessage(null)
    setIsSubmitting(true)

    const res = await submitReconciliationAction({
      reconciliationDate: todayReconciliation.reconciliationDate || new Date().toISOString().split('T')[0],
      physicalCash: physicalCashValue,
      reason: reasonInput || undefined,
    })

    setIsSubmitting(false)
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to submit reconciliation')
    } else {
      router.refresh()
    }
  }

  const handleReview = async () => {
    if (!isSuperAdminOrAdmin || !todayReconciliation?.id) return
    
    setErrorMessage(null)
    setIsSubmitting(true)
    
    const res = await reviewReconciliationAction({
      reconciliationId: todayReconciliation.id,
    })
    
    setIsSubmitting(false)
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to review reconciliation')
    } else {
      router.refresh()
    }
  }

  const handleLock = async () => {
    if (!isSuperAdminOrAdmin || !todayReconciliation?.id) return
    
    setErrorMessage(null)
    setIsSubmitting(true)
    
    const res = await lockReconciliationAction({
      reconciliationId: todayReconciliation.id,
    })
    
    setIsSubmitting(false)
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to lock reconciliation')
    } else {
      router.refresh()
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'locked':
        return <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-emerald-100 text-emerald-800">Locked</span>
      case 'reviewed':
        return <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-blue-100 text-blue-800">Reviewed</span>
      case 'submitted':
        return <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-amber-100 text-amber-800">Submitted</span>
      default:
        return <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-slate-100 text-slate-800">Draft</span>
    }
  }

  const steps = ['draft', 'submitted', 'reviewed', 'locked']
  const currentStepIndex = steps.indexOf(status)

  const progressWidth = `${(Math.max(currentStepIndex, 0) / (steps.length - 1)) * 100}%`

  return (
    <div className="space-y-8">
      {/* Status Workflow */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-6">Today&apos;s Workflow Status</h3>
        <div className="relative flex items-center justify-between w-full">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0 rounded"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 z-0 rounded transition-all duration-500"
            style={{ width: progressWidth }}
          ></div>
          
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex
            const isCurrent = idx === currentStepIndex
            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div className={[
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-colors',
                  isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-400',
                  isCurrent ? 'ring-4 ring-blue-100' : '',
                ].join(' ')}>
                  {idx + 1}
                </div>
                <span className={[
                  'text-xs font-semibold uppercase',
                  isCompleted ? 'text-slate-900' : 'text-slate-400',
                ].join(' ')}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Today's Reconciliation Form */}
      <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <h2 className="text-lg font-bold text-slate-900 mb-6">Daily Cash Reconciliation</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-500">Opening Balance</label>
              <div className="text-2xl font-mono text-slate-700 bg-slate-100 px-4 py-3 rounded-lg">
                {formatINR(openingBalance)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-500">Cash Received (+)</label>
              <div className="text-2xl font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-lg">
                {formatINR(cashReceived)}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-500">Refunds (-)</label>
              <div className="text-2xl font-mono text-rose-700 bg-rose-50 border border-rose-100 px-4 py-3 rounded-lg">
                {formatINR(cashRefunded)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Expected System Cash</label>
              <div className="text-3xl font-extrabold text-slate-900">
                {formatINR(expectedCash)}
              </div>
              <p className="text-xs text-slate-500">Calculated automatically</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Actual Physical Cash</label>
              <input
                type="number"
                step="0.01"
                value={physicalCashInput}
                onChange={(e) => setPhysicalCashInput(e.target.value)}
                disabled={status !== 'draft'}
                className="w-full text-3xl font-extrabold text-blue-700 px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-700"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className={['p-4 rounded-xl border', difference === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'].join(' ')}>
            <div className="flex justify-between items-center">
              <div>
                <p className={['text-sm font-bold', difference === 0 ? 'text-emerald-800' : 'text-rose-800'].join(' ')}>
                  Variance (Difference)
                </p>
                <p className="text-xs mt-1 opacity-80">
                  Physical Cash - Expected Cash
                </p>
              </div>
              <div className={['text-2xl font-extrabold', difference === 0 ? 'text-emerald-700' : 'text-rose-700'].join(' ')}>
                {difference > 0 ? '+' : ''}{formatINR(difference)}
              </div>
            </div>

            {difference !== 0 && (
              <div className="mt-4 pt-4 border-t border-rose-200">
                <label className="block text-xs font-semibold uppercase text-rose-800 mb-2">
                  Reason for Discrepancy <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  disabled={status !== 'draft'}
                  className="w-full px-3 py-2 border border-rose-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-rose-100/50"
                  rows={2}
                  placeholder="Explain why the physical cash doesn't match the expected amount..."
                  required
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {status === 'draft' && isAdminOrAccountant && (
              <Button type="submit" isLoading={isSubmitting}>
                Submit Reconciliation
              </Button>
            )}
            
            {status === 'submitted' && isSuperAdminOrAdmin && (
              <Button type="button" variant="primary" onClick={handleReview} isLoading={isSubmitting}>
                Mark as Reviewed
              </Button>
            )}
            
            {status === 'reviewed' && isSuperAdminOrAdmin && (
              <Button type="button" variant="primary" onClick={handleLock} isLoading={isSubmitting}>
                Lock Reconciliation
              </Button>
            )}
            
            {status === 'locked' && (
              <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Reconciliation Locked
              </span>
            )}
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Reconciliation History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Opening</th>
                <th className="py-3 px-6">Expected</th>
                <th className="py-3 px-6">Physical</th>
                <th className="py-3 px-6">Variance</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reconciliationHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No reconciliation history found.
                  </td>
                </tr>
              ) : (
                reconciliationHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-medium text-slate-900">{record.reconciliationDate}</td>
                    <td className="py-3 px-6">{formatINR(record.openingBalance)}</td>
                    <td className="py-3 px-6">{formatINR(record.expectedCash)}</td>
                    <td className="py-3 px-6 font-semibold text-slate-900">{formatINR(record.physicalCash)}</td>
                    <td className={['py-3 px-6 font-bold', record.difference === 0 ? 'text-emerald-600' : 'text-rose-600'].join(' ')}>
                      {record.difference > 0 ? '+' : ''}{formatINR(record.difference)}
                    </td>
                    <td className="py-3 px-6">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
