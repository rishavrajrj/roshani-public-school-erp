'use client'

import { useState } from 'react'
import type { ReportCard, Certificate } from '@/types/document'
import { ReportCardDocument } from './report-card-document'
import { CertificateDocument } from './certificate-document'
import { Button } from '@/components/ui/button'

interface Props {
  reportCard: ReportCard | null
  certificates: Certificate[]
}

export function StudentDocumentView({ reportCard, certificates }: Props) {
  const [activeTab, setActiveTab] = useState<'report_card' | 'certificates'>('report_card')
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)

  return (
    <div className="space-y-6">
      {/* Top Selector Banner */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Official Student Academic Documents</h2>
          <p className="text-xs text-slate-500 mt-1">Download and print your progress report card and issued certificates</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('report_card')}
            className={['px-4 py-2 text-xs font-bold rounded-md transition-all', activeTab === 'report_card' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'].join(' ')}
          >
            📊 Report Card
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={['px-4 py-2 text-xs font-bold rounded-md transition-all', activeTab === 'certificates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'].join(' ')}
          >
            📜 Certificates ({certificates.length})
          </button>
        </div>
      </div>

      {/* TAB 1: REPORT CARD */}
      {activeTab === 'report_card' && (
        <div>
          {!reportCard || reportCard.status !== 'published' ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                📊
              </div>
              <h2 className="text-xl font-bold text-slate-900">Report Card Currently Unavailable</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Your report card is undergoing administrative approval or publication. Check back later or contact your class teacher.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end print:hidden">
                <Button variant="primary" onClick={() => window.print()}>🖨️ Download / Print Report Card</Button>
              </div>
              <ReportCardDocument reportCard={reportCard} />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {certificates.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                📜
              </div>
              <h2 className="text-xl font-bold text-slate-900">No Certificates Issued Yet</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No official academic certificates (Bonafide, Study, Transfer) have been issued for your student account.
              </p>
            </div>
          ) : selectedCert ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center print:hidden bg-white p-4 rounded-xl border border-slate-200">
                <Button variant="secondary" onClick={() => setSelectedCert(null)}>← Back to List</Button>
                <Button variant="primary" onClick={() => window.print()}>🖨️ Print Certificate</Button>
              </div>
              <CertificateDocument certificate={selectedCert} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map((c) => (
                <div key={c.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between hover:border-indigo-300 transition-all">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-700 font-bold block">{c.certificateNumber}</span>
                    <h3 className="font-bold text-lg text-slate-900">{c.certificateTypeName}</h3>
                    <p className="text-xs text-slate-500">Issued on {c.issueDate}</p>
                  </div>
                  <Button variant="secondary" onClick={() => setSelectedCert(c)}>
                    View Certificate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
