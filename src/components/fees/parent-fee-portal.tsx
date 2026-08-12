'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Invoice, Payment } from '@/types/fees'
import { createRazorpayOrderAction, verifyRazorpayPaymentAction } from '@/lib/fees/actions'

interface ParentFeePortalProps {
  studentName: string
  admissionNumber: string
  invoices: Invoice[]
  payments: Payment[]
}

export function ParentFeePortal({
  studentName,
  admissionNumber,
  invoices,
  payments,
}: ParentFeePortalProps) {
  const router = useRouter()
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.netAmount, 0)
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0)
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.outstandingAmount, 0)

  const handlePayOnline = async (inv: Invoice) => {
    setSelectedInvoice(inv)
    setIsProcessing(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    // 1. Create Razorpay order on server
    const orderRes = await createRazorpayOrderAction({
      academicSessionId: inv.academicSessionId,
      invoiceId: inv.id,
      amount: inv.outstandingAmount,
    })

    if (!orderRes.success || !orderRes.data) {
      setErrorMessage(orderRes.error || 'Failed to initiate Razorpay order')
      setIsProcessing(false)
      return
    }

    // 2. Simulate/Verify Razorpay Checkout Payment
    const verifyRes = await verifyRazorpayPaymentAction({
      academicSessionId: inv.academicSessionId,
      invoiceId: inv.id,
      razorpayOrderId: orderRes.data.orderId,
      razorpayPaymentId: 'pay_mock_online_12345',
      razorpaySignature: 'mock_signature_valid',
    })

    setIsProcessing(false)

    if (!verifyRes.success) {
      setErrorMessage(verifyRes.error || 'Payment verification failed')
    } else {
      setSuccessMessage(`Payment successful! Receipt #${verifyRes.receiptNumber || 'RCP-ONLINE'} generated.`)
      setSelectedInvoice(null)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fee Portal — {studentName}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Admission No: <span className="font-semibold text-slate-700">{admissionNumber}</span>
          </p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Billed</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalBilled.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase text-emerald-600">Total Paid</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase text-amber-600">Outstanding Balance</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Fee Invoices & Demands</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Net Amount</th>
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Outstanding</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No fee demands found for this student.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">₹{inv.netAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-semibold text-amber-700">₹{inv.outstandingAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'partially_paid'
                            ? 'bg-sky-100 text-sky-800'
                            : inv.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.outstandingAmount > 0 && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handlePayOnline(inv)}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                          {isProcessing && selectedInvoice?.id === inv.id ? 'Processing...' : 'Pay Online'}
                        </button>
                      )}
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
