'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdmitCard, BulkGenerationSummary, ReplacementReason } from '@/types/admit-card'
import type { Examination } from '@/types/examination'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Modal } from '@/components/ui/modal'
import {
  bulkGenerateAdmitCardsAction,
  overrideFinancialHoldAction,
  publishAdmitCardAction,
  bulkPublishAdmitCardsAction,
  revokeAdmitCardAction,
  regenerateAdmitCardAction,
} from '@/lib/examinations/admit-card-actions'
import { AdmitCardDocument } from './admit-card-document'
import { AlertTriangle, Send, RefreshCw, XCircle, CheckCircle, ShieldAlert, Award, Printer, Zap } from 'lucide-react'

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
      setMessage({ type: 'success', text: 'Financial hold successfully overridden. Admit Card is now eligible.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to override hold' })
    }
  }

  const handlePublishConfirm = async () => {
    if (!selectedCard) return
    setLoading(true)
    setMessage(null)
    const res = await publishAdmitCardAction({ admitCardId: selectedCard.id })
    setLoading(false)
    if (res.success) {
      setShowPublishModal(false)
      setMessage({ type: 'success', text: `Admit Card ${selectedCard.admitCardNumber} published successfully.` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to publish Admit Card' })
    }
  }

  const handleBulkPublish = async () => {
    if (!selectedExamId) return
    setLoading(true)
    setMessage(null)
    const res = await bulkPublishAdmitCardsAction({ examinationId: selectedExamId, classId: selectedClassId || undefined })
    setLoading(false)
    if (res.success) {
      setShowBulkPublishModal(false)
      setMessage({ type: 'success', text: `Bulk published ${res.publishedCount || eligibleForPublish.length} Admit Cards successfully.` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Bulk publish failed' })
    }
  }

  const handleReissue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCard) return
    setLoading(true)
    setMessage(null)

    const finalReason = replacementReason === 'Other' ? customExplanation : replacementReason
    if (!finalReason) {
      setMessage({ type: 'error', text: 'A replacement reason is strictly required' })
      setLoading(false)
      return
    }

    const res = await regenerateAdmitCardAction({
      oldAdmitCardId: selectedCard.id,
      reason: replacementReason,
      replacementReason: replacementReason,
      customExplanation: customExplanation || reissueNotes || undefined,
    })
    setLoading(false)
    if (res.success) {
      setShowReissueModal(false)
      setCustomExplanation('')
      setReissueNotes('')
      setMessage({ type: 'success', text: `Admit Card successfully regenerated as Version ${(selectedCard.version || 1) + 1}. Old version superseded.` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to reissue Admit Card' })
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
      setMessage({ type: 'success', text: `Admit Card ${selectedCard.admitCardNumber} has been revoked.` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to revoke Admit Card' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#1554C0]" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-sans">Admit Cards &amp; Examination Candidate Gate</h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
            Cryptographically signed Admit Cards with immutable snapshots, versioning, and financial clearance controls
          </p>
        </div>
        {isManagementAllowed && (
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkPublishModal(true)}
              disabled={eligibleForPublish.length === 0}
              leftIcon={<Send className="w-3.5 h-3.5 text-[#1554C0]" />}
            >
              Bulk Publish ({eligibleForPublish.length})
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkGenerate}
              isLoading={loading}
              loadingText="Generating..."
              leftIcon={<Zap className="w-3.5 h-3.5" />}
            >
              Bulk Generate Candidates
            </Button>
          </div>
        )}
      </div>

      {/* Global Alert Message */}
      {message && (
        <div className={['p-4 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-between shadow-2xs', message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'].join(' ')}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-bold uppercase opacity-70 hover:opacity-100 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Bulk Generation Summary Breakdown */}
      {bulkSummary && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">Bulk Generation Summary Report</h3>
            <span className="text-xs text-slate-500 font-mono">Total Processed: {bulkSummary.totalProcessed}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <div className="text-2xl font-black text-emerald-800 font-sans">{bulkSummary.generatedEligible}</div>
              <div className="text-[10px] font-bold text-emerald-900 uppercase font-mono mt-0.5">Eligible Cards</div>
            </div>
            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl">
              <div className="text-2xl font-black text-rose-800 font-sans">{bulkSummary.generatedBlocked}</div>
              <div className="text-[10px] font-bold text-rose-900 uppercase font-mono mt-0.5">Financially Blocked</div>
            </div>
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <div className="text-2xl font-black text-amber-800 font-sans">{bulkSummary.ineligibleCount}</div>
              <div className="text-[10px] font-bold text-amber-900 uppercase font-mono mt-0.5">Ineligible / Excluded</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="text-2xl font-black text-slate-800 font-sans">{bulkSummary.totalProcessed}</div>
              <div className="text-[10px] font-bold text-slate-700 uppercase font-mono mt-0.5">Total Processed</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full space-y-1">
          <label className="block text-xs font-semibold text-slate-700">Select Examination Master</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            disabled={examinations.length === 0}
            className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:border-[#1554C0] disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">{examinations.length === 0 ? 'No examinations available' : 'Select Examination Master'}</option>
            {examinations.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.academicSessionName})</option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full space-y-1">
          <label className="block text-xs font-semibold text-slate-700">Target Class for Bulk Generation</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={classes.length === 0}
            className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:border-[#1554C0] disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">{classes.length === 0 ? 'No classes available' : 'Select Class'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Admit Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/80 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">Generated Admit Cards</h3>
          <span className="text-xs font-bold text-slate-500 font-mono">{filteredCards.length} Records</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-4 sm:px-6">Admit Card No.</th>
                <th className="py-3 px-4 sm:px-6">Version</th>
                <th className="py-3 px-4 sm:px-6">Candidate</th>
                <th className="py-3 px-4 sm:px-6">Adm No / Class</th>
                {canSeeFinances && <th className="py-3 px-4 sm:px-6">Financial Clearance</th>}
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No Admit Cards found for this examination. Use &quot;Bulk Generate Candidates&quot; above to initiate generation.
                  </td>
                </tr>
              ) : (
                filteredCards.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-[#1554C0]">
                      {c.admitCardNumber}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-slate-600">
                      V{c.version || 1}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                      {c.studentName}
                      {c.financialOverride && (
                        <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200 font-mono">
                          OVERRIDDEN
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-xs">
                      <div className="font-mono font-semibold text-slate-800">{c.admissionNumber}</div>
                      <div className="text-slate-500 text-[11px]">{c.className} {c.sectionName ? `(${c.sectionName})` : ''}</div>
                    </td>
                    {canSeeFinances && (
                      <td className="py-3.5 px-4 sm:px-6">
                        {c.financialClearanceStatus === 'CLEAR' || c.financialClearanceStatus === 'WAIVED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Clear (₹0)</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {c.financialClearanceStatus} (₹{c.financialOutstandingAmount.toLocaleString('en-IN')})
                          </span>
                        )}
                      </td>
                    )}
                    <td className="py-3.5 px-4 sm:px-6">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setSelectedCard(c); setShowPrintModal(true) }}
                        leftIcon={<Printer className="w-3.5 h-3.5" />}
                      >
                        Print
                      </Button>

                      {isManagementAllowed && c.status === 'blocked' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 font-bold"
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
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Publish
                        </Button>
                      )}

                      {isManagementAllowed && c.status === 'published' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setSelectedCard(c); setShowReissueModal(true) }}
                          className="bg-blue-50 text-[#1554C0] border-blue-200 hover:bg-blue-100 font-bold"
                          leftIcon={<RefreshCw className="w-3 h-3" />}
                        >
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
      <Modal
        isOpen={showPublishModal && !!selectedCard}
        onClose={() => setShowPublishModal(false)}
        title="Publish Admit Card?"
        description={`ID: ${selectedCard?.admitCardNumber || ''}`}
        size="sm"
      >
        {selectedCard && (
          <div className="space-y-4 text-left">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5 text-slate-700">
              <div><span className="font-semibold text-slate-500">Student:</span> <span className="font-bold text-slate-900">{selectedCard.studentName}</span></div>
              <div><span className="font-semibold text-slate-500">Class:</span> <span className="font-bold text-slate-900">{selectedCard.className}</span></div>
              <div><span className="font-semibold text-slate-500">Examination:</span> <span className="font-bold text-slate-900">{selectedCard.examinationName}</span></div>
              <div><span className="font-semibold text-slate-500">Version:</span> <span className="font-bold text-slate-900">V{selectedCard.version || 1}</span></div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Publishing will make this Admit Card visible in the Student and Parent portals and publicly verifiable via QR code. An immutable document snapshot will be created.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPublishModal(false)}>Cancel</Button>
              <Button type="button" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePublishConfirm} isLoading={loading}>
                Confirm &amp; Publish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: BULK PUBLISH CONFIRMATION */}
      <Modal
        isOpen={showBulkPublishModal}
        onClose={() => setShowBulkPublishModal(false)}
        title="Bulk Publish Admit Cards"
        description={`${eligibleForPublish.length} eligible candidates`}
        size="sm"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to publish <span className="font-bold text-slate-900">{eligibleForPublish.length} eligible Admit Cards</span> for this examination? All published cards will become instantly verifiable and downloadable.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowBulkPublishModal(false)}>Cancel</Button>
            <Button type="button" variant="primary" size="sm" onClick={handleBulkPublish} isLoading={loading}>
              Publish {eligibleForPublish.length} Cards
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: REISSUE / VERSION REPLACEMENT */}
      <Modal
        isOpen={showReissueModal && !!selectedCard}
        onClose={() => setShowReissueModal(false)}
        title={`Reissue Admit Card (Version ${(selectedCard?.version || 1) + 1})`}
        description={`Current: ${selectedCard?.admitCardNumber || ''} (V${selectedCard?.version || 1})`}
        size="md"
      >
        {selectedCard && (
          <div className="space-y-4 text-left">
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">VERSION INTEGRITY NOTICE:</p>
              <p>
                Version {selectedCard.version || 1} will be marked as <span className="font-bold">SUPERSEDED</span>. A new Version {(selectedCard.version || 1) + 1} will be created with a new security QR token and fresh schedule snapshot.
              </p>
            </div>

            <form onSubmit={handleReissue} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Reason for Replacement / Reissue *</label>
                <select
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value as ReplacementReason)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-xs sm:text-sm font-medium"
                  required
                >
                  {REPLACEMENT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {replacementReason === 'Other' ? (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Specific Explanation *</label>
                  <textarea
                    value={customExplanation}
                    onChange={(e) => setCustomExplanation(e.target.value)}
                    rows={2}
                    placeholder="Provide mandatory explanation for replacement..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Administrative Notes (Optional)</label>
                  <input
                    type="text"
                    value={reissueNotes}
                    onChange={(e) => setReissueNotes(e.target.value)}
                    placeholder="e.g. Schedule updated per revised date sheet..."
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowReissueModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                  Issue Version {(selectedCard.version || 1) + 1}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* MODAL 4: FINANCIAL OVERRIDE */}
      <Modal
        isOpen={showOverrideModal && !!selectedCard}
        onClose={() => setShowOverrideModal(false)}
        title="Administrative Financial Hold Override"
        description="Authorise hall ticket generation despite outstanding balance."
        size="md"
      >
        {selectedCard && (
          <div className="space-y-4 text-left">
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs space-y-1 text-rose-900">
              <p className="font-bold">STUDENT: {selectedCard.studentName} ({selectedCard.admissionNumber})</p>
              <p>Financial Status: <span className="font-bold">{selectedCard.financialClearanceStatus}</span></p>
              <p>Outstanding Balance: <span className="font-bold">₹{selectedCard.financialOutstandingAmount.toLocaleString('en-IN')}</span></p>
            </div>

            <form onSubmit={handleOverrideHold} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Mandatory Override Reason *
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="Provide explicit justification (min 3 chars), e.g. Management approval for exam participation..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                  Authorise Financial Override
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* MODAL 5: REVOCATION */}
      <Modal
        isOpen={showRevokeModal && !!selectedCard}
        onClose={() => setShowRevokeModal(false)}
        title="Revoke Admit Card"
        description={`Invalidate Admit Card ${selectedCard?.admitCardNumber || ''}`}
        size="md"
      >
        {selectedCard && (
          <div className="space-y-4 text-left">
            <p className="text-xs text-slate-600 leading-relaxed">
              Revoking Admit Card <span className="font-mono font-bold text-slate-900">{selectedCard.admitCardNumber}</span> will immediately invalidate the document and cause public QR verification to report REVOKED.
            </p>
            <form onSubmit={handleRevoke} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Revocation Reason *
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                  placeholder="State explicit revocation reason (min 5 chars)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowRevokeModal(false)}>Back</Button>
                <Button type="submit" variant="destructive" size="sm" isLoading={loading}>
                  Confirm Revocation
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* MODAL 6: PRINT / PREVIEW ADMIT CARD DOCUMENT */}
      {showPrintModal && selectedCard && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto print:static print:bg-white print:p-0">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-2xs print:hidden">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Official Admit Card Document Preview</h3>
                <p className="text-xs text-slate-500 font-mono">Admit Card: {selectedCard.admitCardNumber} • Ver: V{selectedCard.version || 1}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-3.5 h-3.5" />}>
                  Print / Save PDF
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowPrintModal(false)}>
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
