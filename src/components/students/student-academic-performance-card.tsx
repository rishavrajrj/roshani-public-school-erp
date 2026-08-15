import React from 'react'
import Link from 'next/link'
import { FileCheck, ArrowRight } from 'lucide-react'

interface SubjectScore {
  name: string
  score: number
  total: number
  grade: string
}

interface AcademicPerformanceCardProps {
  overallPercentage?: number | null
  termName?: string
  subjects?: SubjectScore[]
}

const DEFAULT_SUBJECTS: SubjectScore[] = [
  { name: 'Mathematics', score: 92, total: 100, grade: 'A1' },
  { name: 'Science', score: 88, total: 100, grade: 'A2' },
  { name: 'English Language', score: 84, total: 100, grade: 'A2' },
  { name: 'Social Studies', score: 78, total: 100, grade: 'B1' },
]

export function StudentAcademicPerformanceCard({
  overallPercentage = 85.6,
  termName = 'Term 1 Assessments',
  subjects = DEFAULT_SUBJECTS,
}: AcademicPerformanceCardProps) {
  const pct = overallPercentage ?? 85.6

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/70 flex items-center justify-center text-purple-600 shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Performance</h3>
              <p className="text-[11px] text-slate-400">{termName}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-purple-700">{pct}%</span>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Avg Score
            </span>
          </div>
        </div>

        {/* Subjects Progression Bars */}
        <div className="space-y-3 my-3">
          {subjects.map((sub, idx) => {
            const subPct = Math.round((sub.score / sub.total) * 100)
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{sub.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {sub.score}/{sub.total}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">
                      {sub.grade}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${subPct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-3 border-t border-slate-100">
        <Link
          href="/erp/student/results"
          prefetch={true}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-purple-50 hover:text-purple-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 transition group cursor-pointer"
        >
          <span>View Detailed Scorecard</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
