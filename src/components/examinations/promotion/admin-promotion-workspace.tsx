'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PromotionRecord, PromotionEvaluationResult } from '@/types/promotion'
import type { Examination } from '@/types/examination'
import { Button } from '@/components/ui/button'
import {
  evaluateClassPromotionAction,
  recommendPromotionAction,
  batchRecommendPromotionsAction,
  approvePromotionAction,
  executePromotionAction,
  executeBulkPromotionsAction,
  updateStudentStatusLifecycleAction,
} from '@/lib/examinations/promotion-actions'

interface Props {
  sessions: Array<{ id: string; name: string }>
  classes: Array<{ id: string; name: string }>
  examinations: Examination[]
  existingRecords: PromotionRecord[]
  userRoles: string[]
}

export function AdminPromotionWorkspace({
  sessions,
  classes,
  examinations,
  existingRecords,
  userRoles,
}: Props) {
  const router = useRouter()
  const [sourceSessionId, setSourceSessionId] = useState<string>(sessions[0]?.id || '')
  const [targetSessionId, setTargetSessionId] = useState<string>(sessions[1]?.id || sessions[0]?.id || '')
  const [selectedExamId, setSelectedExamId] = useState<string>(examinations[0]?.id || '')
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')

  const [evaluations, setEvaluations] = useState<PromotionEvaluationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Lifecycle modal
  const [showLifecycleModal, setShowLifecycleModal] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [lifecycleStatus, setLifecycleStatus] = useState<'transferred' | 'withdrawn' | 'graduated' | 'expelled'>('transferred')
  const [lifecycleReason, setLifecycleReason] = useState('')

  const isManagementAllowed = userRoles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))

  // Evaluate class candidates
  const handleEvaluateClass = async () => {
    if (!sourceSessionId || !selectedExamId || !selectedClassId) return
    setLoading(true)
    setMessage(null)

    const res = await evaluateClassPromotionAction(sourceSessionId, selectedExamId, selectedClassId)
    setLoading(false)
    if (res.success && res.data) {
      setEvaluations(res.data)
      setMessage({ type: 'success', text: `Evaluated ${res.data.length} student promotion candidates based on final exam results & policy.` })
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to evaluate class promotion' })
    }
  }

  // Batch Recommend
  const handleBatchRecommend = async () => {
    if (evaluations.length === 0 || !sourceSessionId || !targetSessionId || !selectedClassId) return
    setLoading(true)
    setMessage(null)

    const recommendations = evaluations.map(ev => ({
      studentId: ev.studentId,
      sourceAcademicHistoryId: ev.sourceAcademicHistoryId,
      sourceAcademicSessionId: sourceSessionId,
      targetAcademicSessionId: targetSessionId,
      sourceClassId: selectedClassId,
      targetClassId: ev.targetClassId || selectedClassId,
      sourceResultId: ev.resultId,
      decision: ev.recommendedDecision,
      conditional: ev.recommendedDecision === 'CONDITIONAL_PROMOTION',
      reason: `Evaluated automatically based on Exam Result: ${ev.overallResultStatus} (${ev.percentage}%)`,
    }))

    const res = await batchRecommendPromotionsAction({
      sourceAcademicSessionId: sourceSessionId,
      targetAcademicSessionId: targetSessionId,
      sourceClassId: selectedClassId,
      recommendations,
    })

    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: `Recorded ${res.count} promotion recommendations` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to record promotion recommendations' })
    }
  }

  // Single Approve
  const handleApproveRecord = async (recordId: string) => {
    setLoading(true)
    setMessage(null)
    const res = await approvePromotionAction({ promotionRecordId: recordId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Promotion recommendation approved' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to approve promotion' })
    }
  }

  // Single Execute Atomic RPC
  const handleExecuteRecord = async (recordId: string) => {
    setLoading(true)
    setMessage(null)
    const res = await executePromotionAction({ promotionRecordId: recordId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Promotion executed atomically. Previous history marked completed, new target session history created.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to execute promotion' })
    }
  }

  // Bulk Execute
  const handleBulkExecute = async () => {
    const approvedIds = existingRecords.filter(r => r.status === 'approved').map(r => r.id)
    if (approvedIds.length === 0) return
    setLoading(true)
    setMessage(null)

    const res = await executeBulkPromotionsAction({ promotionRecordIds: approvedIds })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: `Executed ${res.count} approved student promotions` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to execute bulk promotions' })
    }
  }

  // Lifecycle Update Handler
  const handleLifecycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) return
    setLoading(true)
    setMessage(null)

    const res = await updateStudentStatusLifecycleAction({
      studentId: selectedStudentId,
      status: lifecycleStatus,
      reason: lifecycleReason,
    })

    setLoading(false)
    if (res.success) {
      setShowLifecycleModal(false)
      setLifecycleReason('')
      setSelectedStudentId(null)
      setMessage({ type: 'success', text: `Student status updated to '${lifecycleStatus}' with audit trail` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to update student lifecycle' })
    }
  }

  const getDecisionBadge = (d: string) => {
    switch (d) {
      case 'PROMOTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">Promoted</span>
      case 'PASSED_OUT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800 font-mono">Passed Out / Graduated</span>
      case 'REPEAT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800">Repeat Required</span>
      case 'SUPPLEMENTARY':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">Supplementary Exam</span>
      case 'CONDITIONAL_PROMOTION':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-100 text-indigo-800">Conditional Promotion</span>
      case 'TRANSFERRED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-800">Transferred</span>
      case 'WITHDRAWN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-800">Withdrawn</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">{d}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Promotion &amp; Session Lifecycle Manager</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Evaluate final results, manage repeats, recommend outcomes, and execute session progression
          </p>
        </div>
        {isManagementAllowed && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleEvaluateClass} isLoading={loading}>
              🔍 Evaluate Candidates
            </Button>
            <Button variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleBatchRecommend} isLoading={loading}>
              📋 Batch Recommend
            </Button>
            <Button variant="primary" onClick={handleBulkExecute} isLoading={loading}>
              ⚡ Execute Approved Promotions
            </Button>
          </div>
        )}
      </div>

      {/* Global Alert */}
      {message && (
        <div className={['p-4 rounded-lg text-sm font-medium border', message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'].join(' ')}>
          {message.text}
        </div>
      )}

      {/* Session & Class Selectors */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Source Session</label>
          <select
            value={sourceSessionId}
            onChange={(e) => setSourceSessionId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Target Next Session</label>
          <select
            value={targetSessionId}
            onChange={(e) => setTargetSessionId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Final Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {examinations.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Source Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION A: EVALUATION CANDIDATE GRID */}
      {evaluations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Evaluated Candidates ({evaluations.length})</h3>
            <span className="text-xs text-slate-500">Based on Authoritative Final Result &amp; Policy</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-center">Result Status</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                  <th className="py-3 px-4 text-center">Failed Subjects</th>
                  <th className="py-3 px-4">Recommended Decision</th>
                  <th className="py-3 px-4">Final Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {evaluations.map((ev) => (
                  <tr key={ev.studentId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {ev.studentName}
                      <span className="block text-xs font-normal text-slate-500">{ev.admissionNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={['px-2 py-0.5 rounded text-xs', ev.overallResultStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'].join(' ')}>
                        {ev.overallResultStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-700">{ev.percentage}%</td>
                    <td className="py-3 px-4 text-center font-mono">{ev.failedSubjectsCount}</td>
                    <td className="py-3 px-4">{getDecisionBadge(ev.recommendedDecision)}</td>
                    <td className="py-3 px-4 text-xs font-semibold">{ev.isFinalClass ? 'Yes (Pass-out)' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION B: PROMOTION RECORDS HISTORY & WORKFLOW TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Recorded Promotion Workflow ({existingRecords.length})</h3>
          <span className="text-xs text-slate-500">Historical Decisions &amp; Execution Queue</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">Student</th>
                <th className="py-3 px-6">Source $\rightarrow$ Target Class</th>
                <th className="py-3 px-6 text-center">Decision</th>
                <th className="py-3 px-6 text-center">Workflow State</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {existingRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No promotion records generated for this session &amp; class filter.
                  </td>
                </tr>
              ) : (
                existingRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {r.studentName}
                      <span className="block text-xs font-normal text-slate-500">{r.admissionNumber}</span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div><span className="font-bold">{r.sourceClassName}</span> ({r.sourceAcademicSessionName})</div>
                      <div className="text-indigo-700">$\rightarrow$ <span className="font-bold">{r.targetClassName || 'N/A'}</span> ({r.targetAcademicSessionName})</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getDecisionBadge(r.decision)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={['px-2.5 py-0.5 rounded-full text-xs font-bold uppercase', r.status === 'executed' ? 'bg-emerald-100 text-emerald-800' : r.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'].join(' ')}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {isManagementAllowed && r.status === 'recommended' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApproveRecord(r.id)}
                          isLoading={loading}
                        >
                          Approve
                        </Button>
                      )}

                      {isManagementAllowed && r.status === 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleExecuteRecord(r.id)}
                          isLoading={loading}
                        >
                          Execute
                        </Button>
                      )}

                      {isManagementAllowed && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setSelectedStudentId(r.studentId); setShowLifecycleModal(true) }}
                        >
                          Lifecycle Event
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

      {/* MODAL: STUDENT DEPARTURE LIFECYCLE UPDATE */}
      {showLifecycleModal && selectedStudentId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Student Departure Lifecycle Update</h3>
            <form onSubmit={handleLifecycleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lifecycle Event</label>
                <select
                  value={lifecycleStatus}
                  onChange={(e: any) => setLifecycleStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="transferred">Transferred Out (TC Issued)</option>
                  <option value="withdrawn">Withdrawn by Parent</option>
                  <option value="graduated">Graduated / Passed Out</option>
                  <option value="expelled">Expelled / Disciplinary Exit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={lifecycleReason}
                  onChange={(e) => setLifecycleReason(e.target.value)}
                  rows={3}
                  placeholder="State the official reason (min 3 chars)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowLifecycleModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={loading}>Record Event</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
