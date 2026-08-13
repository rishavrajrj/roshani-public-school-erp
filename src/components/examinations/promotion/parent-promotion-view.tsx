'use client'

import type { PromotionRecord } from '@/types/promotion'

interface Props {
  activeHistory: any
  promotionHistory: PromotionRecord[]
  childName?: string
}

export function ParentPromotionView({ activeHistory, promotionHistory, childName }: Props) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Current Active Enrollment Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Academic Progression — {childName || 'Ward'}</h2>
            <p className="text-xs text-slate-500">Official active session enrollment details</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase">
            ACTIVE ENROLLMENT
          </span>
        </div>

        {activeHistory ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
            <div>
              <span className="text-xs text-slate-500 block font-semibold">Academic Session</span>
              <span className="font-bold text-slate-900">{activeHistory.academic_sessions?.name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-semibold">Class &amp; Section</span>
              <span className="font-bold text-slate-900">{activeHistory.classes?.name} {activeHistory.sections?.name ? `(${activeHistory.sections.name})` : ''}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-semibold">Roll Number</span>
              <span className="font-mono font-bold text-slate-900">{activeHistory.roll_number || 'N/A'}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No active academic session history record found.</p>
        )}
      </div>

      {/* Promotion Progression History Timeline */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
          Academic Progression &amp; Promotion History
        </h3>

        {promotionHistory.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No historical promotion decisions recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {promotionHistory.map((pr) => (
              <div key={pr.id} className="border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{pr.sourceClassName} ({pr.sourceAcademicSessionName})</span>
                    <span className="text-slate-400">$\rightarrow$</span>
                    <span className="font-bold text-sm text-indigo-700">{pr.targetClassName || 'N/A'} ({pr.targetAcademicSessionName})</span>
                  </div>
                  {pr.reason && <p className="text-xs text-slate-500 italic">{pr.reason}</p>}
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                    {pr.decision}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
