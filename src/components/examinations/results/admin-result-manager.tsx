'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StudentResult } from '@/types/result'
import type { Examination } from '@/types/examination'
import { Button } from '@/components/ui/button'
import {
  calculateClassResultsAction,
  approveResultsAction,
  overrideResultFinancialHoldAction,
  publishResultsAction,
  revokeResultAction,
} from '@/lib/examinations/result-actions'
import { ResultDocument } from './result-document'

interface Props {
  examinations: Examination[]
  classes: Array<{ id: string; name: string }>
  results: StudentResult[]
  userRoles: string[]
}

export function AdminResultManager({
  examinations,
  classes,
  results,
  userRoles,
}: Props) {
  const router = useRouter()
  const [selectedExamId, setSelectedExamId] = useState<string>(examinations[0]?.id || '')
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')

  // Modals state
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null)

  const [overrideReason, setOverrideReason] = useState('')
  const [revokeReason, setRevokeReason] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isManagementAllowed = userRoles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))
  const canSeeFinances = userRoles.some(r => ['Super Admin', 'Admin', 'Principal', 'Accountant'].includes(r))

  // Filter results locally
  const filteredResults = results.filter(r => r.examinationId === selectedExamId && r.classId === selectedClassId)

  // Aggregated stats
  const totalCount = filteredResults.length
  const passCount = filteredResults.filter(r => r.resultStatus === 'PASS').length
  const failCount = filteredResults.filter(r => r.resultStatus === 'FAIL').length
  const blockedCount = filteredResults.filter(r => r.status === 'blocked').length

  // Handlers
  const handleCalculateResults = async () => {
    if (!selectedExamId || !selectedClassId) return
    setLoading(true)
    setMessage(null)

    const res = await calculateClassResultsAction({ examinationId: selectedExamId, classId: selectedClassId })
    setLoading(false)
    if (res.success && res.summary) {
      setMessage({ type: 'success', text: `Class Results Calculated: ${res.summary.passedCount} Passed, ${res.summary.failedCount} Failed, ${res.summary.blockedCount} Financially Blocked` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to calculate class results' })
    }
  }

  const handleApproveResults = async () => {
    if (!selectedExamId || !selectedClassId) return
    setLoading(true)
    setMessage(null)

    const res = await approveResultsAction({ examinationId: selectedExamId, classId: selectedClassId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: `Approved ${res.count} class results` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to approve results' })
    }
  }

  const handleOverrideHold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResult) return
    setLoading(true)
    setMessage(null)

    const res = await overrideResultFinancialHoldAction({ resultId: selectedResult.id, reason: overrideReason })
    setLoading(false)
    if (res.success) {
      setShowOverrideModal(false)
      setOverrideReason('')
      setSelectedResult(null)
      setMessage({ type: 'success', text: 'Result financial hold successfully overridden. Status updated to Override Released.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to override result financial hold' })
    }
  }

  const handlePublishResults = async () => {
    if (!selectedExamId || !selectedClassId) return
    setLoading(true)
    setMessage(null)

    const res = await publishResultsAction({ examinationId: selectedExamId, classId: selectedClassId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: `Published ${res.count} class results. Marks statements are now available on student & parent portals.` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to publish results' })
    }
  }

  const handleRevokeResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResult) return
    setLoading(true)
    setMessage(null)

    const res = await revokeResultAction({ resultId: selectedResult.id, reason: revokeReason })
    setLoading(false)
    if (res.success) {
      setShowRevokeModal(false)
      setRevokeReason('')
      setSelectedResult(null)
      setMessage({ type: 'success', text: 'Result record revoked' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to revoke result' })
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'published':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">Published</span>
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">Approved</span>
      case 'override_released':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-100 text-indigo-800">Override Released</span>
      case 'calculated':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-purple-100 text-purple-800">Calculated</span>
      case 'blocked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800">Financially Blocked</span>
      case 'revoked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-800">Revoked</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">Draft</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Result Calculation &amp; Release Manager</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Calculate subject totals, evaluate pass/fail criteria, approve, and publish official examination results
          </p>
        </div>
        {isManagementAllowed && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleCalculateResults} isLoading={loading}>
              ⚙️ Calculate Class Results
            </Button>
            <Button variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleApproveResults} isLoading={loading}>
              ✓ Approve Results
            </Button>
            <Button variant="primary" onClick={handlePublishResults} isLoading={loading}>
              🚀 Publish Results
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

      {/* Filter Bar & Summary Cards */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {examinations.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.academicSessionName})</option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Class</label>
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

      {/* Summary Scoreboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Total Calculated</span>
          <span className="text-2xl font-bold text-slate-900 font-mono">{totalCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Passed Candidates</span>
          <span className="text-2xl font-bold text-emerald-600 font-mono">{passCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Failed Candidates</span>
          <span className="text-2xl font-bold text-rose-600 font-mono">{failCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Financially Blocked</span>
          <span className="text-2xl font-bold text-amber-600 font-mono">{blockedCount}</span>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Calculated Results Roster</h3>
          <span className="text-xs font-semibold text-slate-500">{filteredResults.length} Candidate Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">Student</th>
                <th className="py-3 px-6">Adm No / Class</th>
                <th className="py-3 px-6 text-center">Marks</th>
                <th className="py-3 px-6 text-center">Percentage</th>
                <th className="py-3 px-6 text-center">Grade</th>
                <th className="py-3 px-6 text-center">Result Status</th>
                {canSeeFinances && <th className="py-3 px-6">Financial Clearance</th>}
                <th className="py-3 px-6">Release Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No results calculated for this examination &amp; class. Click &quot;⚙️ Calculate Class Results&quot; to compute scores.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {r.studentName}
                      {r.financialOverride && (
                        <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                          OVERRIDDEN
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div>{r.admissionNumber}</div>
                      <div className="text-slate-500">{r.className} {r.sectionName ? `(${r.sectionName})` : ''}</div>
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-slate-900">
                      {r.totalMarksObtained} / {r.maximumMarks}
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-indigo-700">
                      {r.percentage}%
                    </td>
                    <td className="py-4 px-6 text-center font-black text-slate-900">
                      {r.grade || '—'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={['px-2.5 py-0.5 rounded text-xs font-black uppercase', r.resultStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'].join(' ')}>
                        {r.resultStatus}
                      </span>
                    </td>
                    {canSeeFinances && (
                      <td className="py-4 px-6 text-xs">
                        <span className={['px-2 py-0.5 rounded font-bold', r.financialClearanceStatus === 'CLEAR' || r.financialClearanceStatus === 'WAIVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'].join(' ')}>
                          {r.financialClearanceStatus} (₹{r.financialOutstandingAmount.toLocaleString('en-IN')})
                        </span>
                      </td>
                    )}
                    <td className="py-4 px-6">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setSelectedResult(r); setShowPrintModal(true) }}
                      >
                        Marksheet
                      </Button>

                      {isManagementAllowed && r.status === 'blocked' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold border-amber-300"
                          onClick={() => { setSelectedResult(r); setShowOverrideModal(true) }}
                        >
                          Override Hold
                        </Button>
                      )}

                      {isManagementAllowed && r.status !== 'revoked' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setSelectedResult(r); setShowRevokeModal(true) }}
                        >
                          Revoke
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

      {/* MODAL 1: ADMINISTRATIVE RESULT FINANCIAL OVERRIDE */}
      {showOverrideModal && selectedResult && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Administrative Result Release Override</h3>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs space-y-2 text-rose-900">
              <p className="font-bold">STUDENT: {selectedResult.studentName} ({selectedResult.admissionNumber})</p>
              <p>Financial Status: <span className="font-bold">{selectedResult.financialClearanceStatus}</span></p>
              <p>Outstanding Fee Balance: <span className="font-bold">₹{selectedResult.financialOutstandingAmount.toLocaleString('en-IN')}</span></p>
              <p className="italic border-t border-rose-200 pt-2 text-[11px] text-rose-700">
                SECURITY WARNING: Overriding this financial hold permits academic result document release ONLY. It does NOT waive fees, alter invoices, or modify the financial ledger.
              </p>
            </div>

            <form onSubmit={handleOverrideHold} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Override Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="Provide explicit justification (min 3 chars), e.g. Management approval for result release..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-white" isLoading={loading}>
                  Authorise Result Override
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REVOKE RESULT */}
      {showRevokeModal && selectedResult && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-rose-900">Revoke Result Record</h3>
            <p className="text-xs text-slate-500">
              Revoking result for <span className="font-bold text-slate-900">{selectedResult.studentName}</span> invalidates the published marks statement.
            </p>
            <form onSubmit={handleRevokeResult} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revocation Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                  placeholder="State the explicit revocation reason (min 5 chars)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowRevokeModal(false)}>Back</Button>
                <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white" isLoading={loading}>
                  Confirm Revocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW PRINTABLE MARKSHEET */}
      {showPrintModal && selectedResult && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <h3 className="text-lg font-bold text-slate-900">Marksheet Preview</h3>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => window.print()}>
                  🖨️ Print Marksheet
                </Button>
                <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="print:m-0">
              <ResultDocument result={selectedResult} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
