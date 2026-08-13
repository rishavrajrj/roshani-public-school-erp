'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ReportCard, Certificate, CertificateTypeCode } from '@/types/document'
import type { Examination } from '@/types/examination'
import { Button } from '@/components/ui/button'
import {
  generateReportCardAction,
  batchGenerateReportCardsAction,
  updateTeacherRemarksAction,
  approveReportCardAction,
  publishReportCardAction,
  correctReportCardAction,
  issueCertificateAction,
  revokeCertificateAction,
} from '@/lib/examinations/document-actions'
import { ReportCardDocument } from './report-card-document'
import { CertificateDocument } from './certificate-document'

interface Props {
  classes: Array<{ id: string; name: string }>
  examinations: Examination[]
  students: Array<{ id: string; name: string; admissionNumber: string }>
  reportCards: ReportCard[]
  certificates: Certificate[]
  userRoles: string[]
}

export function AdminDocumentManager({
  classes,
  examinations,
  students,
  reportCards,
  certificates,
  userRoles,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'report_cards' | 'certificates'>('report_cards')

  const [selectedExamId, setSelectedExamId] = useState<string>(examinations[0]?.id || '')
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '')

  // Report card modals state
  const [showPrintReportCardModal, setShowPrintReportCardModal] = useState(false)
  const [showRemarksModal, setShowRemarksModal] = useState(false)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null)

  const [teacherRemarks, setTeacherRemarks] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')

  // Certificate modals state
  const [showIssueCertModal, setShowIssueCertModal] = useState(false)
  const [showPrintCertModal, setShowPrintCertModal] = useState(false)
  const [showRevokeCertModal, setShowRevokeCertModal] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)

  const [certStudentId, setCertStudentId] = useState<string>(students[0]?.id || '')
  const [certTypeCode, setCertTypeCode] = useState<CertificateTypeCode>('BONAFIDE')
  const [certReason, setCertReason] = useState('')
  const [certRemarks, setCertRemarks] = useState('')
  const [certRevocationReason, setCertRevocationReason] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isManagementAllowed = userRoles.some(r => ['Super Admin', 'Admin', 'Principal'].includes(r))

  // Filter report cards locally
  const filteredReportCards = reportCards.filter(rc => rc.examinationId === selectedExamId && rc.classId === selectedClassId)

  // Handlers
  const handleBatchGenerate = async () => {
    if (!selectedExamId || !selectedClassId) return
    setLoading(true)
    setMessage(null)

    const res = await batchGenerateReportCardsAction({ examinationId: selectedExamId, classId: selectedClassId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: `Generated ${res.count} report cards from finalized exam results & attendance data` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to generate report cards' })
    }
  }

  const handleApproveReportCard = async (reportCardId: string) => {
    setLoading(true)
    setMessage(null)
    const res = await approveReportCardAction({ reportCardId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: 'Report card approved by Principal' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to approve report card' })
    }
  }

  const handlePublishReportCards = async () => {
    if (!selectedExamId || !selectedClassId) return
    setLoading(true)
    setMessage(null)

    const res = await publishReportCardAction({ examinationId: selectedExamId, classId: selectedClassId })
    setLoading(false)
    if (res.success) {
      setMessage({ type: 'success', text: `Published ${res.count} report cards. Official documents are now accessible on student & parent portals.` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to publish report cards' })
    }
  }

  const handleRemarksSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReportCard) return
    setLoading(true)
    setMessage(null)

    const res = await updateTeacherRemarksAction({ reportCardId: selectedReportCard.id, teacherRemarks })
    setLoading(false)
    if (res.success) {
      setShowRemarksModal(false)
      setTeacherRemarks('')
      setSelectedReportCard(null)
      setMessage({ type: 'success', text: 'Class teacher remarks updated' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to update remarks' })
    }
  }

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReportCard) return
    setLoading(true)
    setMessage(null)

    const res = await correctReportCardAction({
      reportCardId: selectedReportCard.id,
      teacherRemarks,
      reason: correctionReason,
    })

    setLoading(false)
    if (res.success) {
      setShowCorrectionModal(false)
      setCorrectionReason('')
      setTeacherRemarks('')
      setSelectedReportCard(null)
      setMessage({ type: 'success', text: 'New report card version generated with audit trail' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to generate corrected report card' })
    }
  }

  const handleIssueCertificateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certStudentId) return
    setLoading(true)
    setMessage(null)

    const res = await issueCertificateAction({
      studentId: certStudentId,
      certificateTypeCode: certTypeCode,
      academicYear: 2026,
      reason: certReason,
      remarks: certRemarks,
    })

    setLoading(false)
    if (res.success && res.data) {
      setShowIssueCertModal(false)
      setCertReason('')
      setCertRemarks('')
      setMessage({ type: 'success', text: `Certificate issued successfully! Unique Number: ${res.data.certificate_number}` })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to issue certificate' })
    }
  }

  const handleRevokeCertificateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCertificate) return
    setLoading(true)
    setMessage(null)

    const res = await revokeCertificateAction({
      certificateId: selectedCertificate.id,
      reason: certRevocationReason,
    })

    setLoading(false)
    if (res.success) {
      setShowRevokeCertModal(false)
      setCertRevocationReason('')
      setSelectedCertificate(null)
      setMessage({ type: 'success', text: 'Certificate revoked' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to revoke certificate' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Documents &amp; Certificates Manager</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Generate report cards, prepare teacher remarks, approve, publish, and issue official academic certificates
          </p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('report_cards')}
            className={['px-4 py-2 text-xs font-bold rounded-md transition-all', activeTab === 'report_cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'].join(' ')}
          >
            📊 Report Cards
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={['px-4 py-2 text-xs font-bold rounded-md transition-all', activeTab === 'certificates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'].join(' ')}
          >
            📜 Academic Certificates
          </button>
        </div>
      </div>

      {/* Global Alert */}
      {message && (
        <div className={['p-4 rounded-lg text-sm font-medium border', message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'].join(' ')}>
          {message.text}
        </div>
      )}

      {/* TAB 1: REPORT CARDS WORKSPACE */}
      {activeTab === 'report_cards' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 gap-4 w-full">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Examination</label>
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

              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
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

            {isManagementAllowed && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleBatchGenerate} isLoading={loading}>
                  ⚙️ Generate Class Report Cards
                </Button>
                <Button variant="primary" onClick={handlePublishReportCards} isLoading={loading}>
                  🚀 Publish Report Cards
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Generated Report Cards Roster</h3>
              <span className="text-xs text-slate-500">{filteredReportCards.length} Documents</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-6">Student</th>
                    <th className="py-3 px-6 text-center">Score / Grade</th>
                    <th className="py-3 px-6 text-center">Result Status</th>
                    <th className="py-3 px-6 text-center">Version</th>
                    <th className="py-3 px-6 text-center">Document Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredReportCards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No report cards generated for this examination &amp; class. Click &quot;⚙️ Generate Class Report Cards&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredReportCards.map((rc) => (
                      <tr key={rc.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {rc.studentName}
                          <span className="block text-xs font-normal text-slate-500">{rc.admissionNumber}</span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono">
                          <span className="font-bold text-indigo-700">{rc.overallPercentage}%</span> ({rc.overallGrade})
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={['px-2 py-0.5 rounded text-xs font-bold uppercase', rc.resultStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'].join(' ')}>
                            {rc.resultStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono font-bold">V{rc.version}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={['px-2.5 py-0.5 rounded-full text-xs font-bold uppercase', rc.status === 'published' ? 'bg-emerald-100 text-emerald-800' : rc.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'].join(' ')}>
                            {rc.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setSelectedReportCard(rc); setShowPrintReportCardModal(true) }}
                          >
                            Preview
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setSelectedReportCard(rc); setTeacherRemarks(rc.teacherRemarks || ''); setShowRemarksModal(true) }}
                          >
                            Remarks
                          </Button>

                          {isManagementAllowed && rc.status !== 'approved' && rc.status !== 'published' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => handleApproveReportCard(rc.id)}
                              isLoading={loading}
                            >
                              Approve
                            </Button>
                          )}

                          {isManagementAllowed && rc.status === 'published' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => { setSelectedReportCard(rc); setShowCorrectionModal(true) }}
                            >
                              New Version
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

      {/* TAB 2: CERTIFICATES WORKSPACE */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Issued Academic Certificates</h3>
              <p className="text-xs text-slate-500">Bonafide, Transfer (TC), Character, Study, and Completion Certificates</p>
            </div>
            {isManagementAllowed && (
              <Button variant="primary" onClick={() => setShowIssueCertModal(true)}>
                📜 Issue New Certificate
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-6">Certificate No</th>
                    <th className="py-3 px-6">Student</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6 text-center">Issue Date</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {certificates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No certificates issued yet. Click &quot;📜 Issue New Certificate&quot;.
                      </td>
                    </tr>
                  ) : (
                    certificates.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6 font-mono font-bold text-indigo-700">{c.certificateNumber}</td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {c.studentName}
                          <span className="block text-xs font-normal text-slate-500">{c.admissionNumber}</span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-900">{c.certificateTypeName}</td>
                        <td className="py-4 px-6 text-center font-mono">{c.issueDate}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={['px-2.5 py-0.5 rounded-full text-xs font-bold uppercase', c.status === 'ISSUED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'].join(' ')}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setSelectedCertificate(c); setShowPrintCertModal(true) }}
                          >
                            Print Certificate
                          </Button>

                          {isManagementAllowed && c.status === 'ISSUED' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => { setSelectedCertificate(c); setShowRevokeCertModal(true) }}
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
        </div>
      )}

      {/* MODAL 1: PREVIEW REPORT CARD */}
      {showPrintReportCardModal && selectedReportCard && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <h3 className="text-lg font-bold text-slate-900">Report Card Document Preview</h3>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => window.print()}>🖨️ Print Report Card</Button>
                <Button variant="secondary" onClick={() => setShowPrintReportCardModal(false)}>Close</Button>
              </div>
            </div>
            <div className="print:m-0">
              <ReportCardDocument reportCard={selectedReportCard} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE TEACHER REMARKS */}
      {showRemarksModal && selectedReportCard && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Class Teacher Remarks</h3>
            <form onSubmit={handleRemarksSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks Text</label>
                <textarea
                  value={teacherRemarks}
                  onChange={(e) => setTeacherRemarks(e.target.value)}
                  rows={4}
                  placeholder="Enter constructive teacher remarks..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowRemarksModal(false)}>Cancel</Button>
                <Button type="submit" isLoading={loading}>Save Remarks</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ISSUE CERTIFICATE */}
      {showIssueCertModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Issue Academic Certificate</h3>
            <form onSubmit={handleIssueCertificateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  value={certStudentId}
                  onChange={(e) => setCertStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Type</label>
                <select
                  value={certTypeCode}
                  onChange={(e: any) => setCertTypeCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="BONAFIDE">Bonafide Certificate</option>
                  <option value="TC">Transfer Certificate (TC)</option>
                  <option value="CHARACTER">Character Certificate</option>
                  <option value="COMPLETION">Academic Completion Certificate</option>
                  <option value="STUDY">Study Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  value={certReason}
                  onChange={(e) => setCertReason(e.target.value)}
                  placeholder="e.g. Passport application, Higher studies transfer..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Conduct / Remarks</label>
                <textarea
                  value={certRemarks}
                  onChange={(e) => setCertRemarks(e.target.value)}
                  rows={2}
                  placeholder="Optional conduct remarks..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowIssueCertModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={loading}>Issue Certificate</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PREVIEW CERTIFICATE */}
      {showPrintCertModal && selectedCertificate && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3 print:hidden">
              <h3 className="text-lg font-bold text-slate-900">Certificate Document Preview</h3>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => window.print()}>🖨️ Print Certificate</Button>
                <Button variant="secondary" onClick={() => setShowPrintCertModal(false)}>Close</Button>
              </div>
            </div>
            <div className="print:m-0">
              <CertificateDocument certificate={selectedCertificate} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: REVOKE CERTIFICATE */}
      {showRevokeCertModal && selectedCertificate && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-rose-900">Revoke Certificate</h3>
            <p className="text-xs text-slate-500">
              Revoking certificate <span className="font-mono font-bold text-slate-900">{selectedCertificate.certificateNumber}</span> invalidates its public QR verification token.
            </p>
            <form onSubmit={handleRevokeCertificateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revocation Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={certRevocationReason}
                  onChange={(e) => setCertRevocationReason(e.target.value)}
                  rows={3}
                  placeholder="Provide explicit revocation reason (min 5 chars)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowRevokeCertModal(false)}>Back</Button>
                <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white" isLoading={loading}>
                  Confirm Revocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
