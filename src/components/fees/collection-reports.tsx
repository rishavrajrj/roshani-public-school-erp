'use client'

import { useState } from 'react'
import { formatINR } from '@/lib/utils/csv-export'

interface CollectionReportsProps {
  dateRangeReport: {
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
  staffReport: Array<{
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
  }>
  paymentModeReport: Array<{
    method: string
    transactionCount: number
    grossCollection: number
    refunds: number
    netCollection: number
  }>
}

export function CollectionReports({
  dateRangeReport,
  staffReport,
  paymentModeReport,
}: CollectionReportsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'staff' | 'payment_mode'>('summary')

  // Helper to calculate totals for staff table footer
  const staffTotals = staffReport.reduce(
    (acc, row) => ({
      cash: acc.cash + row.cash,
      upi: acc.upi + row.upi,
      bankTransfer: acc.bankTransfer + row.bankTransfer,
      cheque: acc.cheque + row.cheque,
      pos: acc.pos + row.pos,
      razorpay: acc.razorpay + row.razorpay,
      total: acc.total + row.total,
    }),
    { cash: 0, upi: 0, bankTransfer: 0, cheque: 0, pos: 0, razorpay: 0, total: 0 }
  )

  const maxModeTotal = Math.max(...paymentModeReport.map((m) => m.netCollection), 1)

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-4">
        {(
          [
            { id: 'summary', label: 'Date Range Summary' },
            { id: 'staff', label: 'Staff-wise' },
            { id: 'payment_mode', label: 'Payment Mode' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Gross Collection</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatINR(dateRangeReport.totalCollection)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Cash</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatINR(dateRangeReport.cash)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">UPI</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatINR(dateRangeReport.upi)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Bank Transfer</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatINR(dateRangeReport.bankTransfer)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Cheque</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatINR(dateRangeReport.cheque)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">POS</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatINR(dateRangeReport.pos)}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">Razorpay</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatINR(dateRangeReport.razorpay)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 shadow-sm">
              <p className="text-sm font-semibold uppercase text-rose-600">Total Refunds</p>
              <p className="text-3xl font-extrabold text-rose-700 mt-2">
                {formatINR(dateRangeReport.refunds)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-xl border border-transparent shadow-md text-white">
              <p className="text-sm font-semibold uppercase text-emerald-50">Net Collection</p>
              <p className="text-4xl font-extrabold mt-2">
                {formatINR(dateRangeReport.netCollection)}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Cash</th>
                <th className="py-3 px-4 text-right">UPI</th>
                <th className="py-3 px-4 text-right">Bank</th>
                <th className="py-3 px-4 text-right">Cheque</th>
                <th className="py-3 px-4 text-right">POS</th>
                <th className="py-3 px-4 text-right">Razorpay</th>
                <th className="py-3 px-4 text-right text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {staffReport.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500">
                    No staff collection data found.
                  </td>
                </tr>
              ) : (
                staffReport.map((row) => (
                  <tr key={row.staffId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{row.staffName}</td>
                    <td className="py-3 px-4 text-slate-500">{row.staffRole}</td>
                    <td className="py-3 px-4 text-right">{formatINR(row.cash)}</td>
                    <td className="py-3 px-4 text-right">{formatINR(row.upi)}</td>
                    <td className="py-3 px-4 text-right">{formatINR(row.bankTransfer)}</td>
                    <td className="py-3 px-4 text-right">{formatINR(row.cheque)}</td>
                    <td className="py-3 px-4 text-right">{formatINR(row.pos)}</td>
                    <td className="py-3 px-4 text-right">{formatINR(row.razorpay)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatINR(row.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {staffReport.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td className="py-4 px-4" colSpan={2}>
                    School Total
                  </td>
                  <td className="py-4 px-4 text-right">{formatINR(staffTotals.cash)}</td>
                  <td className="py-4 px-4 text-right">{formatINR(staffTotals.upi)}</td>
                  <td className="py-4 px-4 text-right">{formatINR(staffTotals.bankTransfer)}</td>
                  <td className="py-4 px-4 text-right">{formatINR(staffTotals.cheque)}</td>
                  <td className="py-4 px-4 text-right">{formatINR(staffTotals.pos)}</td>
                  <td className="py-4 px-4 text-right">{formatINR(staffTotals.razorpay)}</td>
                  <td className="py-4 px-4 text-right text-emerald-700 text-base">
                    {formatINR(staffTotals.total)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {activeTab === 'payment_mode' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentModeReport.map((mode) => (
            <div key={mode.method} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 capitalize">
                    {mode.method.replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{mode.transactionCount} transactions</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-slate-900">{formatINR(mode.netCollection)}</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-1">Net Total</p>
                </div>
              </div>

              <div className="mt-auto space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Gross Collection</span>
                  <span>{formatINR(mode.grossCollection)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600">
                  <span>Refunds</span>
                  <span>{formatINR(mode.refunds)}</span>
                </div>
                
                <div className="pt-3">
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.max(0, (mode.netCollection / maxModeTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {paymentModeReport.length === 0 && (
            <div className="col-span-full bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
              No payment mode data available.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
