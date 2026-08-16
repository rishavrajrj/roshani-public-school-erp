'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Examination, ExamType, ExamSchedule } from '@/types/examination'
import { Button } from '@/components/ui/button'
import {
  createExamTypeAction,
  createExaminationAction,
  cancelExaminationAction,
  publishExaminationAction,
  configureExamClassesAction,
  configureSubjectMarkingAction,
} from '@/lib/examinations/actions'
import { ExamScheduleManager } from './exam-schedule-manager'

interface Props {
  examinations: Examination[]
  examTypes: ExamType[]
  academicSessions: Array<{ id: string; name: string }>
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string; code: string }>
  schedules: ExamSchedule[]
  invigilatorOptions: Array<{ id: string; name: string; email: string }>
  userRoles: string[]
}

export function ExamMasterDashboard({
  examinations,
  examTypes,
  academicSessions,
  classes,
  subjects,
  schedules,
  invigilatorOptions,
  userRoles,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'exams' | 'types' | 'schedule' | 'marking'>('exams')
  
  // Modals & forms state
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showExamModal, setShowExamModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')

  // Form states
  const [typeForm, setTypeForm] = useState({ code: '', name: '', description: '' })
  const [examForm, setExamForm] = useState({
    academicSessionId: academicSessions[0]?.id || '',
    examTypeId: examTypes[0]?.id || '',
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: '',
  })

  // Class & Subject marking config states
  const [selectedExamForClasses, setSelectedExamForClasses] = useState<string>(examinations[0]?.id || '')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  
  const [markingForm, setMarkingForm] = useState({
    examinationId: examinations[0]?.id || '',
    classId: classes[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    maximumMarks: 100,
    passingMarks: 33,
    theoryMarks: 70,
    practicalMarks: 20,
    internalMarks: 10,
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isManagementAllowed = userRoles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))

  // Handlers
  const handleCreateExamType = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const res = await createExamTypeAction(typeForm)
    setLoading(false)
    if (res.success) {
      setShowTypeModal(false)
      setTypeForm({ code: '', name: '', description: '' })
      setMessage({ type: 'success', text: 'Exam type created successfully' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to create exam type' })
    }
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const res = await createExaminationAction(examForm)
    setLoading(false)
    if (res.success) {
      setShowExamModal(false)
      setMessage({ type: 'success', text: 'Examination master created successfully' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to create examination' })
    }
  }

  const handlePublishExam = async (examId: string) => {
    setLoading(true)
    setMessage(null)
    const res = await publishExaminationAction({ examinationId: examId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Examination published successfully' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to publish examination' })
    }
  }

  const handleCancelExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExamId) return
    setLoading(true)
    setMessage(null)
    const res = await cancelExaminationAction({ examinationId: selectedExamId, reason: cancellationReason })
    setLoading(false)
    if (res.success) {
      setShowCancelModal(false)
      setCancellationReason('')
      setMessage({ type: 'success', text: 'Examination cancelled' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to cancel examination' })
    }
  }

  const handleSaveExamClasses = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExamForClasses || selectedClassIds.length === 0) return
    setLoading(true)
    setMessage(null)
    const res = await configureExamClassesAction({ examinationId: selectedExamForClasses, classIds: selectedClassIds })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Applicable classes configured successfully' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to configure classes' })
    }
  }

  const handleSaveMarkingRule = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const res = await configureSubjectMarkingAction(markingForm)
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Subject marking rule configured successfully' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to save marking rule' })
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'published':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">Published</span>
      case 'scheduled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">Scheduled</span>
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-800">In Progress</span>
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-800">Completed</span>
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800">Cancelled</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">Draft</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Examination Master</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Configure exam types, schedules, subjects, marking rules, and conflict-free timetables
          </p>
        </div>
        {isManagementAllowed && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowTypeModal(true)}>
              + New Exam Type
            </Button>
            <Button variant="primary" onClick={() => setShowExamModal(true)}>
              + Create Examination
            </Button>
          </div>
        )}
      </div>

      {/* Global Alert Message */}
      {message && (
        <div className={['p-4 rounded-lg text-sm font-medium border', message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'].join(' ')}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-4">
        {[
          { id: 'exams', label: 'Examinations Master' },
          { id: 'types', label: 'Exam Types' },
          { id: 'schedule', label: 'Schedule Builder & Conflicts' },
          { id: 'marking', label: 'Subject Marking Rules' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={['py-3 px-4 text-sm font-semibold border-b-2 transition-colors', activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EXAMINATIONS MASTER LIST */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">All Examinations</h3>
              <span className="text-xs font-semibold text-slate-500">{examinations.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-6">Exam Name</th>
                    <th className="py-3 px-6">Code</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Session</th>
                    <th className="py-3 px-6">Dates</th>
                    <th className="py-3 px-6">Classes</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {examinations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No examinations created yet. Click &quot;+ Create Examination&quot; to get started.
                      </td>
                    </tr>
                  ) : (
                    examinations.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6 font-bold text-slate-900">{e.name}</td>
                        <td className="py-4 px-6 font-mono text-slate-600">{e.code}</td>
                        <td className="py-4 px-6">{e.examTypeName || 'Standard'}</td>
                        <td className="py-4 px-6">{e.academicSessionName}</td>
                        <td className="py-4 px-6 text-xs">{e.startDate} to {e.endDate}</td>
                        <td className="py-4 px-6 text-xs">
                          {e.classes && e.classes.length > 0 ? (
                            e.classes.map(c => c.className).join(', ')
                          ) : (
                            <span className="text-rose-500">None configured</span>
                          )}
                        </td>
                        <td className="py-4 px-6">{getStatusBadge(e.status)}</td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {isManagementAllowed && e.status !== 'published' && e.status !== 'cancelled' && e.status !== 'completed' && (
                            <Button variant="secondary" size="sm" onClick={() => handlePublishExam(e.id)} isLoading={loading}>
                              Publish
                            </Button>
                          )}
                          {isManagementAllowed && e.status !== 'completed' && e.status !== 'cancelled' && (
                            <Button variant="secondary" size="sm" onClick={() => { setSelectedExamId(e.id); setShowCancelModal(true) }}>
                              Cancel
                            </Button>
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
      )}

      {/* TAB 2: EXAM TYPES */}
      {activeTab === 'types' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Configured Examination Types</h3>
            <span className="text-xs font-semibold text-slate-500">{examTypes.length} types</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-6">Code</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {examTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-mono font-bold text-slate-900">{t.code}</td>
                    <td className="py-3 px-6 font-semibold">{t.name}</td>
                    <td className="py-3 px-6 text-slate-500 text-xs">{t.description || '—'}</td>
                    <td className="py-3 px-6">
                      <span className={['px-2 py-0.5 rounded text-xs font-bold uppercase', t.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'].join(' ')}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULE BUILDER & CONFLICTS */}
      {activeTab === 'schedule' && (
        <ExamScheduleManager
          examinations={examinations}
          classes={classes}
          subjects={subjects}
          schedules={schedules}
          invigilatorOptions={invigilatorOptions}
          isManagementAllowed={isManagementAllowed}
        />
      )}

      {/* TAB 4: SUBJECT MARKING RULES */}
      {activeTab === 'marking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Configure Marking Structure</h3>
            <form onSubmit={handleSaveMarkingRule} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Examination</label>
                <select
                  value={markingForm.examinationId}
                  onChange={(e) => setMarkingForm({ ...markingForm, examinationId: e.target.value })}
                  disabled={examinations.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                  required
                >
                  <option value="">{examinations.length === 0 ? 'No examinations available' : 'Select Examination'}</option>
                  {examinations.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                <select
                  value={markingForm.classId}
                  onChange={(e) => setMarkingForm({ ...markingForm, classId: e.target.value })}
                  disabled={classes.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                  required
                >
                  <option value="">{classes.length === 0 ? 'No classes available' : 'Select Class'}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                <select
                  value={markingForm.subjectId}
                  onChange={(e) => setMarkingForm({ ...markingForm, subjectId: e.target.value })}
                  disabled={subjects.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                  required
                >
                  <option value="">{subjects.length === 0 ? 'No subjects available' : 'Select Subject'}</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Marks (*)</label>
                  <input
                    type="number"
                    value={markingForm.maximumMarks}
                    onChange={(e) => setMarkingForm({ ...markingForm, maximumMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Passing Marks (*)</label>
                  <input
                    type="number"
                    value={markingForm.passingMarks}
                    onChange={(e) => setMarkingForm({ ...markingForm, passingMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs text-slate-500">Theory</label>
                  <input
                    type="number"
                    value={markingForm.theoryMarks}
                    onChange={(e) => setMarkingForm({ ...markingForm, theoryMarks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Practical</label>
                  <input
                    type="number"
                    value={markingForm.practicalMarks}
                    onChange={(e) => setMarkingForm({ ...markingForm, practicalMarks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Internal</label>
                  <input
                    type="number"
                    value={markingForm.internalMarks}
                    onChange={(e) => setMarkingForm({ ...markingForm, internalMarks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    min={0}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" isLoading={loading}>
                Save Subject Marking Rule
              </Button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Configure Applicable Classes for Exam</h3>
            <form onSubmit={handleSaveExamClasses} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Examination Master</label>
                <select
                  value={selectedExamForClasses}
                  onChange={(e) => setSelectedExamForClasses(e.target.value)}
                  disabled={examinations.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500"
                  required
                >
                  <option value="">{examinations.length === 0 ? 'No examinations available' : 'Select Examination Master'}</option>
                  {examinations.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.academicSessionName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Check Applicable Classes</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {classes.map((c) => {
                    const isChecked = selectedClassIds.includes(c.id)
                    return (
                      <label key={c.id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClassIds([...selectedClassIds, c.id])
                            } else {
                              setSelectedClassIds(selectedClassIds.filter((id) => id !== c.id))
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{c.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <Button type="submit" isLoading={loading}>
                Save Applicable Classes
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: NEW EXAM TYPE */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Examination Type</h3>
            <form onSubmit={handleCreateExamType} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Code (Unique Short Name)</label>
                <input
                  type="text"
                  value={typeForm.code}
                  onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. UT, PT, HY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  placeholder="e.g. Unit Test"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowTypeModal(false)}>Cancel</Button>
                <Button type="submit" isLoading={loading}>Create Type</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE EXAMINATION MASTER */}
      {showExamModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Examination Master</h3>
            <form onSubmit={handleCreateExam} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Session</label>
                  <select
                    value={examForm.academicSessionId}
                    onChange={(e) => setExamForm({ ...examForm, academicSessionId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  >
                    <option value="">{academicSessions.length === 0 ? 'No academic sessions configured' : 'Select Academic Session'}</option>
                    {academicSessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Type</label>
                  <select
                    value={examForm.examTypeId}
                    onChange={(e) => setExamForm({ ...examForm, examTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  >
                    <option value="">{examTypes.length === 0 ? 'No exam types configured' : 'Select Exam Type'}</option>
                    {examTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Code</label>
                  <input
                    type="text"
                    value={examForm.code}
                    onChange={(e) => setExamForm({ ...examForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. HY-2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Exam Title</label>
                  <input
                    type="text"
                    value={examForm.name}
                    onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                    placeholder="e.g. Half-Yearly Examination 2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={examForm.startDate}
                    onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={examForm.endDate}
                    onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Guidelines</label>
                <textarea
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowExamModal(false)}>Cancel</Button>
                <Button type="submit" isLoading={loading}>Create Examination</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL EXAMINATION */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-rose-900">Cancel Examination</h3>
            <p className="text-xs text-slate-500">
              Cancelling an examination will mark the exam and all its active schedules as cancelled. This action is recorded in the audit log.
            </p>
            <form onSubmit={handleCancelExam} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cancellation Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={3}
                  placeholder="State the explicit reason for cancellation..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowCancelModal(false)}>Back</Button>
                <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white" isLoading={loading}>
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
