'use client'

import { useState, useMemo } from 'react'
import { formatINR, exportToCSV, getDatePreset } from '@/lib/utils/csv-export'

interface CollectionRegisterProps {
  payments: any[]
  staffList: Array<{ id: string; name: string }>
}

export function CollectionRegister({ payments, staffList }: CollectionRegisterProps) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('all')
  const [staffId, setStaffId] = useState('all')

  const applyPreset = (preset: string) => {
    const { from, to } = getDatePreset(preset)
    setFromDate(from)
    setToDate(to)
  }

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (fromDate && p.paymentDate < fromDate) return false
      if (toDate && p.paymentDate > toDate) return false
      if (paymentMethod !== 'all' && p.paymentMethod !== paymentMethod) return false
      if (staffId !== 'all' && p.collectedBy !== staffId) return false
      return true
    })
  }, [payments, fromDate, toDate, paymentMethod, staffId])

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  const handleExportCSV = () => {
    const data = filteredPayments.map((p, index) => ({
      '#': index + 1,
      'Receipt No': p.receiptNumber || '-',
      'Student': p.studentName || '-',
      'Adm. No.': p.admissionNumber || '-',
      'Class/Section': p.classSection || '-',
      'Amount': p.amount || 0,
      'Payment Mode': p.paymentMethod || '-',
      'Status': p.status || '-',
      'Reference': p.referenceId || '-',
      'Received By': p.collectedByName || '-',
      'Date': p.paymentDate || '-',
    }))
    exportToCSV(data, 'collection_register')
  }

  const handlePrint = () => {
    window.print()
  }

  const methodColors: Record<string, string> = {
    cash: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    upi: 'bg-violet-100 text-violet-800 border-violet-200',
    bank_transfer: 'bg-blue-100 text-blue-800 border-blue-200',
    cheque: 'bg-amber-100 text-amber-800 border-amber-200',
    pos: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    razorpay: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  }

  const statusColors: Record<string, string> = {
    successful: 'bg-green-100 text-green-800',
    pending: 'bg-amber-100 text-amber-800',
    failed: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Collection Register</h2>
          <p className="text-sm text-slate-500">View and export all fee collections.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/><path d="M18 21v-8a2 2 0 0 0-2-2h-4"/><path d="M15 2H6a2 2 0 0 0-2 2v12"/></svg>
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            Print
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:hidden">
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => applyPreset('today')} className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition">Today</button>
          <button onClick={() => applyPreset('yesterday')} className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition">Yesterday</button>
          <button onClick={() => applyPreset('this_week')} className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition">This Week</button>
          <button onClick={() => applyPreset('this_month')} className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition">This Month</button>
          <button onClick={() => applyPreset('prev_month')} className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition">Prev Month</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="pos">POS</option>
              <option value="razorpay">Razorpay</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Received By</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition">
              <option value="all">All Staff</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase sticky top-0">
                <th className="py-3 px-4 whitespace-nowrap">#</th>
                <th className="py-3 px-4 whitespace-nowrap">Receipt No</th>
                <th className="py-3 px-4 whitespace-nowrap">Student</th>
                <th className="py-3 px-4 whitespace-nowrap">Adm. No.</th>
                <th className="py-3 px-4 whitespace-nowrap">Class/Sec</th>
                <th className="py-3 px-4 whitespace-nowrap text-right">Amount</th>
                <th className="py-3 px-4 whitespace-nowrap">Mode</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Reference</th>
                <th className="py-3 px-4 whitespace-nowrap">Received By</th>
                <th className="py-3 px-4 whitespace-nowrap">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr><td colSpan={11} className="py-8 text-center text-slate-500">No collections found for the selected filters.</td></tr>
              ) : (
                filteredPayments.map((p, index) => (
                  <tr key={p.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{p.receiptNumber || '-'}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{p.studentName || '-'}</td>
                    <td className="py-3 px-4">{p.admissionNumber || '-'}</td>
                    <td className="py-3 px-4">{p.classSection || '-'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 text-right">{formatINR(p.amount || 0)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${methodColors[p.paymentMethod?.toLowerCase()] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                        {p.paymentMethod?.replace('_', ' ') || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[p.status?.toLowerCase()] || 'bg-slate-100 text-slate-800'}`}>
                        {p.status || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs truncate max-w-[120px]" title={p.referenceId}>{p.referenceId || '-'}</td>
                    <td className="py-3 px-4">{p.collectedByName || '-'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={5} className="py-4 px-4 font-bold text-slate-900 text-right">Total ({filteredPayments.length} records)</td>
                <td className="py-4 px-4 font-bold text-slate-900 text-right">{formatINR(totalAmount)}</td>
                <td colSpan={5}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
