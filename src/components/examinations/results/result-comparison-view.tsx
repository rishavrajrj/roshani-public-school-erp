'use client'

import { useState, useMemo } from 'react'
import type { StudentResult, GradingScale } from '@/types/result'
import { compareExaminations } from '@/lib/examinations/result-analytics'

interface Props {
  results: StudentResult[]
  gradingScales: GradingScale[]
  onOpenSubjectDetail?: (subjectName: string) => void
}

export function ResultComparisonView({
  results,
  gradingScales,
  onOpenSubjectDetail,
}: Props) {
  // If fewer than 2 results, show helpful state
  if (!results || results.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm space-y-3">
        <div className="text-3xl">⚖️</div>
        <h3 className="text-lg font-bold text-slate-900">Comparative Analysis Requires 2+ Examinations</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Performance comparison will become available once additional term examinations are published for your academic record.
        </p>
      </div>
    )
  }

  // Default: Exam A = Latest (results[0]), Exam B = Previous (results[1])
  const [examAId, setExamAId] = useState<string>(results[0].id)
  const [examBId, setExamBId] = useState<string>(results[1].id)

  const examA = useMemo(() => results.find((r) => r.id === examAId) || results[0], [results, examAId])
  const examB = useMemo(() => results.find((r) => r.id === examBId) || results[1], [results, examBId])

  const comparison = useMemo(() => {
    return compareExaminations(examA, examB, gradingScales)
  }, [examA, examB, gradingScales])

  return (
    <div className="space-y-6">
      {/* Header & Examination Selectors */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Compare Examination Performance</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate subject-level score deltas and overall progression across any two examination periods
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Exam A Selector (Current / Target) */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
              Primary Examination (Exam A)
            </label>
            <select
              value={examAId}
              onChange={(e) => setExamAId(e.target.value)}
              disabled={results.length === 0}
              className="w-full bg-white text-xs font-semibold text-slate-900 border border-indigo-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {results.length === 0 ? (
                <option value="">No examination results available</option>
              ) : (
                results.map((r) => (
                  <option key={r.id} value={r.id} disabled={r.id === examBId}>
                    {r.examinationName} ({r.academicSessionName || 'Session'} • {r.className})
                  </option>
                ))
              )}
            </select>
            <div className="text-[11px] font-mono text-indigo-700 font-medium">
              Score: <strong className="font-bold">{examA.percentage.toFixed(2)}%</strong> (Grade {examA.grade || '—'})
            </div>
          </div>

          {/* Exam B Selector (Comparison Target) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              Comparison Baseline (Exam B)
            </label>
            <select
              value={examBId}
              onChange={(e) => setExamBId(e.target.value)}
              disabled={results.length === 0}
              className="w-full bg-white text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {results.length === 0 ? (
                <option value="">No examination results available</option>
              ) : (
                results.map((r) => (
                  <option key={r.id} value={r.id} disabled={r.id === examAId}>
                    {r.examinationName} ({r.academicSessionName || 'Session'} • {r.className})
                  </option>
                ))
              )}
            </select>
            <div className="text-[11px] font-mono text-slate-600 font-medium">
              Score: <strong className="font-bold">{examB.percentage.toFixed(2)}%</strong> (Grade {examB.grade || '—'})
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Exam B Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Baseline (Exam B)</span>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-700 font-mono">
              {comparison.examBPercentage.toFixed(2)}%
            </span>
            <span className="text-xs text-slate-400 block font-sans truncate">{comparison.examBName}</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-600">
            {comparison.examBGpa.toFixed(2)} SGPA • {comparison.examBResultStatus}
          </span>
        </div>

        {/* Card 2: Exam A Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Primary (Exam A)</span>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
              {comparison.examAPercentage.toFixed(2)}%
            </span>
            <span className="text-xs text-slate-400 block font-sans truncate">{comparison.examAName}</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-indigo-800">
            {comparison.examAGpa.toFixed(2)} SGPA • {comparison.examAResultStatus}
          </span>
        </div>

        {/* Card 3: Percentage Delta */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Percentage Points</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${
              comparison.percentageDelta > 0 ? 'text-emerald-600' : comparison.percentageDelta < 0 ? 'text-rose-600' : 'text-slate-700'
            }`}>
              {comparison.percentageDelta > 0 ? `+${comparison.percentageDelta.toFixed(2)}%` : `${comparison.percentageDelta.toFixed(2)}%`}
            </span>
            <span className="text-base font-bold">
              {comparison.trendDirection === 'up' ? '📈' : comparison.trendDirection === 'down' ? '📉' : '→'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {comparison.gpaDelta > 0 ? `+${comparison.gpaDelta.toFixed(2)}` : comparison.gpaDelta.toFixed(2)} SGPA Delta
          </span>
        </div>

        {/* Card 4: Comparison Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Trajectory Status</span>
          <div className="my-2">
            <span className={`inline-block px-3 py-1.5 rounded-xl text-sm font-black uppercase tracking-wider ${
              comparison.trendDirection === 'up'
                ? 'bg-emerald-100 text-emerald-800'
                : comparison.trendDirection === 'down'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-800'
            }`}>
              {comparison.trendStatusLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-1">{comparison.summaryNarrative}</p>
        </div>
      </div>

      {/* Summary Narrative Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex items-center gap-3">
        <span className="text-xl">📊</span>
        <p className="text-xs sm:text-sm font-medium leading-relaxed">
          {comparison.summaryNarrative}
        </p>
      </div>

      {/* Subject-Wise Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h4 className="text-base font-extrabold text-slate-900 tracking-tight">Subject-by-Subject Evaluation Comparison</h4>
          <p className="text-xs text-slate-500 mt-0.5">Click any subject to view its full longitudinal trajectory</p>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-4">Subject</th>
                <th className="p-4 text-center">Baseline (Exam B)</th>
                <th className="p-4 text-center">Primary (Exam A)</th>
                <th className="p-4 text-center">Marks Change</th>
                <th className="p-4 text-center">Percentage Delta</th>
                <th className="p-4 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {comparison.subjectComparisons.map((sc, idx) => (
                <tr
                  key={idx}
                  onClick={() => onOpenSubjectDetail && onOpenSubjectDetail(sc.subjectName)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  title="Click to view full subject history"
                >
                  <td className="p-4">
                    <span className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors">
                      {sc.subjectName}
                    </span>
                    {sc.subjectCode && (
                      <span className="text-[10px] font-mono text-slate-400 block">{sc.subjectCode}</span>
                    )}
                  </td>
                  <td className="p-4 text-center font-mono">
                    <span className="font-bold text-slate-700">{sc.examBMarks}</span>
                    <span className="text-slate-400">/{sc.examBMax}</span>
                    <span className="text-[11px] text-slate-500 block">({sc.examBPercentage.toFixed(1)}% • {sc.examBGrade})</span>
                  </td>
                  <td className="p-4 text-center font-mono">
                    <span className="font-bold text-indigo-700">{sc.examAMarks}</span>
                    <span className="text-slate-400">/{sc.examAMax}</span>
                    <span className="text-[11px] text-indigo-600 block">({sc.examAPercentage.toFixed(1)}% • {sc.examAGrade})</span>
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-xs">
                    <span className={sc.changeMarks > 0 ? 'text-emerald-600' : sc.changeMarks < 0 ? 'text-rose-600' : 'text-slate-500'}>
                      {sc.changeMarks > 0 ? `+${sc.changeMarks}` : `${sc.changeMarks}`}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono font-black text-xs">
                    <span className={sc.changePercentage > 0 ? 'text-emerald-600' : sc.changePercentage < 0 ? 'text-rose-600' : 'text-slate-500'}>
                      {sc.changePercentage > 0 ? `+${sc.changePercentage.toFixed(1)}%` : `${sc.changePercentage.toFixed(1)}%`}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                      sc.trend === 'up'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sc.trend === 'down'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {sc.trend === 'up' ? '↑' : sc.trend === 'down' ? '↓' : '→'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Comparison Cards */}
        <div className="block sm:hidden divide-y divide-slate-200 p-4 space-y-3">
          {comparison.subjectComparisons.map((sc, idx) => (
            <div
              key={idx}
              onClick={() => onOpenSubjectDetail && onOpenSubjectDetail(sc.subjectName)}
              className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{sc.subjectName}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-black ${
                  sc.trend === 'up' ? 'bg-emerald-100 text-emerald-800' : sc.trend === 'down' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {sc.trend === 'up' ? '↑ Improving' : sc.trend === 'down' ? '↓ Declining' : '→ Steady'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Baseline</span>
                  <span className="font-bold text-slate-700">{sc.examBMarks}/{sc.examBMax} ({sc.examBPercentage}%)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Primary</span>
                  <span className="font-bold text-indigo-700">{sc.examAMarks}/{sc.examAMax} ({sc.examAPercentage}%)</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-sans">Net Score Change:</span>
                  <span className={`font-black ${sc.changeMarks > 0 ? 'text-emerald-600' : sc.changeMarks < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                    {sc.changeMarks > 0 ? `+${sc.changeMarks} pts (+${sc.changePercentage}%)` : `${sc.changeMarks} pts (${sc.changePercentage}%)`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
