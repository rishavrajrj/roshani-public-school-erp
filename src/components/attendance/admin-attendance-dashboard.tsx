'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AttendanceSessionStatus } from '@/types/attendance'

interface OverviewItem {
  classId: string
  className: string
  sectionId: string
  sectionName: string
  sessionId: string | null
  status: AttendanceSessionStatus | 'pending'
  markedAt: string | null
  lockedAt: string | null
}

interface Props {
  academicSessionId: string
  selectedDate: string
  overview: OverviewItem[]
}

export function AdminAttendanceDashboard({ academicSessionId, selectedDate, overview }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(selectedDate)

  const counts = overview.reduce(
    (acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
    },
    { pending: 0, submitted: 0, locked: 0, draft: 0 } as Record<string, number>
  )

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    router.push(`/erp/admin/attendance?sessionId=${academicSessionId}&date=${newDate}`)
  }

  // Group section cards by class name
  const groupedByClass: Record<string, OverviewItem[]> = {}
  for (const item of overview) {
    if (!groupedByClass[item.className]) {
      groupedByClass[item.className] = []
    }
    groupedByClass[item.className].push(item)
  }

  return (
    <div className="space-y-6">
      {/* Date Filter & Metrics */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Select Attendance Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-4 text-center">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Sections</div>
            <div className="text-xl font-bold text-slate-900">{overview.length}</div>
          </div>
          <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
            <div className="text-xs font-semibold text-green-800 uppercase">Submitted</div>
            <div className="text-xl font-bold text-green-900">{counts.submitted || 0}</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg">
            <div className="text-xs font-semibold text-rose-800 uppercase">Locked</div>
            <div className="text-xl font-bold text-rose-900">{counts.locked || 0}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
            <div className="text-xs font-semibold text-amber-800 uppercase">Pending</div>
            <div className="text-xl font-bold text-amber-900">{counts.pending || 0}</div>
          </div>
        </div>
      </div>

      {/* Class/Section Grid */}
      <div className="space-y-6">
        {Object.entries(groupedByClass).map(([className, sections]) => (
          <div key={className} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{className}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sections.map((sec) => {
                let badgeClass = 'bg-amber-100 text-amber-800'
                let label = 'Pending'

                if (sec.status === 'submitted') {
                  badgeClass = 'bg-green-100 text-green-800'
                  label = 'Submitted'
                } else if (sec.status === 'locked') {
                  badgeClass = 'bg-rose-100 text-rose-800'
                  label = 'Locked'
                }

                return (
                  <div
                    key={sec.sectionId}
                    className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition bg-slate-50"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-900 text-base">Section {sec.sectionName}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                          {label}
                        </span>
                      </div>
                      {sec.markedAt && (
                        <p className="text-xs text-slate-500 mb-3">
                          Marked: {new Date(sec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/erp/teacher/attendance/mark?sessionId=${academicSessionId}&classId=${sec.classId}&sectionId=${sec.sectionId}&date=${date}`}
                      className="w-full mt-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-center font-medium py-1.5 px-3 rounded text-xs transition"
                    >
                      {sec.status === 'pending' ? 'Mark Attendance' : 'View / Edit Sheet'}
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
