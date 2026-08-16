import { getAdmitCardByToken } from '@/lib/examinations/admit-card-queries'
import { ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, FileX } from 'lucide-react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ token: string }>
}

export default async function VerifyAdmitCardPage({ params }: Props) {
  const { token } = await params
  const result = await getAdmitCardByToken(token)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Header Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-7 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-full bg-white/10 p-1 flex items-center justify-center mx-auto mb-3 border border-white/20">
            <Image
              src="/school-logo.png"
              alt="Roshani Public School Crest"
              width={48}
              height={48}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
            {result?.schoolName ? String(result.schoolName) : 'Roshani Public School'}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">
            Official Examination Document Verification Portal
          </p>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Affiliated to CBSE, New Delhi • Senior Secondary Education
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {/* STATE 1: INVALID TOKEN */}
          {!result || result.state === 'INVALID' ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Verification Failed</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                The verification code is invalid, tampered, or does not exist in our institutional database.
              </p>
              <div className="text-[10px] text-slate-400 font-mono">
                Timestamp: {result?.verifiedAt || 'Now'}
              </div>
            </div>
          ) : result.state === 'VALID' ? (
            /* STATE 2: VALID / AUTHENTIC */
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">Digital Authenticity Confirmed</div>
                  <div className="text-xs font-black text-emerald-950">AUTHENTIC &amp; VALID ADMIT CARD</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700 font-bold">Status</span>
                  <span className="px-2.5 py-0.5 rounded text-[10.5px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs font-mono">
                    VALID (ACTIVE)
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700 font-bold">Admit Card No.</span>
                  <span className="font-mono font-extrabold text-blue-900">{String(result.admitCardNumber)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700 font-bold">Document Fingerprint</span>
                  <span className="font-mono font-bold text-slate-900">{String(result.documentFingerprint || 'N/A')}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700 font-bold">Candidate Name</span>
                  <span className="font-extrabold text-slate-950">{String(result.studentName)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700 font-bold">Admission No.</span>
                  <span className="font-mono font-bold text-slate-900">{String(result.admissionNumber)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700 font-bold">Roll Number</span>
                  <span className="font-mono font-bold text-slate-900">{String(result.rollNumber || 'N/A')}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700 font-bold">Class / Section</span>
                  <span className="font-bold text-slate-900">
                    {String(result.className)} {result.sectionName ? `(${result.sectionName})` : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700 font-bold">Examination</span>
                  <span className="font-bold text-slate-900">{String(result.examinationName)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-700 font-bold">Academic Session</span>
                  <span className="font-bold text-slate-900">{String(result.academicSession)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-bold">Issue Date</span>
                  <span className="font-bold text-slate-900">{String(result.publishedAt)}</span>
                </div>
              </div>
            </div>
          ) : result.state === 'SUPERSEDED' ? (
            /* STATE 3: SUPERSEDED */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-bold shadow-2xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">Document Superseded</div>
                  <div className="text-xs font-black text-amber-950">A NEWER ADMIT CARD HAS BEEN ISSUED</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2.5 text-xs">
                <p className="text-xs text-slate-600 leading-relaxed">
                  This document version is no longer active. An updated official Admit Card (Version {Number(result.version || 1) + 1}) has been issued for candidate <span className="font-bold text-slate-900">{result.studentName}</span>.
                </p>
                <div className="pt-2 border-t border-slate-200 space-y-1 text-slate-500">
                  <div>Admit Card ID: <span className="font-mono font-bold text-slate-800">{result.admitCardNumber}</span></div>
                  <div>Historical Document ID: <span className="font-mono font-bold text-slate-800">{result.documentFingerprint}</span></div>
                  {result.replacementReason && (
                    <div className="text-amber-800 font-medium">Update Reason: {result.replacementReason}</div>
                  )}
                </div>
              </div>
            </div>
          ) : result.state === 'REVOKED' ? (
            /* STATE 4: REVOKED */
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-900 text-xs font-bold shadow-2xs">
                <FileX className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">Admit Card Inactive</div>
                  <div className="text-xs font-black text-rose-950">ADMIT CARD HAS BEEN REVOKED</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2.5 text-xs">
                <p className="text-xs text-slate-600 leading-relaxed">
                  This Admit Card (<span className="font-mono font-bold text-slate-900">{result.admitCardNumber}</span>) was revoked by the school administration and is not authorized for examination entry.
                </p>
                {result.revocationReason && (
                  <div className="border-t border-slate-200 pt-2 text-rose-800 text-[11px] font-medium">
                    Revocation Note: &quot;{result.revocationReason}&quot;
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STATE 5: UNPUBLISHED */
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Verification Unavailable</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                This document is currently undergoing administrative processing and has not been officially published yet.
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-1">
          <div>Verified by Roshani Public School Server</div>
          <div>Verified at: {result?.verifiedAt}</div>
        </div>
      </div>
    </div>
  )
}
