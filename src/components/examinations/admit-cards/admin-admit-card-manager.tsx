'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdmitCard, BulkGenerationSummary, ReplacementReason } from '@/types/admit-card'
import type { Examination } from '@/types/examination'
import { Button } from '@/components/ui/button'
import {
  bulkGenerateAdmitCardsAction,
  overrideFinancialHoldAction,
  publishAdmitCardAction,
  bulkPublishAdmitCardsAction,
  revokeAdmitCardAction,
  regenerateAdmitCardAction,
} from '@/lib/examinations/admit-card-actions'
import { AdmitCardDocument } from './admit-card-document'
import { AlertTriangle, Send, RefreshCw, XCircle, CheckCircle, ShieldAlert } from 'lucide-react'

interface Props {
  examinations: Examination[]
  classes: Array<{ id: string; name: string }>
  admitCards: AdmitCard[]
  userRoles: string[]
}

const REPLACEMENT_REASONS: ReplacementReason[] = [
  'Exam Date Changed',
  'Exam Room Changed',
  'Subject Added',
  'Subject Removed',
  'Student Information Corrected',
  'Photograph Updated',
  'Administrative Correction',
  'Other',
]

export function AdminAdmitCardManager({
  examinations,
  classes,
  admitCards,
  userRoles,
}: Props) {
  const router = useRouter()
  const [selectedExamId, setSelectedExamId] = useState<string>(examinations[0]?.id || '')
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')

  // Modals state
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showReissueModal, setShowReissueModal] = useState(false)
  const [showBulkPublishModal, setShowBulkPublishModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<AdmitCard | null>(null)

  const [overrideReason, setOverrideReason] = useState('')
  const [revokeReason, setRevokeReason] = useState('')
  const [replacementReason, setReplacementReason] = useState<ReplacementReason>('Administrative Correction')
  const [customExplanation, setCustomExplanation] = useState('')
  const [reissueNotes, setReissueNotes] = useState('')

  const [bulkSummary, setBulkSummary] = useState<BulkGenerationSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isManagementAllowed = userRoles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))
  const canSeeFinances = userRoles.some(r => ['Super Admin', 'Admin', 'Principal', 'Accountant'].includes(r))

  // Filter admit cards locally
  const filteredCards = admitCards.filter(c => {
    const matchExam = !selectedExamId || c.examinationId === selectedExamId
    return matchExam
  })

  const eligibleForPublish = filteredCards.filter(c => c.status === 'eligible' || c.status === 'override_released')

  // Handlers
  const handleBulkGenerate = async () => {
    if (!selectedExamId || !selectedClassId) return
    setLoading(true)
    setMessage(null)
    const res = await bulkGenerateAdmitCardsAction({ examinationId: selectedExamId, classId: selectedClassId })
    setLoading(false)
    if (res.success && res.summary) {
      setBulkSummary(res.summary)
      setMessage({
        type: 'success',
        text: `Bulk Generation Complete: ${res.summary.generatedEligible} Eligible, ${res.summary.generatedBlocked} Financially Blocked, ${res.summary.ineligibleCount} Ineligible/Excluded`,
      })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed bulk Admit Card generation' })
    }
  }

  const handleOverrideHold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCard) return
    setLoading(true)
    setMessage(null)

    const res = await overrideFinancialHoldAction({ admitCardId: selectedCard.id, reason: overrideReason })
    setLoading(false)
    if (res.success) {
      setShowOverrideModal(false)
      setOverrideReason('')
      setSelectedCard(null)
      setMessage({ type: 'success', text: 'Financial hold successfully overridden with logged audit trail.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to override financial hold' })
    }
  }

  const handlePublishConfirm = async () => {
    if (!selectedCard) return
    setLoading(true)
    setMessage(null)
    const res = await publishAdmitCardAction({ admitCardId: selectedCard.id })
    setLoading(false)
    setShowPublishModal(false)
    if (res.success) {
      setMessage({ type: 'success', text: `Admit Card ${selectedCard.admitCardNumber} is now published and publicly verifiable.` })
      setSelectedCard(null)
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to publish Admit Card' })
    }
  }

  const handleBulkPublish = async () => {
    if (!selectedExamId) return
    setLoading(true)
    setMessage(null)
    const res = await bulkPublishAdmitCardsAction({ examinationId: selectedExamId })
    setLoading(false)
    setShowBulkPublishModal(false)
    if (res.success) {
      setMessage({ type: 'success', text: `Bulk Publication Succeeded: ${res.publishedCount} Admit Cards published.` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to bulk publish Admit Cards' })
    }
  }

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCard) return
    setLoading(true)
    setMessage(null)

    const res = await revokeAdmitCardAction({ admitCardId: selectedCard.id, reason: revokeReason })
    setLoading(false)
    if (res.success) {
      setShowRevokeModal(false)
      setRevokeReason('')
      setSelectedCard(null)
      setMessage({ type: 'success', text: 'Admit Card officially revoked. QR verification will now report REVOKED.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to revoke Admit Card' })
    }
  }

  const handleReissue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCard) return
    setLoading(true)
    setMessage(null)

    const fullReason = replacementReason === 'Other' ? customExplanation : `${replacementReason}: ${reissueNotes}`
    const res = await regenerateAdmitCardAction({
      oldAdmitCardId: selectedCard.id,
      reason: fullReason,
      replacementReason,
      customExplanation,
    })
    setLoading(false)
    if (res.success) {
      setShowReissueModal(false)
      setReissueNotes('')
      setCustomExplanation('')
      setSelectedCard(null)
      setMessage({ type: 'success', text: 'New Admit Card version issued. Previous version marked as SUPERSEDED.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to reissue Admit Card' })
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'published':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Published</span>
      case 'override_released':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">Override Released</span>
      case 'eligible':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">Eligible (Draft)</span>
      case 'blocked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">Financially Blocked</span>
      case 'superseded':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">Superseded</span>
      case 'revoked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-800 border border-slate-300">Revoked</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">Draft</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Admit Cards &amp; Examination Candidate Gate</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Cryptographically signed Admit Cards with immutable snapshots, versioning, and financial clearance controls
          </p>
        </div>
        {isManagementAllowed && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowBulkPublishModal(true)} disabled={eligibleForPublish.length === 0}>
              <Send className="w-4 h-4 mr-1.5 text-blue-600" />
              Bulk Publish ({eligibleForPublish.length})
            </Button>
            <Button variant="primary" onClick={handleBulkGenerate} isLoading={loading}>
              ⚡ Bulk Generate Candidates
            </Button>
          </div>
        )}
      </div>

      {/* Global Alert Message */}
      {message && (
        <div className={['p-4 rounded-xl text-sm font-medium border flex items-center justify-between', message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'].join(' ')}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold uppercase opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Bulk Generation Summary Breakdown */}
      {bulkSummary && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-sm font-bold text-slate-900">Bulk Generation Summary Report</h3>
            <span className="text-xs text-slate-500 font-mono">Processed: {bulkSummary.totalProcessed}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-xl font-black text-emerald-800">{bulkSummary.generatedEligible}</div>
              <div className="text-[11px] font-bold text-emerald-900 uppercase">Eligible Cards</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="text-xl font-black text-rose-800">{bulkSummary.generatedBlocked}</div>
              <div className="text-[11px] font-bold text-rose-900 uppercase">Financially Blocked</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-xl font-black text-amber-800">{bulkSummary.ineligibleCount}</div>
              <div className="text-[11px] font-bold text-amber-900 uppercase">Ineligible / Excluded</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xl font-black text-slate-800">{bulkSummary.totalProcessed}</div>
              <div className="text-[11px] font-bold text-slate-700 uppercase">Total Students</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Examination Master</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            disabled={examinations.length === 0}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">{examinations.length === 0 ? 'No examinations available' : 'Select Examination Master'}</option>
            {examinations.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.academicSessionName})</option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Target Class for Bulk Generation</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={classes.length === 0}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">{classes.length === 0 ? 'No classes available' : 'Select Class'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Admit Cards Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Generated Admit Cards</h3>
          <span className="text-xs font-semibold text-slate-500">{filteredCards.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">Admit Card No.</th>
                <th className="py-3 px-6">Version</th>
                <th className="py-3 px-6">Candidate</th>
                <th className="py-3 px-6">Adm No / Class</th>
                {canSeeFinances && <th className="py-3 px-6">Financial Clearance</th>}
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No Admit Cards found for this examination. Use &quot;⚡ Bulk Generate Candidates&quot; above to initiate generation.
                  </td>
                </tr>
              ) : (
                filteredCards.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-mono font-bold text-blue-900">
                      {c.admitCardNumber}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-bold text-slate-600">
                      V{c.version || 1}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {c.studentName}
                      {c.financialOverride && (
                        <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                          OVERRIDDEN
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div>{c.admissionNumber}</div>
                      <div className="text-slate-500">{c.className} {c.sectionName ? `(${c.sectionName})` : ''}</div>
                    </td>
                    {canSeeFinances && (
                      <td className="py-4 px-6">
                        {c.financialClearanceStatus === 'CLEAR' || c.financialClearanceStatus === 'WAIVED' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Clear (₹0)</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {c.financialClearanceStatus} (₹{c.financialOutstandingAmount.toLocaleString('en-IN')})
                          </span>
                        )}
                      </td>
                    )}
                    <td className="py-4 px-6">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setSelectedCard(c); setShowPrintModal(true) }}
                      >
                        Preview / Print
                      </Button>

                      {isManagementAllowed && c.status === 'blocked' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 font-bold"
                          onClick={() => { setSelectedCard(c); setShowOverrideModal(true) }}
                        >
                          Override Hold
                        </Button>
                      )}

                      {isManagementAllowed && (c.status === 'eligible' || c.status === 'override_released') && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => { setSelectedCard(c); setShowPublishModal(true) }}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                          Publish
                        </Button>
                      )}

                      {isManagementAllowed && c.status === 'published' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setSelectedCard(c); setShowReissueModal(true) }}
                          className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 font-bold"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          Reissue / V{(c.version || 1) + 1}
                        </Button>
                      )}

                      {isManagementAllowed && c.status !== 'revoked' && c.status !== 'superseded' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setSelectedCard(c); setShowRevokeModal(true) }}
                          className="text-rose-700 hover:bg-rose-50 border-rose-200 font-bold"
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

      {/* MODAL 1: PUBLISH CONFIRMATION */}
      {showPublishModal && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Publish Admit Card?</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedCard.admitCardNumber}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5 text-slate-700">
              <div><span className="font-semibold text-slate-500">Student:</span> <span className="font-bold text-slate-900">{selectedCard.studentName}</span></div>
              <div><span className="font-semibold text-slate-500">Class:</span> <span className="font-bold text-slate-900">{selectedCard.className}</span></div>
              <div><span className="font-semibold text-slate-500">Examination:</span> <span className="font-bold text-slate-900">{selectedCard.examinationName}</span></div>
              <div><span className="font-semibold text-slate-500">Version:</span> <span className="font-bold text-slate-900">V{selectedCard.version || 1}</span></div>
            </div>

            <p className="text-xs text-slate-600">
              Publishing will make this Admit Card visible in the Student and Parent portals and publicly verifiable via QR code. An immutable document snapshot will be created.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="secondary" onClick={() => setShowPublishModal(false)}>Cancel</Button>
              <Button type="button" variant="primary" className="bg-emerald-700 hover:bg-emerald-800 text-white" onClick={handlePublishConfirm} isLoading={loading}>
                Confirm &amp; Publish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK PUBLISH CONFIRMATION */}
      {showBulkPublishModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-blue-800">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Bulk Publish Admit Cards</h3>
                <p className="text-xs text-slate-500">{eligibleForPublish.length} eligible candidates</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to publish <span className="font-bold text-slate-900">{eligibleForPublish.length} eligible Admit Cards</span> for this examination? All published cards will become instantly verifiable and downloadable.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="secondary" onClick={() => setShowBulkPublishModal(false)}>Cancel</Button>
              <Button type="button" variant="primary" className="bg-blue-700 hover:bg-blue-800 text-white" onClick={handleBulkPublish} isLoading={loading}>
                Publish {eligibleForPublish.length} Cards
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REISSUE / VERSION REPLACEMENT */}
      {showReissueModal && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-blue-800">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reissue Admit Card (Create Version {(selectedCard.version || 1) + 1})</h3>
                <p className="text-xs text-slate-500 font-mono">Current: {selectedCard.admitCardNumber} (V{selectedCard.version || 1})</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">VERSION INTEGRITY NOTICE:</p>
              <p>
                Version {selectedCard.version || 1} will be marked as <span className="font-bold">SUPERSEDED</span>. A new Version {(selectedCard.version || 1) + 1} will be created with a new security QR token and fresh schedule snapshot.
              </p>
            </div>

            <form onSubmit={handleReissue} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Replacement / Reissue *</label>
                <select
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value as ReplacementReason)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  required
                >
                  {REPLACEMENT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {replacementReason === 'Other' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specific Explanation *</label>
                  <textarea
                    value={customExplanation}
                    onChange={(e) => setCustomExplanation(e.target.value)}
                    rows={2}
                    placeholder="Provide mandatory explanation for replacement..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Administrative Notes (Optional)</label>
                  <input
                    type="text"
                    value={reissueNotes}
                    onChange={(e) => setReissueNotes(e.target.value)}
                    placeholder="e.g. Schedule updated per revised date sheet..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="secondary" onClick={() => setShowReissueModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="bg-blue-700 hover:bg-blue-800 text-white" isLoading={loading}>
                  Issue Version {(selectedCard.version || 1) + 1}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: FINANCIAL OVERRIDE */}
      {showOverrideModal && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Administrative Financial Hold Override</h3>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs space-y-2 text-rose-900">
              <p className="font-bold">STUDENT: {selectedCard.studentName} ({selectedCard.admissionNumber})</p>
              <p>Financial Status: <span className="font-bold">{selectedCard.financialClearanceStatus}</span></p>
              <p>Outstanding Balance: <span className="font-bold">₹{selectedCard.financialOutstandingAmount.toLocaleString('en-IN')}</span></p>
            </div>

            <form onSubmit={handleOverrideHold} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mandatory Override Reason *
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="Provide explicit justification (min 3 chars), e.g. Management approval for exam participation..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="secondary" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-white" isLoading={loading}>
                  Authorise Financial Override
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: REVOCATION */}
      {showRevokeModal && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-900">Revoke Admit Card</h3>
            <p className="text-xs text-slate-500">
              Revoking Admit Card <span className="font-mono font-bold text-slate-900">{selectedCard.admitCardNumber}</span> will immediately invalidate the document and cause public QR verification to report REVOKED.
            </p>
            <form onSubmit={handleRevoke} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Revocation Reason *
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                  placeholder="State explicit revocation reason (min 5 chars)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="secondary" onClick={() => setShowRevokeModal(false)}>Back</Button>
                <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white" isLoading={loading}>
                  Confirm Revocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: PRINT / PREVIEW ADMIT CARD DOCUMENT */}
      {showPrintModal && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto print:static print:bg-white print:p-0">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs print:hidden">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Admit Card Document Preview</h3>
                <p className="text-xs text-slate-500 font-mono">Admit Card: {selectedCard.admitCardNumber} • Ver: V{selectedCard.version || 1}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => window.print()} className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold">
                  🖨️ Print / Save PDF
                </Button>
                <Button variant="secondary" onClick={() => setShowPrintModal(false)} className="text-xs font-bold">
                  Close
                </Button>
              </div>
            </div>
            <div className="print:m-0 print:p-0">
              <AdmitCardDocument admitCard={selectedCard} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
