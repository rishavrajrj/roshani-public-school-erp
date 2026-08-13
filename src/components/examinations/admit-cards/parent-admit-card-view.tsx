'use client'

import type { AdmitCard } from '@/types/admit-card'
import { AdmitCardDocument } from './admit-card-document'
import { Button } from '@/components/ui/button'

interface Props {
  admitCard: AdmitCard | null
  childName?: string
}

export function ParentAdmitCardView({ admitCard, childName }: Props) {
  if (!admitCard || admitCard.status !== 'published') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl">
          📑
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admit Card Currently Unavailable</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The Admit Card for {childName || 'your ward'} is currently unavailable for download. Please contact the school administration office for further information.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Examination Hall Ticket — {childName || 'Ward'}</h2>
          <p className="text-xs text-slate-500 mt-1">Official Admit Card for upcoming school examinations</p>
        </div>
        <Button variant="primary" onClick={() => window.print()}>
          🖨️ Download / Print Admit Card
        </Button>
      </div>

      <AdmitCardDocument admitCard={admitCard} />
    </div>
  )
}
