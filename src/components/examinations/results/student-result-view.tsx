'use client'

import type { StudentResult } from '@/types/result'
import { ResultDocument } from './result-document'
import { Button } from '@/components/ui/button'

interface Props {
  result: StudentResult | null
}

export function StudentResultView({ result }: Props) {
  if (!result || result.status !== 'published') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl">
          📊
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Result is Currently Unavailable</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Your examination marks statement is currently undergoing administrative processing or has not been published yet. Please check back later or contact the examination coordinator.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Official Examination Marksheet</h2>
          <p className="text-xs text-slate-500 mt-1">Official marks statement for {result.examinationName}</p>
        </div>
        <Button variant="primary" onClick={() => window.print()}>
          🖨️ Download / Print Marksheet
        </Button>
      </div>

      <ResultDocument result={result} />
    </div>
  )
}
