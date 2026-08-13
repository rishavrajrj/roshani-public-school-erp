import { getCertificateByToken } from '@/lib/examinations/document-queries'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicCertificateVerificationPage({ params }: Props) {
  const { token } = await params
  const record = await getCertificateByToken(token)

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-emerald-100 text-emerald-700">
          {record ? '✓' : '✕'}
        </div>

        {record ? (
          <div className="space-y-4">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase">
              AUTHENTIC ISSUED CERTIFICATE
            </span>
            <h2 className="text-xl font-black text-slate-900 uppercase">{record.schoolName}</h2>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-2 text-left">
              <div><span className="text-slate-500 font-semibold">Certificate Number:</span> <span className="font-mono font-bold text-indigo-700">{record.certificateNumber}</span></div>
              <div><span className="text-slate-500 font-semibold">Student Name:</span> <span className="font-bold text-slate-900">{record.studentName}</span></div>
              <div><span className="text-slate-500 font-semibold">Admission No:</span> <span className="font-mono font-bold text-slate-900">{record.admissionNumber}</span></div>
              <div><span className="text-slate-500 font-semibold">Class:</span> <span className="font-bold text-slate-900">{record.className}</span></div>
              <div><span className="text-slate-500 font-semibold">Issue Date:</span> <span className="font-mono font-bold text-slate-900">{record.issueDate}</span></div>
              <div><span className="text-slate-500 font-semibold">Status:</span> <span className="font-bold text-emerald-700">{record.status}</span></div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              This verification confirms that the certificate token matches an authentic issued academic certificate in the school database.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full uppercase">
              INVALID OR REVOKED CERTIFICATE
            </span>
            <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
            <p className="text-xs text-slate-500">
              The provided verification token is invalid, expired, or belongs to a revoked certificate.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
