import React from 'react'
import Link from 'next/link'
import type { AttendanceSummary } from '@/types/attendance'
import { CalendarCheck, ArrowRight } from 'lucide-react'

interface AttendanceOverviewCardProps {
  summary: AttendanceSummary | null
}

export function StudentAttendanceOverviewCard({ summary }: AttendanceOverviewCardProps) {
  const hasData = summary && summary.totalSchoolDays > 0
  const rawPct = hasData ? summary.attendancePercentage : null
  const numPct = typeof rawPct === 'number' ? rawPct : null
  const isHealthy = numPct !== null ? numPct >= 75 : true

  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset =
    numPct !== null ? circumference - (numPct / 100) * circumference : circumference

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600 shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Overview</h3>
              <p className="text-[11px] text-slate-400">Current Session Cumulative</p>
            </div>
          </div>
          {numPct !== null && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                isHealthy
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isHealthy ? 'Good Standing' : 'Low Attendance'}
            </span>
          )}
        </div>

        {/* Center Donut Visualization */}
        <div className="py-5 flex flex-col sm:flex-row items-center justify-around gap-4">
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className="text-slate-100"
              />
              {numPct !== null ? (
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`transition-all duration-700 ease-out ${
                    isHealthy ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                />
              ) : null}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-900 leading-none">
                {numPct !== null ? `${numPct}%` : 'N/A'}
              </span>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                Presence
              </span>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto flex-1 sm:max-w-[200px]">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-slate-500">Present</span>
                <span className="block text-xs font-bold text-slate-900">
                  {summary?.presentCount ?? 0} d
                </span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-slate-500">Absent</span>
                <span className="block text-xs font-bold text-slate-900">
                  {summary?.absentCount ?? 0} d
                </span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-slate-500">Late</span>
                <span className="block text-xs font-bold text-slate-900">
                  {summary?.lateCount ?? 0} d
                </span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-slate-500">Leave</span>
                <span className="block text-xs font-bold text-slate-900">
                  {summary?.leaveCount ?? 0} d
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 mb-2">
          Minimum 75% attendance required for CBSE examination eligibility
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-slate-100">
        <Link
          href="/erp/student/attendance"
          prefetch={true}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 transition group cursor-pointer"
        >
          <span>View Full Attendance</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
