'use client'

import React, { useState } from 'react'
import type { AdmitCard } from '@/types/admit-card'
import { AdmitCardDocument } from './admit-card-document'
import { Button } from '@/components/ui/button'
import { Printer, Download, FileCheck, AlertCircle, Sparkles } from 'lucide-react'

interface Props {
  admitCards?: AdmitCard[]
  admitCard?: AdmitCard | null
}

export function StudentAdmitCardView({ admitCards = [], admitCard }: Props) {
  // Combine single or multiple admit cards
  const allCards = admitCards.length > 0 ? admitCards : admitCard ? [admitCard] : []
  const [selectedCardId, setSelectedCardId] = useState<string>(allCards[0]?.id || '')

  const currentCard = allCards.find((c) => c.id === selectedCardId) || allCards[0] || null

  const handleDownloadPDF = () => {
    // Standard print to PDF in modern browsers
    window.print()
  }

  if (!currentCard || currentCard.status !== 'published') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Admit Card Not Published Yet
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Your official examination admit card has not been published by the examination authority yet. Once the school administration releases hall tickets for your enrolled exams, they will appear here automatically.
        </p>
        <div className="pt-2 text-xs text-slate-500 font-mono">
          Examination Department • Roshani Public School
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Action & Selector Bar (Hidden on Print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
              Verified &amp; Published
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ID: {currentCard.admitCardNumber}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {currentCard.examinationName || 'Official Examination Admit Card'}
          </h2>
          <p className="text-xs text-slate-500">
            Print this official hall ticket and carry it along with your Student ID card to all exam sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {allCards.length > 1 && (
            <select
              value={currentCard.id}
              onChange={(e) => setSelectedCardId(e.target.value)}
              aria-label="Select Examination"
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.examinationName} ({c.academicSessionName})
                </option>
              ))}
            </select>
          )}

          <Button
            variant="secondary"
            onClick={handleDownloadPDF}
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

      {/* Document Viewport Wrapper */}
      <div className="bg-slate-100/70 p-2 sm:p-6 rounded-2xl border border-slate-200/80 overflow-x-auto print:bg-transparent print:p-0 print:border-none">
        <AdmitCardDocument admitCard={currentCard} />
      </div>
    </div>
  )
}
