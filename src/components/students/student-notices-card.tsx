import React from 'react'
import Link from 'next/link'
import {
  Bell,
  Trophy,
  Sun,
  Users,
  Calendar,
  ArrowRight,
} from 'lucide-react'

interface NoticeItem {
  id: string
  title: string
  description: string
  date: string
  category: 'sports' | 'holiday' | 'meeting' | 'exam'
  isNew?: boolean
}

const NOTICES: NoticeItem[] = [
  {
    id: 'n-1',
    title: 'Annual Sports Meet 2025',
    description: 'Track, field and relay events scheduled on 25 May at the Main Sports Complex.',
    date: '25 May 2025',
    category: 'sports',
    isNew: true,
  },
  {
    id: 'n-2',
    title: 'Summer Vacation Circular',
    description: 'School campus will remain closed for summer break from 1 June. Holiday homework uploaded.',
    date: '1 Jun 2025',
    category: 'holiday',
  },
  {
    id: 'n-3',
    title: 'Parent-Teacher Meeting',
    description: 'Term review meeting scheduled on 30 May. Slot bookings available via Parent Portal.',
    date: '30 May 2025',
    category: 'meeting',
  },
  {
    id: 'n-4',
    title: 'Half-Yearly Examination Timetable',
    description: 'Detailed subject-wise date sheet and hall timings for upcoming term assessments.',
    date: '10 Jun 2025',
    category: 'exam',
  },
]

function getCategoryMeta(cat: NoticeItem['category']) {
  switch (cat) {
    case 'sports':
      return { icon: Trophy, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'holiday':
      return { icon: Sun, color: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'meeting':
      return { icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'exam':
      return { icon: Calendar, color: 'bg-purple-50 text-purple-700 border-purple-200' }
  }
}

export function StudentNoticesCard() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Latest Notices</h3>
              <p className="text-[11px] text-slate-400">Campus Circulars &amp; Updates</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Official
          </span>
        </div>

        {/* Notices List */}
        <div className="divide-y divide-slate-100 my-2">
          {NOTICES.map((notice) => {
            const meta = getCategoryMeta(notice.category)
            const Icon = meta.icon
            return (
              <div
                key={notice.id}
                className="py-3 first:pt-2 last:pb-2 group/item hover:bg-slate-50/70 -mx-2 px-2 rounded-xl transition"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg ${meta.color} border flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 group-hover/item:text-blue-700 transition-colors truncate">
                        {notice.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {notice.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                      {notice.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-slate-100">
        <Link
          href="/erp/student"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 transition group cursor-pointer"
        >
          <span>View All Announcements</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
