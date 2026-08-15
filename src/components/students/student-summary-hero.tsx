import React from 'react'
import Link from 'next/link'
import type { AttendanceSummary } from '@/types/attendance'
import {
  GraduationCap,
  Award,
  FileCheck,
  CalendarCheck,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'

interface StudentSummaryHeroProps {
  attendanceSummary: AttendanceSummary | null
  examTitle?: string
  admitCardAvailable?: boolean
  academicPercentage?: number | null
  academicGrade?: string | null
}

export function StudentSummaryHero({
  attendanceSummary,
  examTitle = 'Semester Examination 2024–25',
  admitCardAvailable = true,
  academicPercentage = 85.6,
  academicGrade = 'A',
}: StudentSummaryHeroProps) {
  const hasAttendanceData = attendanceSummary && attendanceSummary.totalSchoolDays > 0
  const rawPct = hasAttendanceData ? attendanceSummary.attendancePercentage : null
  const numPct = typeof rawPct === 'number' ? rawPct : null
  const isAttHealthy = numPct !== null ? numPct >= 75 : true

  // Circumference for SVG circle (r = 26 -> 2 * PI * 26 = ~163.36)
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset =
    numPct !== null ? circumference - (numPct / 100) * circumference : circumference

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Attendance Card with Circular Donut Ring */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-colors group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Attendance Record
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-4 my-2">
            {/* SVG Ring */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="5.5"
                  fill="transparent"
                  className="text-slate-100"
                />
                {numPct !== null ? (
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="5.5"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-700 ease-out ${
                      isAttHealthy ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  />
                ) : null}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-slate-900">
                  {numPct !== null ? `${numPct}%` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              {hasAttendanceData ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{attendanceSummary.presentCount} Present</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <span>{attendanceSummary.absentCount} Absent</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    of {attendanceSummary.totalSchoolDays} school days
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 leading-tight">
                  <span className="font-semibold text-slate-700 block">No Records Yet</span>
                  Attendance pending
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Req: 75%
          </span>
          <Link
            href="/erp/student/attendance"
            prefetch={true}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
          >
            Details <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Academic Session Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-colors group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Academic Session
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>

          <div className="my-1">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              2024–2025
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Enrolled &amp; Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
              Registered for current standard. Regular curriculum track.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">Session Progress</span>
          <Link
            href="/erp/student/promotion"
            prefetch={true}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
          >
            Promotion <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3. Upcoming Examination Status Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Upcoming Examination
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="my-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
              {examTitle}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500 font-medium">Admit Card:</span>
              {admitCardAvailable ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 uppercase tracking-wider font-mono">
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                  Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-1">
              Hall ticket with security QR token ready.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">Exam Office</span>
          <Link
            href="/erp/student/admit-cards"
            prefetch={true}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
          >
            Admit Card <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Academic Performance / Results Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-purple-300 transition-colors group">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Academic Performance
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200/70 flex items-center justify-center text-purple-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {academicPercentage !== null ? `${academicPercentage}%` : 'Published'}
              </h3>
              {academicGrade && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Grade {academicGrade}
                </span>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, academicPercentage || 85)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-1">
              Term assessments &amp; report card available.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">Evaluation Desk</span>
          <Link
            href="/erp/student/results"
            prefetch={true}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
          >
            View Results <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
