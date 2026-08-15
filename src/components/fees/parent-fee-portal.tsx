'use client'

import { useState, useEffect } from 'react'
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
  invoices: initialInvoices,
}: ParentFeePortalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi')
  const [upiId, setUpiId] = useState('parent@upi')
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892')
  const [cardExpiry, setCardExpiry] = useState('08/28')
  const [cardCvv, setCardCvv] = useState('888')
  const [selectedBank, setSelectedBank] = useState('SBI')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [receiptModal, setReceiptModal] = useState<{
    receiptNumber: string
    invoiceNumber: string
    amount: number
    paymentMethod: string
    date: string
  } | null>(null)

  // Sync paid test invoices across refreshes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('paid_invoice_ids')
      if (saved) {
        const paidIds: string[] = JSON.parse(saved)
        setInvoices((prev) =>
          prev.map((inv) =>
            paidIds.includes(inv.id)
              ? { ...inv, paidAmount: inv.netAmount, outstandingAmount: 0, status: 'paid' }
              : inv
          )
        )
      }
    } catch {}
  }, [])

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.netAmount, 0)
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0)
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.outstandingAmount, 0)

  const openCheckout = (inv: Invoice) => {
    setActiveInvoice(inv)
    setErrorMessage(null)
  }

  const handleConfirmPayment = async () => {
    if (!activeInvoice) return

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // 1. Create Razorpay order on server
      const orderRes = await createRazorpayOrderAction({
        academicSessionId: activeInvoice.academicSessionId,
        invoiceId: activeInvoice.id,
        amount: activeInvoice.outstandingAmount,
      })

      if (!orderRes.success || !orderRes.data) {
        setErrorMessage(orderRes.error || 'Failed to initiate payment order')
        setIsProcessing(false)
        return
      }

      // 2. Verify Razorpay Payment
      const verifyRes = await verifyRazorpayPaymentAction({
        academicSessionId: activeInvoice.academicSessionId,
        invoiceId: activeInvoice.id,
        razorpayOrderId: orderRes.data.orderId,
        razorpayPaymentId: `pay_online_${Date.now()}`,
        razorpaySignature: 'mock_signature_valid',
      })

      setIsProcessing(false)

      if (!verifyRes.success) {
        setErrorMessage(verifyRes.error || 'Payment verification failed')
      } else {
        const receiptNo = verifyRes.receiptNumber || `RCP-ONLINE-${Math.floor(100000 + Math.random() * 900000)}`
        
        // Persist paid invoice ID in localStorage
        try {
          const saved = localStorage.getItem('paid_invoice_ids')
          const paidIds: string[] = saved ? JSON.parse(saved) : []
          if (!paidIds.includes(activeInvoice.id)) {
            paidIds.push(activeInvoice.id)
            localStorage.setItem('paid_invoice_ids', JSON.stringify(paidIds))
          }
        } catch {}

        // Update local invoice state immediately
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === activeInvoice.id
              ? {
                  ...inv,
                  paidAmount: inv.netAmount,
                  outstandingAmount: 0,
                  status: 'paid',
                }
              : inv
          )
        )

        setReceiptModal({
          receiptNumber: receiptNo,
          invoiceNumber: activeInvoice.invoiceNumber,
          amount: activeInvoice.outstandingAmount,
          paymentMethod: paymentMethod.toUpperCase(),
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        })

        setSuccessMessage(`Payment of ₹${activeInvoice.outstandingAmount.toLocaleString('en-IN')} completed successfully for Invoice ${activeInvoice.invoiceNumber}!`)
        setActiveInvoice(null)
      }
    } catch (err: any) {
      setIsProcessing(false)
      setErrorMessage(err.message || 'An unexpected error occurred during payment processing.')
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
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 font-bold ml-4">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-4">✕</button>
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
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">₹{inv.netAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-semibold text-amber-700">₹{inv.outstandingAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : inv.status === 'partially_paid'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : inv.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.outstandingAmount > 0 ? (
                        <button
                          type="button"
                          onClick={() => openCheckout(inv)}
                          className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Pay Online
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 flex items-center justify-end gap-1">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Razorpay Interactive Checkout Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Gateway Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-500 text-white font-bold rounded">Razorpay</span>
                  <span className="text-xs text-slate-400">Secure 256-Bit SSL Payment</span>
                </div>
                <h3 className="text-lg font-bold mt-1">Roshani Public School ERP</h3>
              </div>
              <button
                onClick={() => setActiveInvoice(null)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Payment Summary */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Invoice #{activeInvoice.invoiceNumber}</p>
                <p className="text-sm font-semibold text-slate-800">{studentName} ({admissionNumber})</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-semibold">Amount to Pay</p>
                <p className="text-xl font-black text-blue-700">₹{activeInvoice.outstandingAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Modal Body: Payment Methods */}
            <div className="p-6 space-y-5">
              {/* Method Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-lg border text-center transition ${
                      paymentMethod === 'upi'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📱 UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-lg border text-center transition ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-lg border text-center transition ${
                      paymentMethod === 'netbanking'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏦 Net Banking
                  </button>
                </div>
              </div>

              {/* Method Form Details */}
              {paymentMethod === 'upi' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Enter VPA / UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@upi"
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500 mb-2 font-medium">Or scan test QR with any UPI app</p>
                    <div className="inline-block p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                      <div className="w-28 h-28 bg-slate-900 text-white flex items-center justify-center text-xs font-mono rounded text-center p-2">
                        [ RAZORPAY TEST QR CODE ]
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="PNB">Punjab National Bank</option>
                  </select>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveInvoice(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPayment}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>Pay ₹{activeInvoice.outstandingAmount.toLocaleString('en-IN')} Now →</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Success Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 text-white p-6 text-center">
              <div className="w-12 h-12 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-black">Payment Successful!</h3>
              <p className="text-emerald-100 text-xs mt-1">Transaction verified & receipt generated</p>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Receipt Number</span>
                  <span className="font-mono font-bold text-slate-900">{receiptModal.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Invoice Number</span>
                  <span className="font-mono font-bold text-slate-900">{receiptModal.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Student Name</span>
                  <span className="font-semibold text-slate-900">{studentName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Payment Date</span>
                  <span className="font-semibold text-slate-900">{receiptModal.date}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Payment Method</span>
                  <span className="font-semibold text-slate-900">{receiptModal.paymentMethod}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-base font-bold text-slate-900">
                  <span>Amount Paid</span>
                  <span className="text-emerald-700">₹{receiptModal.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

