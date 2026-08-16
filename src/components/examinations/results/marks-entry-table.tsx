'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StudentMark } from '@/types/result'
import type { Examination } from '@/types/examination'
import { Button } from '@/components/ui/button'
import {
  saveMarksAction,
  submitMarksAction,
  correctSubmittedMarkAction,
  lockMarksAction,
  unlockMarksAction,
} from '@/lib/examinations/result-actions'

interface Props {
  examinations: Examination[]
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string; code: string }>
  initialMarks: StudentMark[]
  userRoles: string[]
}

export function MarksEntryTable({
  examinations,
  classes,
  subjects,
  initialMarks,
  userRoles,
}: Props) {
  const router = useRouter()
  const [selectedExamId, setSelectedExamId] = useState<string>(examinations[0]?.id || '')
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '')

  // Marks state for editing
  const [marksState, setMarksState] = useState<StudentMark[]>(initialMarks)

  // Correction modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [correctionMark, setCorrectionMark] = useState<StudentMark | null>(null)
  const [correctionReason, setCorrectionReason] = useState('')

  // Unlock modal
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockReason, setUnlockReason] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isAdminOrPrincipal = userRoles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))

  // Update mark field locally
  const handleMarkChange = (studentId: string, field: keyof StudentMark, value: any) => {
    setMarksState((prev) =>
      prev.map((m) => {
        if (m.studentId === studentId) {
          const updated = { ...m, [field]: value }
          if (field === 'attendanceStatus' && value !== 'present') {
            updated.theoryMarksObtained = 0
            updated.practicalMarksObtained = 0
            updated.internalMarksObtained = 0
            updated.totalMarksObtained = 0
          } else if (['theoryMarksObtained', 'practicalMarksObtained', 'internalMarksObtained'].includes(field as string)) {
            updated.totalMarksObtained = (Number(updated.theoryMarksObtained) || 0) + (Number(updated.practicalMarksObtained) || 0) + (Number(updated.internalMarksObtained) || 0)
          }
          return updated
        }
        return m
      })
    )
  }

  // Handlers
  const handleSaveBatchMarks = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId || marksState.length === 0) return
    setLoading(true)
    setMessage(null)

    const payload = {
      examinationId: selectedExamId,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      marks: marksState.map((m) => ({
        examinationId: selectedExamId,
        studentId: m.studentId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        attendanceStatus: m.attendanceStatus,
        theoryMarksObtained: Number(m.theoryMarksObtained) || 0,
        practicalMarksObtained: Number(m.practicalMarksObtained) || 0,
        internalMarksObtained: Number(m.internalMarksObtained) || 0,
      })),
    }

    const res = await saveMarksAction(payload)
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: `Draft marks saved successfully for ${res.count} students` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to save marks' })
    }
  }

  const handleSubmitMarks = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) return
    setLoading(true)
    setMessage(null)

    const res = await submitMarksAction({
      examinationId: selectedExamId,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
    })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Subject marks submitted successfully. Marks are now submitted.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to submit marks' })
    }
  }

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correctionMark || !correctionMark.id) return
    setLoading(true)
    setMessage(null)

    const res = await correctSubmittedMarkAction({
      markId: correctionMark.id,
      attendanceStatus: correctionMark.attendanceStatus,
      theoryMarksObtained: Number(correctionMark.theoryMarksObtained) || 0,
      practicalMarksObtained: Number(correctionMark.practicalMarksObtained) || 0,
      internalMarksObtained: Number(correctionMark.internalMarksObtained) || 0,
      reason: correctionReason,
    })

    setLoading(false)
    if (res.success) {
      setShowCorrectionModal(false)
      setCorrectionReason('')
      setCorrectionMark(null)
      setMessage({ type: 'success', text: 'Mark correction recorded with audit trail' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to correct mark' })
    }
  }

  const handleLockMarks = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) return
    setLoading(true)
    setMessage(null)
    const res = await lockMarksAction({
      examinationId: selectedExamId,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
    })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Marks locked for this subject' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to lock marks' })
    }
  }

  const handleUnlockMarks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) return
    setLoading(true)
    setMessage(null)

    const res = await unlockMarksAction({
      examinationId: selectedExamId,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      reason: unlockReason,
    })

    setLoading(false)
    if (res.success) {
      setShowUnlockModal(false)
      setUnlockReason('')
      setMessage({ type: 'success', text: 'Marks unlocked' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to unlock marks' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">Subject Marks Entry Spreadsheet</h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5 font-medium">
            Input, verify, and submit subject component marks (Theory, Practical, Internal)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleSaveBatchMarks} isLoading={loading}>
            💾 Save Draft Marks
          </Button>
          <Button variant="primary" onClick={handleSubmitMarks} isLoading={loading}>
            🚀 Submit Class Marks
          </Button>
          {isAdminOrPrincipal && (
            <Button variant="secondary" className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleLockMarks} isLoading={loading}>
              🔒 Lock Marks
            </Button>
          )}
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={['p-4 rounded-xl text-xs sm:text-sm font-semibold border shadow-2xs', message.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'].join(' ')}>
          {message.text}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 font-mono">Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            disabled={examinations.length === 0}
            className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg text-xs sm:text-sm font-medium focus:border-[#1554C0] focus:ring-2 focus:ring-blue-600/15 disabled:bg-slate-100 disabled:text-slate-500 shadow-2xs"
          >
            <option value="">{examinations.length === 0 ? 'No examinations available' : 'Select Examination'}</option>
            {examinations.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.academicSessionName})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 font-mono">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={classes.length === 0}
            className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg text-xs sm:text-sm font-medium focus:border-[#1554C0] focus:ring-2 focus:ring-blue-600/15 disabled:bg-slate-100 disabled:text-slate-500 shadow-2xs"
          >
            <option value="">{classes.length === 0 ? 'No classes available' : 'Select Class'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 font-mono">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={subjects.length === 0}
            className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg text-xs sm:text-sm font-medium focus:border-[#1554C0] focus:ring-2 focus:ring-blue-600/15 disabled:bg-slate-100 disabled:text-slate-500 shadow-2xs"
          >
            <option value="">{subjects.length === 0 ? 'No subjects available' : 'Select Subject'}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Class Student Roster Marks</h3>
          <span className="text-xs font-bold text-slate-600 font-mono">{marksState.length} Students</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Adm No</th>
                <th className="py-3.5 px-4">Attendance</th>
                <th className="py-3.5 px-4 text-center">Theory</th>
                <th className="py-3.5 px-4 text-center">Practical</th>
                <th className="py-3.5 px-4 text-center">Internal</th>
                <th className="py-3.5 px-4 text-center font-extrabold">Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900 font-medium">
              {marksState.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                    No students enrolled in this class session.
                  </td>
                </tr>
              ) : (
                marksState.map((m) => {
                  const isLocked = m.status === 'locked'
                  const isSubmitted = m.status === 'submitted' || m.status === 'verified' || isLocked
                  return (
                    <tr key={m.studentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{m.studentName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{m.admissionNumber}</td>
                      <td className="py-3 px-4">
                        <select
                          value={m.attendanceStatus}
                          disabled={isSubmitted}
                          onChange={(e) => handleMarkChange(m.studentId, 'attendanceStatus', e.target.value)}
                          className="px-2 py-1 border border-slate-300 bg-white text-slate-900 rounded text-xs font-semibold shadow-2xs"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                          <option value="not_appeared">Not Appeared</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={m.theoryMarksObtained}
                          disabled={isSubmitted || m.attendanceStatus !== 'present'}
                          onChange={(e) => handleMarkChange(m.studentId, 'theoryMarksObtained', Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-slate-300 bg-white text-slate-900 rounded text-center text-xs font-mono font-bold shadow-2xs"
                          min={0}
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={m.practicalMarksObtained}
                          disabled={isSubmitted || m.attendanceStatus !== 'present'}
                          onChange={(e) => handleMarkChange(m.studentId, 'practicalMarksObtained', Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-slate-300 bg-white text-slate-900 rounded text-center text-xs font-mono font-bold shadow-2xs"
                          min={0}
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={m.internalMarksObtained}
                          disabled={isSubmitted || m.attendanceStatus !== 'present'}
                          onChange={(e) => handleMarkChange(m.studentId, 'internalMarksObtained', Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-slate-300 bg-white text-slate-900 rounded text-center text-xs font-mono font-bold shadow-2xs"
                          min={0}
                        />
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-extrabold text-indigo-900 text-sm">
                        {m.totalMarksObtained} / {m.maximumMarks || 100}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={['px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase font-mono shadow-2xs border', m.status === 'locked' ? 'bg-purple-100 text-purple-900 border-purple-300' : m.status === 'submitted' ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-amber-100 text-amber-900 border-amber-300'].join(' ')}>
                          {m.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        {isSubmitted && !isLocked && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setCorrectionMark(m); setShowCorrectionModal(true) }}
                          >
                            Correct Mark
                          </Button>
                        )}
                        {isLocked && isAdminOrPrincipal && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowUnlockModal(true)}
                          >
                            Unlock
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: POST-SUBMISSION MARK CORRECTION */}
      {showCorrectionModal && correctionMark && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Post-Submission Mark Correction</h3>
            <p className="text-xs text-slate-500">
              Student: <span className="font-bold text-slate-900">{correctionMark.studentName}</span> ({correctionMark.admissionNumber})
            </p>
            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-600">Theory</label>
                  <input
                    type="number"
                    value={correctionMark.theoryMarksObtained}
                    onChange={(e) => setCorrectionMark({ ...correctionMark, theoryMarksObtained: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Practical</label>
                  <input
                    type="number"
                    value={correctionMark.practicalMarksObtained}
                    onChange={(e) => setCorrectionMark({ ...correctionMark, practicalMarksObtained: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Internal</label>
                  <input
                    type="number"
                    value={correctionMark.internalMarksObtained}
                    onChange={(e) => setCorrectionMark({ ...correctionMark, internalMarksObtained: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correction Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  rows={3}
                  placeholder="State the explicit correction reason (min 3 chars), e.g. Rechecked answer script..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowCorrectionModal(false)}>Cancel</Button>
                <Button type="submit" isLoading={loading}>Save Correction</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UNLOCK MARKS */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Administrative Marks Unlock</h3>
            <form onSubmit={handleUnlockMarks} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unlock Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  rows={3}
                  placeholder="Provide official unlock reason..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowUnlockModal(false)}>Cancel</Button>
                <Button type="submit" isLoading={loading}>Unlock Marks</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
