'use client'

import type { Certificate } from '@/types/document'

interface Props {
  certificate: Certificate
  schoolName?: string
}

export function CertificateDocument({ certificate, schoolName = 'Roshani Public School' }: Props) {
  const snapshot = certificate.dataSnapshot || {}

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto border-8 border-double border-slate-900 shadow-2xl text-slate-900 print:shadow-none print:max-w-none print:w-full print:border-4 print:p-8">
      {/* School Seal & Title Banner */}
      <div className="text-center border-b-2 border-slate-900 pb-6 mb-8 space-y-2">
        <div className="w-16 h-16 border-2 border-slate-900 rounded-full mx-auto flex items-center justify-center font-black text-xl text-slate-900 mb-2">
          RPS
        </div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">{schoolName}</h1>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Recognised Senior Secondary Educational Institution</p>
        <p className="text-[10px] text-slate-500 font-serif italic">Affiliated to Central Board of Secondary Education (CBSE)</p>
      </div>

      {/* Certificate Number & Date Bar */}
      <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-900 border-b border-slate-300 pb-3 mb-8">
        <div>CERTIFICATE NO: <span className="text-indigo-700 font-black">{certificate.certificateNumber}</span></div>
        <div>DATE OF ISSUE: <span>{certificate.issueDate}</span></div>
      </div>

      {/* Certificate Main Title */}
      <div className="text-center my-8">
        <h2 className="text-2xl font-black uppercase tracking-widest border-b-2 border-slate-900 inline-block pb-1">
          {certificate.certificateTypeName || 'ACADEMIC CERTIFICATE'}
        </h2>
      </div>

      {/* Body Content Paragraph */}
      <div className="text-sm leading-relaxed text-slate-800 space-y-6 my-10 font-serif px-4 text-justify">
        <p>
          This is to officially certify that <span className="font-bold text-slate-900 uppercase font-sans text-base">{snapshot.studentName}</span>, 
          son/daughter of Shri <span className="font-bold text-slate-900 uppercase font-sans">{snapshot.fatherName || 'N/A'}</span>, 
          bearing Admission Number <span className="font-bold font-mono text-slate-900 font-sans">{snapshot.admissionNumber}</span>, 
          is/was a bonafide student of this institution in Class <span className="font-bold font-sans">{snapshot.className} {snapshot.sectionName ? `(${snapshot.sectionName})` : ''}</span> during the academic session <span className="font-bold font-sans">{snapshot.academicYear || 2026}</span>.
        </p>

        {certificate.certificateTypeCode === 'TC' && (
          <div className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded font-sans text-xs font-semibold">
            <div>Date of Birth: <span className="font-mono text-slate-900">{snapshot.dateOfBirth || 'N/A'}</span></div>
            <div>Date of School Leaving: <span className="font-mono text-slate-900">{certificate.issueDate}</span></div>
            <div>Reason for Leaving: <span className="text-slate-900">{snapshot.reason || 'Parent Request / Higher Education Transfer'}</span></div>
            <div>Conduct &amp; Character: <span className="text-emerald-700 font-bold">{snapshot.conductRemarks || 'GOOD'}</span></div>
          </div>
        )}

        {certificate.certificateTypeCode === 'BONAFIDE' && (
          <p>
            To the best of our knowledge, {snapshot.studentName} bears a good moral character and has actively participated in academic activities of the school. This certificate is issued upon request for official verification purposes.
          </p>
        )}

        {certificate.certificateTypeCode === 'CHARACTER' && (
          <p>
            During their tenure at Roshani Public School, the candidate&apos;s conduct and moral character have been evaluated as <span className="font-bold text-emerald-700 uppercase font-sans">{snapshot.conductRemarks || 'EXEMPLARY AND GOOD'}</span>. They possess clean disciplinary records.
          </p>
        )}

        {snapshot.remarks && (
          <p className="italic text-xs font-sans text-slate-600 bg-slate-50 p-3 border-l-2 border-slate-900">
            Remarks: &quot;{snapshot.remarks}&quot;
          </p>
        )}
      </div>

      {/* Signature & Seal Section */}
      <div className="grid grid-cols-2 gap-12 pt-16 border-t border-slate-300 text-center text-xs font-semibold text-slate-700">
        <div>
          <div className="h-12"></div>
          <p className="border-t border-slate-400 pt-1">Administrative Office Registrar</p>
        </div>
        <div>
          <div className="h-12"></div>
          <p className="border-t border-slate-400 pt-1 font-bold text-slate-900">Principal Signature &amp; Institution Seal</p>
        </div>
      </div>

      {/* Footer Token Info */}
      <div className="mt-8 text-center text-[9px] font-mono text-slate-400">
        PUBLIC VERIFICATION TOKEN: {certificate.verificationToken}
      </div>
    </div>
  )
}
