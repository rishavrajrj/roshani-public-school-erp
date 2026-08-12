'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  FeeHead,
  FeeStructure,
  Invoice,
  Payment,
  FinancialLedgerEntry,
  FeeDashboardSummary,
} from '@/types/fees'
import {
  createFeeHeadAction,
  createFeeStructureAction,
  generateInvoiceAction,
  recordManualPaymentAction,
  createAdjustmentAction,
} from '@/lib/fees/actions'

interface AdminFeeDashboardProps {
  summary: FeeDashboardSummary
  feeHeads: FeeHead[]
  feeStructures: FeeStructure[]
  invoices: Invoice[]
  payments: Payment[]
  ledger: FinancialLedgerEntry[]
}

export function AdminFeeDashboard({
  summary,
  feeHeads: initialFeeHeads,
  feeStructures,
  invoices,
  payments,
  ledger,
}: AdminFeeDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'structures' | 'invoices' | 'payments' | 'ledger'>('overview')
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>(initialFeeHeads)

  // Modals
  const [showFeeHeadModal, setShowFeeHeadModal] = useState(false)
  const [showStructureModal, setShowStructureModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Form states
  const [headCode, setHeadCode] = useState('')
  const [headName, setHeadName] = useState('')
  const [headDesc, setHeadDesc] = useState('')

  const [structName, setStructName] = useState('')
  const [structClassId, setStructClassId] = useState('11111111-1111-4111-8111-111111111111')
  const [structAmount, setStructAmount] = useState('2000')

  const [invStudentId, setInvStudentId] = useState('11111111-1111-4111-8111-111111111111')
  const [invAmount, setInvAmount] = useState('2000')
  const [invDueDate, setInvDueDate] = useState(new Date().toISOString().split('T')[0])

  const [payStudentId, setPayStudentId] = useState('11111111-1111-4111-8111-111111111111')
  const [payAmount, setPayAmount] = useState('1000')
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('cash')

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleCreateFeeHead = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const res = await createFeeHeadAction({
      code: headCode,
      name: headName,
      description: headDesc,
    })

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create fee head')
    } else {
      setSuccessMessage('Fee head created successfully!')
      setShowFeeHeadModal(false)
      setHeadCode('')
      setHeadName('')
      router.refresh()
    }
  }

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const res = await createFeeStructureAction({
      academicSessionId: '11111111-1111-4111-8111-111111111111',
      classId: structClassId,
      name: structName,
      effectiveFrom: new Date().toISOString().split('T')[0],
      items: [
        {
          feeHeadId: feeHeads[0]?.id || '11111111-1111-4111-8111-111111111111',
          amount: Number(structAmount),
          frequency: 'monthly',
          dueDay: 10,
          isMandatory: true,
        },
      ],
    })

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create fee structure')
    } else {
      setSuccessMessage('Fee structure created!')
      setShowStructureModal(false)
      setStructName('')
      router.refresh()
    }
  }

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const todayStr = new Date().toISOString().split('T')[0]
    const res = await generateInvoiceAction({
      academicSessionId: '11111111-1111-4111-8111-111111111111',
      studentId: invStudentId,
      issueDate: todayStr,
      dueDate: invDueDate,
      previousBalanceAmount: 0,
      items: [
        {
          feeHeadId: feeHeads[0]?.id || '11111111-1111-4111-8111-111111111111',
          description: 'Tuition Fee Demand',
          amount: Number(invAmount),
          discountAmount: 0,
        },
      ],
    })

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to generate invoice')
    } else {
      setSuccessMessage('Invoice generated successfully!')
      setShowInvoiceModal(false)
      router.refresh()
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const todayStr = new Date().toISOString().split('T')[0]
    const res = await recordManualPaymentAction({
      academicSessionId: '11111111-1111-4111-8111-111111111111',
      studentId: payStudentId,
      paymentMethod: payMethod,
      amount: Number(payAmount),
      paymentDate: todayStr,
    })

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to record payment')
    } else {
      setSuccessMessage('Payment recorded successfully!')
      setShowPaymentModal(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fee & Financial Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            School fee structures, demand invoices, payments, financial ledger, and Razorpay setup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFeeHeadModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            + Fee Head
          </button>
          <button
            type="button"
            onClick={() => setShowStructureModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            + Fee Structure
          </button>
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs"
          >
            + Issue Invoice
          </button>
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs"
          >
            + Record Payment
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Billed</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{summary.totalBilled.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400 mt-1">Demand raised this session</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase text-emerald-600">Total Collected</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">₹{summary.totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-xs text-emerald-600 mt-1">Verified receipts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase text-amber-600">Total Outstanding</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">₹{summary.totalOutstanding.toLocaleString('en-IN')}</p>
          <p className="text-xs text-amber-600 mt-1">Pending student balance</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase text-rose-600">Total Overdue</p>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">₹{summary.totalOverdue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-rose-600 mt-1">Past due date</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-2">
        {(['overview', 'structures', 'invoices', 'payments', 'ledger'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 capitalize transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Payment Method Breakdown</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-medium text-slate-700">Razorpay (Online)</span>
                <span className="font-bold text-slate-900">₹{summary.methodBreakdown.razorpay.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-medium text-slate-700">Cash</span>
                <span className="font-bold text-slate-900">₹{summary.methodBreakdown.cash.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-medium text-slate-700">Bank Transfer</span>
                <span className="font-bold text-slate-900">₹{summary.methodBreakdown.bank_transfer.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-slate-700">Cheque</span>
                <span className="font-bold text-slate-900">₹{summary.methodBreakdown.cheque.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Fee Heads</h3>
            <div className="divide-y divide-slate-100">
              {feeHeads.map((h) => (
                <div key={h.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900">{h.name}</span>
                    <span className="ml-2 text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{h.code}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Net Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {invoices.length === 0 ? (
                <tr><td colSpan={8} className="py-6 text-center text-slate-500">No invoices issued.</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium">{inv.studentName}</td>
                    <td className="py-3 px-4 font-mono text-xs">{inv.issueDate}</td>
                    <td className="py-3 px-4 font-mono text-xs">{inv.dueDate}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">₹{inv.netAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-amber-700 font-semibold">₹{inv.outstandingAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'partially_paid' ? 'bg-sky-100 text-sky-800' :
                        inv.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Fee Head */}
      {showFeeHeadModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add New Fee Head</h3>
            <form onSubmit={handleCreateFeeHead} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  value={headCode}
                  onChange={(e) => setHeadCode(e.target.value)}
                  placeholder="e.g. TUITION, LIB"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                  placeholder="e.g. Laboratory Fee"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={headDesc}
                  onChange={(e) => setHeadDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowFeeHeadModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg">Save Fee Head</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Invoice */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Issue Fee Demand Invoice</h3>
            <form onSubmit={handleGenerateInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={invDueDate}
                  onChange={(e) => setInvDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg">Issue Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Manual Payment */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Record Manual Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
