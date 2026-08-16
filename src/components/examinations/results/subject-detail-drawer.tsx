'use client'

import { useMemo } from 'react'
import type { StudentResult, GradingScale } from '@/types/result'
import { getSubjectPerformanceHistory } from '@/lib/examinations/result-analytics'

interface Props {
  subjectNameOrId: string | null
  results: StudentResult[]
  gradingScales: GradingScale[]
  onClose: () => void
}

export function SubjectDetailDrawer({
  subjectNameOrId,
  results,
  gradingScales,
  onClose,
}: Props) {
  const history = useMemo(() => {
    if (!subjectNameOrId) return null
    return getSubjectPerformanceHistory(subjectNameOrId, results, gradingScales)
  }, [subjectNameOrId, results, gradingScales])

  if (!subjectNameOrId || !history) return null

  const { historicalPoints } = history

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer / Modal Container */}
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                {history.subjectCode || 'SUBJECT'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                history.trend === 'up' ? 'bg-emerald-100 text-emerald-800' : history.trend === 'down' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {history.trend === 'up' ? '📈 Improving' : history.trend === 'down' ? '📉 Declining' : '→ Steady'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{history.subjectName}</h2>
            <p className="text-xs text-slate-500">Longitudinal academic trajectory &amp; marks analysis</p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current Evaluation Scorecards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Marks</span>
            <span className="text-xl font-black text-slate-900 font-mono">{history.currentMarks}</span>
            <span className="text-xs text-slate-400">/{history.maximumMarks}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Percentage</span>
            <span className="text-xl font-black text-indigo-700 font-mono">{history.percentage}%</span>
            <span className="text-xs text-indigo-600 block font-semibold">Grade {history.grade}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Previous Term</span>
            <span className="text-xl font-black text-slate-700 font-mono">
              {history.previousMarks !== null ? history.previousMarks : '—'}
            </span>
            <span className="text-xs text-slate-400 block">
              {history.previousPercentage !== null ? `${history.previousPercentage}%` : 'Baseline'}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Net Change</span>
            <span className={`text-xl font-black font-mono ${
              history.changeMarks && history.changeMarks > 0 ? 'text-emerald-600' : history.changeMarks && history.changeMarks < 0 ? 'text-rose-600' : 'text-slate-600'
            }`}>
              {history.changeMarks !== null ? (history.changeMarks > 0 ? `+${history.changeMarks}` : history.changeMarks) : '—'}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {history.changePercentage !== null ? `(${history.changePercentage > 0 ? '+' : ''}${history.changePercentage}%)` : ''}
            </span>
          </div>
        </div>

        {/* Narrative Banner */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-xs sm:text-sm font-medium text-indigo-950 flex items-center gap-3">
          <span className="text-lg shrink-0">💡</span>
          <p className="leading-relaxed">{history.trendNarrative}</p>
        </div>

        {/* Historical Trajectory SVG Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-800">
              {history.subjectName} — Performance History
            </h4>
            <span className="text-slate-400 font-mono font-medium">{historicalPoints.length} Terms</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            {historicalPoints.length > 1 ? (
              <div className="relative h-44 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 360 130">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="360" y2="20" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="360" y2="60" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="360" y2="100" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Connect points */}
                  <polyline
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={historicalPoints.map((pt, i) => {
                      const x = (i / (historicalPoints.length - 1)) * 320 + 20
                      const y = 100 - (pt.percentage / 100) * 80
                      return `${x},${y}`
                    }).join(' ')}
                  />

                  {/* Nodes */}
                  {historicalPoints.map((pt, i) => {
                    const x = (i / (historicalPoints.length - 1)) * 320 + 20
                    const y = 100 - (pt.percentage / 100) * 80
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                        <text x={x} y={y - 10} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="monospace">
                          {pt.percentage}%
                        </text>
                        <text x={x} y={118} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">
                          {pt.examinationName.substring(0, 10)}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-xs text-slate-400 italic">
                Single term recorded. Trajectory curve will appear after subsequent exams.
              </div>
            )}
          </div>
        </div>

        {/* Historical Examinations Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Evaluation History Record</h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5">Exam Term</th>
                  <th className="p-2.5">Session / Class</th>
                  <th className="p-2.5 text-center">Marks</th>
                  <th className="p-2.5 text-center">Percentage</th>
                  <th className="p-2.5 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {historicalPoints.map((pt, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{pt.examinationName}</td>
                    <td className="p-2.5 text-slate-500">{pt.academicSessionName} • {pt.className}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-900">{pt.marksObtained}/{pt.maximumMarks}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-indigo-700">{pt.percentage}%</td>
                    <td className="p-2.5 text-center font-black">{pt.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Close Action */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors"
          >
            Close Subject Details
          </button>
        </div>
      </div>
    </div>
  )
}
