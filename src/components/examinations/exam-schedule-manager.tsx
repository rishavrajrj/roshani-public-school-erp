'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Examination, ExamSchedule, ScheduleConflict } from '@/types/examination'
import { Button } from '@/components/ui/button'
import { createExamScheduleAction } from '@/lib/examinations/actions'

interface Props {
  examinations: Examination[]
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string; code: string }>
  schedules: ExamSchedule[]
  invigilatorOptions: Array<{ id: string; name: string; email: string }>
  isManagementAllowed: boolean
}

export function ExamScheduleManager({
  examinations,
  classes,
  subjects,
  schedules,
  invigilatorOptions,
  isManagementAllowed,
}: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    examinationId: examinations[0]?.id || '',
    classId: classes[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00',
    durationMinutes: 180,
    venue: 'Main Campus',
    room: 'Hall A',
    maximumMarks: 100,
    passingMarks: 33,
    invigilatorProfileIds: [] as string[],
  })

  const [loading, setLoading] = useState(false)
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setConflicts([])
    setErrorMsg(null)
    setSuccessMsg(null)

    const res = await createExamScheduleAction({
      examinationId: form.examinationId,
      classId: form.classId,
      subjectId: form.subjectId,
      examDate: form.examDate,
      startTime: form.startTime,
      endTime: form.endTime,
      durationMinutes: form.durationMinutes,
      venue: form.venue,
      room: form.room,
      maximumMarks: form.maximumMarks,
      passingMarks: form.passingMarks,
      invigilatorProfileIds: form.invigilatorProfileIds,
    })

    setLoading(false)
    if (res.success) {
      setSuccessMsg('Schedule entry created successfully!')
      router.refresh()
    } else {
      setErrorMsg(res.error || 'Failed to create schedule')
      if (res.conflicts) {
        setConflicts(res.conflicts as ScheduleConflict[])
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Schedule Form */}
      {isManagementAllowed && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Add Schedule Entry</h3>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-300 space-y-2">
              <h4 className="text-xs font-bold text-rose-900 uppercase">Server Schedule Conflicts Detected ({conflicts.length})</h4>
              <ul className="space-y-1 text-xs text-rose-800 list-disc pl-4">
                {conflicts.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleCreateSchedule} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Examination</label>
              <select
                value={form.examinationId}
                onChange={(e) => setForm({ ...form, examinationId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              >
                {examinations.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.academicSessionName})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                <select
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={form.examDate}
                  onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Room / Hall</label>
                <input
                  type="text"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  placeholder="e.g. Hall 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  min={1}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Invigilator(s)</label>
              <select
                multiple
                value={form.invigilatorProfileIds}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions).map(o => o.value)
                  setForm({ ...form, invigilatorProfileIds: opts })
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs h-24"
              >
                {invigilatorOptions.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.name} ({inv.email})</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400">Hold Ctrl / Cmd to select multiple invigilators</span>
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Create Schedule Entry
            </Button>
          </form>
        </div>
      )}

      {/* Schedules Table */}
      <div className={['bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-6', isManagementAllowed ? 'lg:col-span-2' : 'lg:col-span-3'].join(' ')}>
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Examination Timetable</h3>
            <p className="text-xs text-slate-500">All scheduled subject exam sessions and invigilator assignments</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {schedules.length} Timetable Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Marks</th>
                <th className="py-3 px-4">Invigilator(s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No examination schedules configured yet.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.examDate}</div>
                      <div className="text-xs text-slate-500 font-mono">{s.startTime} - {s.endTime} ({s.durationMinutes}m)</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {s.className} {s.sectionName ? `(${s.sectionName})` : ''}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {s.subjectName} <span className="font-mono text-xs text-slate-500">({s.subjectCode})</span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {s.room || 'Main Hall'}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-900">
                      {s.passingMarks} / {s.maximumMarks}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {s.invigilators && s.invigilators.length > 0 ? (
                        s.invigilators.map(i => i.invigilatorName).join(', ')
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
