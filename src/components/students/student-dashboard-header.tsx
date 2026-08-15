import React from 'react'
import Link from 'next/link'
import { ChevronRight, GraduationCap } from 'lucide-react'

interface StudentDashboardHeaderProps {
  studentName: string
  admissionNumber?: string
  academicSession?: string
}

export function StudentDashboardHeader({
  studentName,
  admissionNumber,
  academicSession = '2024–2025',
}: StudentDashboardHeaderProps) {
  // Determine greeting based on current local hour
  const currentHour = new Date().getHours()
  let greeting = 'Good Morning'
  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good Afternoon'
  } else if (currentHour >= 17 || currentHour < 4) {
    greeting = 'Good Evening'
  }

  // Extract first name
  const firstName = studentName ? studentName.split(' ')[0] : 'Student'

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
          <li>
            <Link
              href="/erp/student"
              className="text-slate-600 hover:text-emerald-700 transition font-semibold"
            >
              Student Portal
            </Link>
          </li>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <li>
            <span className="text-slate-900 font-bold">Dashboard</span>
          </li>
        </ol>
      </nav>

      {/* Main Header Content */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              {greeting}, {firstName} 👋
            </h1>
            {admissionNumber && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                ADM: {admissionNumber}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Here&apos;s your academic overview, attendance, examinations and school updates.
          </p>
        </div>

        {/* Right side session card */}
        <div className="hidden sm:flex items-center gap-3 self-start md:self-auto bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Academic Session
            </span>
            <span className="block text-xs sm:text-sm font-bold text-slate-900">
              {academicSession}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
