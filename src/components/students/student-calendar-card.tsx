import React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'

interface CalendarEvent {
  day: number
  type: 'exam' | 'holiday' | 'event'
  title: string
}

export function StudentCalendarCard() {
  const today = new Date()
  const currentMonthName = today.toLocaleString('default', { month: 'long' })
  const currentYear = today.getFullYear()
  const currentDay = today.getDate()

  // Sample academic schedule for current view
  const events: CalendarEvent[] = [
    { day: 15, type: 'event', title: 'Independence Day Observance' },
    { day: 22, type: 'exam', title: 'Periodic Test — Science' },
    { day: 26, type: 'holiday', title: 'Institutional Holiday' },
    { day: 29, type: 'exam', title: 'Periodic Test — Mathematics' },
  ]

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  
  // Basic 31 days grid layout for display
  const daysInMonth = 31
  // Start offset (e.g. Saturday = index 5)
  const startDayOffset = 5

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: startDayOffset }, (_, i) => i)

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-600 shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Calendar</h3>
              <p className="text-[11px] text-slate-400">
                {currentMonthName} {currentYear}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
            Term 1
          </span>
        </div>

        {/* Days of Week Row */}
        <div className="grid grid-cols-7 gap-1 text-center mt-3 mb-1">
          {daysOfWeek.map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-slate-400">
              {d}
            </span>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center py-1">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="h-7 w-7 mx-auto" />
          ))}
          {days.map((day) => {
            const isToday = day === currentDay
            const event = events.find((e) => e.day === day)

            let eventDotClass = ''
            if (event) {
              if (event.type === 'exam') eventDotClass = 'bg-amber-500'
              else if (event.type === 'holiday') eventDotClass = 'bg-rose-500'
              else if (event.type === 'event') eventDotClass = 'bg-blue-500'
            }

            return (
              <div
                key={`day-${day}`}
                className={`relative h-7 w-7 mx-auto rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition ${
                  isToday
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title={event ? `${event.title} (${event.type})` : undefined}
              >
                <span>{day}</span>
                {event && !isToday && (
                  <span
                    className={`absolute bottom-0.5 w-1 h-1 rounded-full ${eventDotClass}`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Upcoming Highlight */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100/90 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Periodic Test — Science
            </span>
            <span className="text-slate-400 font-mono text-[10px]">22 Aug</span>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Exam
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Holiday
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Event
        </span>
      </div>
    </div>
  )
}
