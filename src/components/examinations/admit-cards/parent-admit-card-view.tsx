'use client'

import React from 'react'
import type { AdmitCard } from '@/types/admit-card'
import { AdmitCardDocument } from './admit-card-document'
import { Button } from '@/components/ui/button'
import { Printer, Download, FileCheck, AlertCircle } from 'lucide-react'

interface Props {
  admitCard: AdmitCard | null
  childName?: string
}

export function ParentAdmitCardView({ admitCard, childName }: Props) {
  if (!admitCard || admitCard.status !== 'published') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Admit Card Currently Unavailable
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          The examination admit card for {childName || 'your ward'} has not been published yet or is currently under administrative clearance. Please contact the school examination cell for assistance.
        </p>
        <div className="pt-2 text-xs text-slate-500 font-mono">
          Roshani Public School • Examination Department
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
              Official Examination Document
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ID: {admitCard.admitCardNumber}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Examination Admit Card — {childName || admitCard.studentName}
          </h2>
          <p className="text-xs text-slate-500">
            {admitCard.examinationName} ({admitCard.academicSessionName})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="flex items-center gap-2 text-xs font-bold"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Download PDF
          </Button>

          <Button
            variant="primary"
            onClick={() => window.print()}
            className="flex items-center gap-2 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white"
          >
            <Printer className="w-4 h-4" />
            Print Admit Card
          </Button>
        </div>
      </div>

      {/* Sheet Viewport */}
      <div className="bg-slate-100/70 p-2 sm:p-6 rounded-2xl border border-slate-200/80 overflow-x-auto print:bg-transparent print:p-0 print:border-none">
        <AdmitCardDocument admitCard={admitCard} />
      </div>
    </div>
  )
}
