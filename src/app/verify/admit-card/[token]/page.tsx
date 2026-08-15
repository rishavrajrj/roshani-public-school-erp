import { getAdmitCardByToken } from '@/lib/examinations/admit-card-queries'
import { ShieldCheck, ShieldAlert, School, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

export default async function VerifyAdmitCardPage({ params }: Props) {
  const { token } = await params
  const result = await getAdmitCardByToken(token)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Header Banner */}
        <div className="bg-slate-950 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 text-amber-400">
            <School className="w-6 h-6" />
          </div>
          <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white">
            Roshani Public School
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Official Anti-Tamper Document Verification Engine
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {!result ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Invalid Verification Token</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No authentic Admit Card document found matching this digital security token.
              </p>
            </div>
          ) : result.isValid ? (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-700">Digital Authenticity Verified</div>
                  <div className="text-xs font-black text-emerald-950">AUTHENTIC &amp; VALID ADMIT CARD</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">School Name</span>
                  <span className="font-bold text-slate-900 text-right">{String(result.schoolName)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Admit Card No.</span>
                  <span className="font-mono font-bold text-blue-700">{String(result.admitCardNumber)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Candidate Name</span>
                  <span className="font-bold text-slate-900">{String(result.studentName)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Admission No.</span>
                  <span className="font-mono font-semibold">{String(result.admissionNumber)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-semibold">Class / Section</span>
                  <span className="font-bold text-slate-900">
                    {String(result.className)} {result.sectionName ? `(${result.sectionName})` : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Examination</span>
                  <span className="font-bold text-purple-700">{String(result.examinationName)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Document Status: {String(result.status)}</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                This Admit Card is not active or has been revoked by administration.
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-4 text-center border-t border-slate-200 text-[11px] text-slate-500">
          Cryptographically signed &amp; verified by RPS Security Server
        </div>
      </div>
    </div>
  )
}
