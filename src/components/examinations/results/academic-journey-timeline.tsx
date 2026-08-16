'use client'

import type { AcademicJourneyStep } from '@/types/result'

interface Props {
  journeySteps: AcademicJourneyStep[]
  onSelectResult: (resultId: string) => void
}

export function AcademicJourneyTimeline({ journeySteps, onSelectResult }: Props) {
  if (!journeySteps || journeySteps.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        No academic journey milestones recorded yet.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl">🗺️</span>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Academic Journey &amp; Milestones</h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Chronological timeline of examinations, scholastic evaluations, and grade progression
        </p>
      </div>

      {/* Connected Milestone Timeline */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-200 space-y-8 my-4">
        {journeySteps.map((step, idx) => (
          <div key={step.resultId} className="relative group">
            {/* Timeline Node Bullet */}
            <div
              className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-4 flex items-center justify-center text-[10px] font-bold ${
                step.isCurrent
                  ? 'bg-indigo-600 border-white text-white shadow-md ring-2 ring-indigo-600'
                  : 'bg-white border-indigo-300 text-slate-700'
              }`}
            >
              {idx + 1}
            </div>

            {/* Milestone Card */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                step.isCurrent
                  ? 'bg-indigo-50/60 border-indigo-200 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black font-mono uppercase bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                      {step.academicSession}
                    </span>
                    <span className="text-xs font-bold text-slate-600">• {step.classLevel}</span>
                    {step.isCurrent && (
                      <span className="bg-indigo-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                        Current Result
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1">
                    {step.examinationName}
                  </h4>
                </div>

                <div className="flex items-center gap-4">
                  {/* Score pill */}
                  <div className="text-right font-mono">
                    <div className="text-xl font-black text-slate-900">{step.percentage}%</div>
                    <div className="text-[11px] text-indigo-700 font-bold">
                      Grade {step.grade} ({step.sgpa.toFixed(2)} SGPA)
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                    step.resultStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {step.resultStatus}
                  </span>

                  <button
                    onClick={() => onSelectResult(step.resultId)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    View Result
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
