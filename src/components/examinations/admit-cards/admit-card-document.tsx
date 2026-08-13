'use client'

import type { AdmitCard } from '@/types/admit-card'

interface Props {
  admitCard: AdmitCard
  schoolName?: string
}

export function AdmitCardDocument({ admitCard, schoolName = 'Roshani Public School' }: Props) {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto border-2 border-slate-900 shadow-lg text-slate-900 print:shadow-none print:max-w-none print:w-full print:border-none print:p-0">
      {/* Header Banner */}
      <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">{schoolName}</h1>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-1">Affiliated to CBSE, New Delhi | Senior Secondary Education</p>
        <div className="inline-block bg-slate-900 text-white px-4 py-1 mt-3 rounded text-sm font-bold uppercase tracking-widest">
          EXAMINATION ADMIT CARD — {admitCard.academicSessionName || '2026-27'}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-4 gap-4 border border-slate-300 p-4 mb-6 rounded text-xs bg-slate-50">
        <div className="col-span-3 grid grid-cols-2 gap-y-3 gap-x-4">
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Student Name</span>
            <span className="font-bold text-sm text-slate-900">{admitCard.studentName}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Admit Card Number</span>
            <span className="font-mono font-bold text-sm text-indigo-700">{admitCard.admitCardNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Admission Number</span>
            <span className="font-mono font-semibold text-slate-900">{admitCard.admissionNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Roll Number</span>
            <span className="font-mono font-semibold text-slate-900">{admitCard.rollNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Class / Section</span>
            <span className="font-bold text-slate-900">{admitCard.className} {admitCard.sectionName ? `(${admitCard.sectionName})` : ''}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Father&apos;s Name</span>
            <span className="font-semibold text-slate-900">{admitCard.fatherName}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Examination Title</span>
            <span className="font-bold text-slate-900">{admitCard.examinationName} ({admitCard.examinationCode})</span>
          </div>
        </div>

        {/* Photo Box & QR Verification */}
        <div className="col-span-1 border border-slate-300 rounded bg-white p-2 flex flex-col items-center justify-between text-center">
          <div className="w-24 h-28 border border-dashed border-slate-400 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-semibold uppercase">
            {admitCard.photoUrl ? (
              // eslint-disable-next-next/no-img-element
              <img src={admitCard.photoUrl} alt={admitCard.studentName} className="w-full h-full object-cover" />
            ) : (
              'Affix Photo'
            )}
          </div>
          <div className="mt-2 text-[9px] font-mono text-slate-500">
            Token: {admitCard.verificationToken.slice(0, 8)}
          </div>
        </div>
      </div>

      {/* Examination Timetable Grid */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
          EXAMINATION TIMETABLE
        </h3>
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
              <th className="border border-slate-300 p-2">Date & Day</th>
              <th className="border border-slate-300 p-2">Timing</th>
              <th className="border border-slate-300 p-2">Subject Code & Name</th>
              <th className="border border-slate-300 p-2">Room / Venue</th>
              <th className="border border-slate-300 p-2 text-center">Invigilator Sign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {admitCard.timetable && admitCard.timetable.length > 0 ? (
              admitCard.timetable.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-2 font-semibold">
                    {t.date} <span className="text-slate-500 text-[10px]">({t.day})</span>
                  </td>
                  <td className="border border-slate-300 p-2 font-mono text-[11px]">
                    {t.startTime} - {t.endTime}
                  </td>
                  <td className="border border-slate-300 p-2 font-bold text-slate-900">
                    <span className="font-mono text-indigo-700 mr-1.5">[{t.subjectCode}]</span>
                    {t.subjectName}
                  </td>
                  <td className="border border-slate-300 p-2 font-mono">
                    {t.room || 'Main Hall'}
                  </td>
                  <td className="border border-slate-300 p-2"></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border border-slate-300 p-4 text-center text-slate-500">
                  Timetable schedule entries pending publication.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rules & Candidate Instructions */}
      <div className="mb-6 border border-slate-200 p-4 rounded bg-slate-50 text-[11px] leading-relaxed text-slate-700 space-y-1">
        <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">CANDIDATE INSTRUCTIONS</h4>
        <ol className="list-decimal pl-4 space-y-0.5">
          <li>Candidates must produce this Admit Card along with School ID Card at the examination hall.</li>
          <li>Candidates must report to the allocated examination room at least 15 minutes before the start time.</li>
          <li>Electronic devices including smartphones, smartwatches, and calculators are strictly prohibited.</li>
          <li>Borrowing of stationery items during the examination is not permitted.</li>
          <li>Unfair means or misconduct will lead to immediate cancellation of the candidate&apos;s paper.</li>
        </ol>
      </div>

      {/* Signature Area */}
      <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-300 text-center text-xs font-semibold text-slate-700">
        <div>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1">Student Signature</p>
        </div>
        <div>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1">Class Teacher Signature</p>
        </div>
        <div>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1 font-bold text-slate-900">Controller of Examinations / Principal</p>
        </div>
      </div>
    </div>
  )
}
