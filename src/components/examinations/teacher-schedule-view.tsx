'use client'

import type { ExamSchedule } from '@/types/examination'

interface Props {
  schedules: ExamSchedule[]
}

export function TeacherScheduleView({ schedules }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Exam Invigilator Duties</h2>
          <p className="text-xs text-slate-500 mt-1">Examinations and duties assigned to you for supervision</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
          {schedules.length} Assigned Duty Sessions
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <th className="py-3 px-4">Exam & Date</th>
              <th className="py-3 px-4">Timings</th>
              <th className="py-3 px-4">Class / Section</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Room</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No invigilator duties assigned to you at present.
                </td>
              </tr>
            ) : (
              schedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-4 px-4 font-bold text-slate-900">
                    <div>{s.examinationName || 'Examination'}</div>
                    <div className="text-xs font-normal text-slate-500 mt-0.5">{s.examDate}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs font-bold text-blue-700">
                    {s.startTime} - {s.endTime} ({s.durationMinutes} mins)
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-900">
                    {s.className} {s.sectionName ? `(${s.sectionName})` : ''}
                  </td>
                  <td className="py-4 px-4 font-medium">
                    {s.subjectName} ({s.subjectCode})
                  </td>
                  <td className="py-4 px-4 text-xs font-mono font-bold text-slate-800">
                    {s.room || 'Main Hall'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
