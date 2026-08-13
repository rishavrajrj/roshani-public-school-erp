'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdmitCard, BulkGenerationSummary } from '@/types/admit-card'
import type { Examination } from '@/types/examination'
import { Button } from '@/components/ui/button'
import {
  generateAdmitCardAction,
  bulkGenerateAdmitCardsAction,
  overrideFinancialHoldAction,
  publishAdmitCardAction,
  revokeAdmitCardAction,
} from '@/lib/examinations/admit-card-actions'
import { AdmitCardDocument } from './admit-card-document'

interface Props {
  examinations: Examination[]
  classes: Array<{ id: string; name: string }>
  admitCards: AdmitCard[]
  userRoles: string[]
}

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
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<AdmitCard | null>(null)

  const [overrideReason, setOverrideReason] = useState('')
  const [revokeReason, setRevokeReason] = useState('')

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

  // Handlers
  const handleGenerateSingle = async (studentId: string) => {
    if (!selectedExamId) return
    setLoading(true)
    setMessage(null)
    const res = await generateAdmitCardAction({ examinationId: selectedExamId, studentId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Admit Card generated successfully' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to generate Admit Card' })
    }
  }

  const handleBulkGenerate = async () => {
    if (!selectedExamId || !selectedClassId) return
    setLoading(true)
    setMessage(null)
    const res = await bulkGenerateAdmitCardsAction({ examinationId: selectedExamId, classId: selectedClassId })
    setLoading(false)
    if (res.success && res.summary) {
      setBulkSummary(res.summary)
      setMessage({ type: 'success', text: `Bulk Admit Card Generation Complete: ${res.summary.generatedEligible} Eligible, ${res.summary.generatedBlocked} Financially Blocked` })
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
      setMessage({ type: 'success', text: 'Financial hold successfully overridden. Admit Card status updated to Override Released.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to override financial hold' })
    }
  }

  const handlePublish = async (cardId: string) => {
    setLoading(true)
    setMessage(null)
    const res = await publishAdmitCardAction({ admitCardId: cardId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Admit Card published. Document is now accessible to student & parent.' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to publish Admit Card' })
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
      setMessage({ type: 'success', text: 'Admit Card revoked' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to revoke Admit Card' })
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'published':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">Published</span>
      case 'override_released':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-100 text-indigo-800">Override Released</span>
      case 'eligible':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-800">Eligible</span>
      case 'blocked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800">Financially Blocked</span>
      case 'revoked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-800">Revoked</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">Draft</span>
    }
  }

  const getFinancialBadge = (s: string, outstanding: number) => {
    if (s === 'CLEAR' || s === 'WAIVED') {
      return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Clear (₹0)</span>
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        {s} (₹{outstanding.toLocaleString('en-IN')})
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Admit Cards & Candidate Gate</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Generate, publish, and manage examination candidate Admit Cards with financial clearance controls
          </p>
        </div>
        {isManagementAllowed && (
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleBulkGenerate} isLoading={loading}>
              ⚡ Bulk Generate Admit Cards
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Examination Master</label>
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
          <label className="block text-xs font-semibold text-slate-600 mb-1">Target Class for Bulk Generation</label>
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

      {/* Candidate Admit Cards Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Generated Admit Cards</h3>
          <span className="text-xs font-semibold text-slate-500">{filteredCards.length} Cards Found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-6">Admit Card No.</th>
                <th className="py-3 px-6">Student</th>
                <th className="py-3 px-6">Adm No / Class</th>
                {canSeeFinances && <th className="py-3 px-6">Financial Clearance</th>}
                <th className="py-3 px-6">Admit Card Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No Admit Cards generated for this examination yet. Click &quot;⚡ Bulk Generate Admit Cards&quot; to initiate candidate generation.
                  </td>
                </tr>
              ) : (
                filteredCards.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                      {c.admitCardNumber}
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
                        {getFinancialBadge(c.financialClearanceStatus, c.financialOutstandingAmount)}
                      </td>
                    )}
                    <td className="py-4 px-6">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
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
                          onClick={() => handlePublish(c.id)}
                          isLoading={loading}
                        >
                          Publish
                        </Button>
                      )}

                      {isManagementAllowed && c.status !== 'revoked' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setSelectedCard(c); setShowRevokeModal(true) }}
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

      {/* MODAL 1: ADMINISTRATIVE FINANCIAL OVERRIDE */}
      {showOverrideModal && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Administrative Financial Hold Override</h3>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs space-y-2 text-rose-900">
              <p className="font-bold">STUDENT: {selectedCard.studentName} ({selectedCard.admissionNumber})</p>
              <p>Financial Status: <span className="font-bold">{selectedCard.financialClearanceStatus}</span></p>
              <p>Total Outstanding Balance: <span className="font-bold">₹{selectedCard.financialOutstandingAmount.toLocaleString('en-IN')}</span></p>
              <p className="italic border-t border-rose-200 pt-2 text-[11px] text-rose-700">
                SECURITY WARNING: Overriding this financial hold permits exam document release ONLY. It does NOT waive fees, alter invoices, or modify the financial ledger.
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
                  placeholder="Provide explicit justification (min 3 chars), e.g. Management approval for exam participation..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-white" isLoading={loading}>
                  Authorise Financial Override
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REVOKE ADMIT CARD */}
      {showRevokeModal && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-rose-900">Revoke Admit Card</h3>
            <p className="text-xs text-slate-500">
              Revoking Admit Card <span className="font-mono font-bold text-slate-900">{selectedCard.admitCardNumber}</span> invalidates the document for student access.
            </p>
            <form onSubmit={handleRevoke} className="space-y-4 text-sm">
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

      {/* MODAL 3: PRINT / PREVIEW ADMIT CARD DOCUMENT */}
      {showPrintModal && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <h3 className="text-lg font-bold text-slate-900">Admit Card Document Preview</h3>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => window.print()}>
                  🖨️ Print Document
                </Button>
                <Button variant="secondary" onClick={() => setShowPrintModal(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="print:m-0">
              <AdmitCardDocument admitCard={selectedCard} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
