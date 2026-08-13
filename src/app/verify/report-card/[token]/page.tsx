import { getReportCardByToken } from '@/lib/examinations/document-queries'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicReportCardVerificationPage({ params }: Props) {
  const { token } = await params
  const record = await getReportCardByToken(token)

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-emerald-100 text-emerald-700">
          {record ? '✓' : '✕'}
        </div>

        {record ? (
          <div className="space-y-4">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase">
              AUTHENTIC PUBLISHED REPORT CARD
            </span>
            <h2 className="text-xl font-black text-slate-900 uppercase">{record.schoolName}</h2>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2 text-left">
              <div><span className="text-slate-500 font-semibold">Student Name:</span> <span className="font-bold text-slate-900">{record.studentName}</span></div>
              <div><span className="text-slate-500 font-semibold">Admission No:</span> <span className="font-mono font-bold text-slate-900">{record.admissionNumber}</span></div>
              <div><span className="text-slate-500 font-semibold">Academic Session:</span> <span className="font-bold text-slate-900">{record.academicSessionName}</span></div>
              <div><span className="text-slate-500 font-semibold">Class:</span> <span className="font-bold text-slate-900">{record.className}</span></div>
              <div><span className="text-slate-500 font-semibold">Examination:</span> <span className="font-bold text-indigo-700">{record.examinationName}</span></div>
              <div><span className="text-slate-500 font-semibold">Document Version:</span> <span className="font-mono font-bold text-slate-900">V{record.version}</span></div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              This verification confirms that the document token matches an authentic published report card record in the school database.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full uppercase">
              INVALID OR REVOKED TOKEN
            </span>
            <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
            <p className="text-xs text-slate-500">
              The provided verification token is invalid, expired, or belongs to a revoked report card record.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
