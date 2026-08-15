import React from 'react'
import Link from 'next/link'
import {
  FileText,
  Award,
  FileCheck,
  Receipt,
  ExternalLink,
  ShieldCheck,
  QrCode,
  ArrowRight,
} from 'lucide-react'

interface DocumentItem {
  id: string
  name: string
  category: string
  issueDate: string
  status: 'Verified' | 'Issued' | 'Pending'
  href: string
  icon: typeof FileText
  color: string
}

const DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'Term Examination Admit Card (Hall Ticket)',
    category: 'Examinations Desk',
    issueDate: 'Session 2024–25',
    status: 'Verified',
    href: '/erp/student/admit-cards',
    icon: Award,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'doc-2',
    name: 'Progress Report Card & Marksheet',
    category: 'Academic Evaluation',
    issueDate: 'Term 1 Published',
    status: 'Verified',
    href: '/erp/student/results',
    icon: FileCheck,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'doc-3',
    name: 'Official Fee Receipts & Payment Invoices',
    category: 'Finance & Accounts',
    issueDate: 'Live Ledger',
    status: 'Verified',
    href: '/erp/student/fees',
    icon: Receipt,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'doc-4',
    name: 'Bonafide / Character Certificate',
    category: 'Administrative Services',
    issueDate: 'On Demand',
    status: 'Issued',
    href: '/erp/student/documents',
    icon: FileText,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
]

export function StudentDocumentCenterCard() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Official Document Center</h3>
            <p className="text-xs text-slate-500">
              Tamper-evident student certificates, fee receipts, and examination hall tickets with verified security QR
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <QrCode className="w-3.5 h-3.5" />
          CBSE Compliant
        </span>
      </div>

      {/* Documents Table / Grid */}
      <div className="divide-y divide-slate-100 mt-2">
        {DOCUMENTS.map((doc) => {
          const Icon = doc.icon
          return (
            <div
              key={doc.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 -mx-2 px-2 rounded-xl transition"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${doc.color} border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {doc.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-xs">
                    <span className="text-[11px] text-slate-400">{doc.category}</span>
                    <span>•</span>
                    <span className="text-[11px] font-mono text-slate-500">{doc.issueDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {doc.status}
                </span>

                <Link
                  href={doc.href}
                  prefetch={true}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold border border-slate-200 hover:border-blue-600 transition shadow-2xs group cursor-pointer"
                >
                  <span>View Document</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-100 mt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <span>All digitally generated certificates carry anti-tamper cryptographic signatures.</span>
        <Link
          href="/erp/student/documents"
          prefetch={true}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          All Certificates <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
