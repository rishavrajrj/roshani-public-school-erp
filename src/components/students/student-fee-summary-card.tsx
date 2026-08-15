import React from 'react'
import Link from 'next/link'
import { CreditCard, ArrowRight } from 'lucide-react'

interface FeeSummaryCardProps {
  totalFee?: number
  paidFee?: number
  dueFee?: number
}

export function StudentFeeSummaryCard({
  totalFee = 45000,
  paidFee = 30000,
  dueFee = 15000,
}: FeeSummaryCardProps) {
  const paidPct = totalFee > 0 ? Math.round((paidFee / totalFee) * 100) : 100
  const isClear = dueFee === 0

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fee Ledger Summary</h3>
              <p className="text-[11px] text-slate-400">Academic Session 2024–25</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
              isClear
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-300'
            }`}
          >
            {isClear ? 'All Dues Cleared' : 'Installment Due'}
          </span>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-3 gap-2 my-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Fees
            </span>
            <span className="block text-xs sm:text-sm font-extrabold text-slate-900 mt-1">
              ₹{totalFee.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
            <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Paid Amount
            </span>
            <span className="block text-xs sm:text-sm font-extrabold text-emerald-900 mt-1">
              ₹{paidFee.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
            <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Balance Due
            </span>
            <span className="block text-xs sm:text-sm font-extrabold text-amber-900 mt-1">
              ₹{dueFee.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="my-2 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>Payment Settlement Progress</span>
            <span className="font-bold text-slate-900">{paidPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-2 transition-all duration-700"
              style={{ width: `${paidPct}%` }}
            />
            <div
              className="bg-amber-400 h-2 transition-all duration-700"
              style={{ width: `${100 - paidPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-slate-100">
        <Link
          href="/erp/student/fees"
          prefetch={true}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 transition group cursor-pointer"
        >
          <span>View Fee Ledger &amp; Receipts</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
