'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { assignTeacherAction, deactivateTeacherAssignmentAction } from '@/lib/attendance/actions'

interface Props {
  currentSessionId: string
  currentSessionName: string
  teachers: Array<{ id: string; full_name: string }>
  classes: Array<{ id: string; name: string; sections: Array<{ id: string; name: string }> }>
  assignments: any[]
}

export function TeacherAssignmentManager({
  currentSessionId,
  currentSessionName,
  teachers,
  classes,
  assignments,
}: Props) {
  const router = useRouter()
  const [teacherId, setTeacherId] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedClass = classes.find((c) => c.id === classId)
  const availableSections = selectedClass ? selectedClass.sections : []

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!teacherId || !classId || !sectionId || !currentSessionId) {
      setError('Please select all required fields.')
      return
    }

    setIsSubmitting(true)
    const res = await assignTeacherAction({
      teacherProfileId: teacherId,
      academicSessionId: currentSessionId,
      classId,
      sectionId,
    })
    setIsSubmitting(false)

    if (!res.success) {
      setError(res.error || 'Failed to assign teacher.')
    } else {
      setSuccess('Teacher assigned successfully.')
      setTeacherId('')
      setClassId('')
      setSectionId('')
      router.refresh()
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this teacher assignment?')) return
    setError(null)
    const res = await deactivateTeacherAssignmentAction(id)
    if (!res.success) {
      setError(res.error || 'Failed to remove assignment.')
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      {/* Assignment Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          New Section Assignment ({currentSessionName})
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
            {success}
          </div>
        )}

        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Teacher *
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Class *
            </label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setSectionId('')
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Section *
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!classId}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              required
            >
              <option value="">-- Choose Section --</option>
              {availableSections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Teacher'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-semibold text-slate-900">Active Teacher Assignments</h2>
          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full">
            {assignments.length} Assigned
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No active teacher assignments found for this session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3">Teacher</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3">Section</th>
                  <th className="px-6 py-3">Academic Session</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{a.teacherName}</td>
                    <td className="px-6 py-4">{a.className}</td>
                    <td className="px-6 py-4">Section {a.sectionName}</td>
                    <td className="px-6 py-4">{a.sessionName}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeactivate(a.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
