import { getAdmitCardByToken } from '@/lib/examinations/admit-card-queries'

interface Props {
  params: Promise<{ token: string }>
}

export default async function VerifyAdmitCardPage({ params }: Props) {
  const { token } = await params
  const result = await getAdmitCardByToken(token)

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-6 text-center">
          <h1 className="text-lg font-bold uppercase tracking-wider">Admit Card Verification</h1>
          <p className="text-xs text-slate-400 mt-1">Official Document Verification Portal</p>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ✕
              </div>
              <h2 className="text-base font-bold text-slate-900">Invalid Verification Token</h2>
              <p className="text-xs text-slate-500">No matching Admit Card document record found.</p>
            </div>
          ) : result.isValid ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-3 text-emerald-800 text-xs font-bold">
                <span className="text-lg">✓</span>
                <div>AUTHENTIC &amp; VALID ADMIT CARD</div>
              </div>

              <div className="divide-y divide-slate-100 text-xs space-y-2 pt-2">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-semibold">School Name</span>
                  <span className="font-bold text-slate-900">{String(result.schoolName)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-semibold">Admit Card No.</span>
                  <span className="font-mono font-bold text-indigo-700">{String(result.admitCardNumber)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-semibold">Candidate Name</span>
                  <span className="font-bold text-slate-900">{String(result.studentName)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-semibold">Admission No.</span>
                  <span className="font-mono">{String(result.admissionNumber)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-semibold">Class / Section</span>
                  <span className="font-semibold">{String(result.className)} {result.sectionName ? `(${result.sectionName})` : ''}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500 font-semibold">Examination</span>
                  <span className="font-bold text-slate-900">{String(result.examinationName)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                !
              </div>
              <h2 className="text-base font-bold text-slate-900">Document Status: {String(result.status)}</h2>
              <p className="text-xs text-slate-500">This Admit Card is not currently active or published.</p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-200 text-[10px] text-slate-400">
          Roshani Public School ERP — Document Security Engine
        </div>
      </div>
    </div>
  )
}
