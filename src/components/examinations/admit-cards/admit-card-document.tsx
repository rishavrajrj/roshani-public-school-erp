'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import type { AdmitCard } from '@/types/admit-card'
import { QRCodeSVG } from '@/components/ui/qr-code'

interface Props {
  admitCard: AdmitCard
  schoolName?: string
  affiliationText?: string
}

export function AdmitCardDocument({
  admitCard,
  schoolName = 'Roshani Public School',
  affiliationText = 'Affiliated to CBSE, New Delhi (Affiliation No. 330943, School Code: 66664)',
}: Props) {
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const verificationUrl = origin
    ? `${origin}/verify/admit-card/${admitCard.verificationToken}`
    : `/verify/admit-card/${admitCard.verificationToken}`

  const isSuperseded = admitCard.status === 'superseded'
  const isRevoked = admitCard.status === 'revoked'

  return (
    <div className="admit-card-wrapper w-full flex justify-center py-2 print:py-0 print:m-0">
      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .admit-card-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .admit-card-sheet {
            box-shadow: none !important;
            border: 1.5px solid #0f172a !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 20px 24px !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* A4 Sheet Container */}
      <div className="admit-card-sheet bg-white text-slate-900 border-[1.5px] border-slate-900 w-full max-w-[210mm] min-h-[285mm] p-6 sm:p-7 shadow-xl mx-auto font-sans flex flex-col justify-between select-text relative">
        
        {/* SUPERSEDED / REVOKED OFFICIAL WATERMARK */}
        {isSuperseded && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-30 border-4 border-amber-600/30 text-amber-700/30 font-black text-5xl uppercase tracking-widest px-8 py-4 pointer-events-none select-none z-0">
            SUPERSEDED — V{admitCard.version || 1}
          </div>
        )}
        {isRevoked && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-30 border-4 border-rose-600/30 text-rose-700/30 font-black text-5xl uppercase tracking-widest px-8 py-4 pointer-events-none select-none z-0">
            REVOKED / CANCELLED
          </div>
        )}

        {/* TOP SECTION: Header & Identification */}
        <div className="relative z-10">
          {/* 1. INSTITUTIONAL HEADER */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3 gap-3">
            {/* Left: School Crest & Details */}
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 shrink-0 rounded-full border border-slate-300 p-0.5 bg-white">
                <Image
                  src="/school-logo.png"
                  alt="Roshani Public School Crest"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain rounded-full"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLElement
                    target.style.display = 'none'
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-950 leading-tight">
                  {schoolName}
                </h1>
                <p className="text-[11px] font-semibold text-slate-700 tracking-wide mt-0.5">
                  {affiliationText}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
                  Department of Examinations &amp; Academic Evaluation
                </p>
              </div>
            </div>

            {/* Right: Admit Card Banner */}
            <div className="text-right shrink-0">
              <div className="inline-block bg-slate-950 text-white px-3.5 py-1 rounded text-xs font-black uppercase tracking-widest">
                ADMIT CARD
              </div>
              <div className="text-xs sm:text-sm font-black uppercase text-slate-900 mt-1.5 tracking-wide">
                {admitCard.examinationName || 'ANNUAL EXAMINATION'}
              </div>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Session: {admitCard.academicSessionName || '2025–2026'}
              </div>
            </div>
          </div>

          {/* 2. DOCUMENT IDENTIFICATION STRIP */}
          <div className="bg-slate-50 border border-slate-300 rounded px-3.5 py-1.5 mb-3 flex flex-wrap items-center justify-between text-[11px] text-slate-700">
            <div>
              <span className="font-semibold text-slate-500 uppercase text-[9px] mr-1.5">Academic Session:</span>
              <span className="font-bold text-slate-900">{admitCard.academicSessionName || '2025–2026'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 uppercase text-[9px] mr-1.5">Admit Card No:</span>
              <span className="font-mono font-bold text-blue-900">{admitCard.admitCardNumber}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 uppercase text-[9px] mr-1.5">Issue Date:</span>
              <span className="font-bold text-slate-900">{admitCard.issueDate || '15 Mar 2026'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 uppercase text-[9px] mr-1.5">Version:</span>
              <span className="font-mono font-bold text-slate-900">V{admitCard.version || 1}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 uppercase text-[9px]">Status:</span>
              {isSuperseded ? (
                <span className="inline-flex items-center px-2 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  ⚠ SUPERSEDED
                </span>
              ) : isRevoked ? (
                <span className="inline-flex items-center px-2 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                  ✕ REVOKED
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  ✓ ELIGIBLE
                </span>
              )}
            </div>
          </div>

          {/* 3. CANDIDATE DETAILS BLOCK + PHOTO */}
          <div className="grid grid-cols-12 gap-3 border border-slate-300 p-3 rounded bg-slate-50/50 mb-3.5 text-xs">
            {/* Student Meta Details: 9 cols */}
            <div className="col-span-9 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Candidate Name</span>
                <span className="font-extrabold text-sm text-slate-950 tracking-tight">{admitCard.studentName}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Father&apos;s Name</span>
                <span className="font-bold text-slate-900">{admitCard.fatherName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Mother&apos;s Name</span>
                <span className="font-bold text-slate-900">{admitCard.motherName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Class &amp; Section</span>
                <span className="font-extrabold text-slate-950">{admitCard.className} {admitCard.sectionName ? `(${admitCard.sectionName})` : ''}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Roll Number</span>
                <span className="font-mono font-bold text-slate-950 text-xs">{admitCard.rollNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Admission Number</span>
                <span className="font-mono font-bold text-slate-950 text-xs">{admitCard.admissionNumber}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Date of Birth</span>
                <span className="font-mono font-bold text-slate-900">{admitCard.dateOfBirth || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Gender / House</span>
                <span className="font-bold text-slate-900">{admitCard.gender || 'N/A'} • {admitCard.house || 'Tagore'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Document Fingerprint</span>
                <span className="font-mono font-bold text-blue-900 text-[10px]">{admitCard.documentFingerprint || `RPS-AC-2026-${admitCard.admitCardNumber.slice(-4)}`}</span>
              </div>
            </div>

            {/* Candidate Photograph: 3 cols */}
            <div className="col-span-3 flex flex-col items-center justify-center pl-2 border-l border-slate-200">
              <div className="w-24 h-28 sm:w-26 sm:h-30 border-[1.5px] border-slate-400 rounded bg-slate-100 flex items-center justify-center overflow-hidden relative shadow-2xs">
                {admitCard.photoUrl ? (
                  // eslint-disable-next-next/no-img-element
                  <img
                    src={admitCard.photoUrl}
                    alt={admitCard.studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PHOTO</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">AFFIX PASSPORT SIZE PHOTO</div>
                  </div>
                )}
              </div>
              <div className="mt-1 text-[8px] font-mono font-semibold uppercase text-slate-500">
                Candidate Photo
              </div>
            </div>
          </div>

          {/* 4. EXAMINATION SCHEDULE TABLE */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-3 bg-slate-900"></span>
                EXAMINATION SCHEDULE
              </h3>
              <span className="text-[10px] font-semibold text-slate-500">
                Reporting Time: 15 minutes before scheduled start
              </span>
            </div>

            <table className="w-full text-left border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 uppercase font-black text-[10px] border-b border-slate-400">
                  <th className="border-r border-slate-300 p-1.5 text-center w-8">S.No.</th>
                  <th className="border-r border-slate-300 p-1.5 w-16 text-center">Type</th>
                  <th className="border-r border-slate-300 p-1.5 w-20">Code</th>
                  <th className="border-r border-slate-300 p-1.5">Subject Name</th>
                  <th className="border-r border-slate-300 p-1.5 w-24">Exam Date</th>
                  <th className="border-r border-slate-300 p-1.5 w-32">Exam Time</th>
                  <th className="border-r border-slate-300 p-1.5 text-center w-16">Status</th>
                  <th className="p-1.5 text-center w-28">Invigilator Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-900">
                {admitCard.timetable && admitCard.timetable.length > 0 ? (
                  admitCard.timetable.map((t, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="border-r border-slate-300 p-1.5 text-center font-bold text-slate-600 text-[11px]">
                        {t.sNo || idx + 1}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 text-center font-bold text-[10px] text-slate-700">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300">
                          {t.subjectType || 'Theory'}
                        </span>
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-mono font-bold text-blue-900 text-[11px]">
                        {t.subjectCode}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-extrabold text-slate-950 text-[11px]">
                        {t.subjectName}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-semibold text-slate-900 text-[11px]">
                        {t.date} <span className="text-[9px] text-slate-500">({t.day})</span>
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-mono text-[10px] font-bold text-slate-800">
                        {t.startTime} – {t.endTime}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 text-center">
                        <span className="text-emerald-700 font-bold text-[10px]">Eligible</span>
                      </td>
                      <td className="p-1.5 text-center">
                        <div className="border-b border-dotted border-slate-400 w-full h-4"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-500 italic">
                      Examination subject schedule entries are being finalized.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 5. EXAMINATION CENTER & VENUE */}
          <div className="border border-slate-300 rounded bg-slate-50 px-3 py-1.5 mb-3 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[9px] mr-2">EXAMINATION CENTER:</span>
              <span className="font-extrabold text-slate-950">{admitCard.examinationCenter || 'Roshani Public School — Main Campus'}</span>
            </div>
            <div className="text-[11px]">
              <span className="text-slate-500 font-bold uppercase text-[9px] mr-1.5">Assigned Hall / Room:</span>
              <span className="font-mono font-bold text-slate-900">{admitCard.examCenterRoom || 'Hall No. 1 / Main Academic Block'}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Instructions, Signatures, QR & Official Footer */}
        <div className="relative z-10">
          {/* 6. IMPORTANT INSTRUCTIONS */}
          <div className="border border-slate-300 rounded p-2.5 bg-slate-50/70 mb-3 text-[10px] text-slate-700 leading-tight">
            <h4 className="font-black uppercase tracking-wider text-slate-950 text-[10px] mb-1 flex items-center gap-1">
              <span>⚠️</span> IMPORTANT EXAMINATION INSTRUCTIONS
            </h4>
            <ol className="list-decimal pl-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
              <li>Students must report to the examination room in proper school uniform at least 15 minutes before time.</li>
              <li>Students must carry this official Admit Card and School Identity Card to enter the examination hall.</li>
              <li>Mobile phones, smart watches, calculators, and unauthorized electronics are strictly prohibited.</li>
              <li>Students must not carry unauthorized written material, notes, or paper inside the examination hall.</li>
              <li>Verify all subject codes and ensure answers are neatly recorded in allotted answer sheets.</li>
              <li>No student is permitted to leave the examination room before the final bell is rung.</li>
              <li>Exchange of stationery or unfair means (UFM) will lead to immediate paper cancellation.</li>
              <li>Follow all directions given by the hall invigilator and examination superintendents.</li>
            </ol>
            <div className="border-t border-slate-300/80 mt-1.5 pt-1 text-[9px] text-slate-600 font-medium italic">
              Note: Permission to appear in the examination is subject to fulfillment of the school&apos;s applicable attendance, fee clearance and academic requirements.
            </div>
          </div>

          {/* 7. SIGNATURES & QR VERIFICATION ROW */}
          <div className="grid grid-cols-12 gap-3 items-end pt-2 border-t-2 border-slate-900 mb-2 text-center text-xs font-semibold">
            {/* Student Signature: 3 cols */}
            <div className="col-span-3 pb-1">
              <div className="h-9"></div>
              <p className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                Candidate Signature
              </p>
            </div>

            {/* Class Teacher Signature: 3 cols */}
            <div className="col-span-3 pb-1">
              <div className="h-9"></div>
              <p className="border-t border-slate-400 pt-1 text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                Class Teacher Signature
              </p>
            </div>

            {/* Principal / Authorized Seal: 3 cols */}
            <div className="col-span-3 pb-1">
              <div className="h-9"></div>
              <p className="border-t border-slate-400 pt-1 text-[10px] font-black text-slate-950 uppercase tracking-wider">
                Principal / Controller of Exams
              </p>
            </div>

            {/* QR Anti-Tamper Block: 3 cols */}
            <div className="col-span-3 flex flex-col items-center justify-end pl-2">
              <div className="p-1 bg-white border border-slate-300 rounded shadow-2xs">
                <QRCodeSVG
                  value={verificationUrl}
                  size={58}
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                />
              </div>
              <div className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-600 mt-1">
                SCAN TO VERIFY
              </div>
              <div className="text-[7.5px] font-mono text-slate-400 truncate max-w-[80px]">
                {admitCard.documentFingerprint || admitCard.admitCardNumber}
              </div>
            </div>
          </div>

          {/* 8. OFFICIAL DOCUMENT FOOTER */}
          <div className="border-t border-slate-300 pt-1 flex justify-between items-center text-[9px] text-slate-500 font-mono">
            <div>ROSHANI PUBLIC SCHOOL • OFFICIAL EXAMINATION DOCUMENT</div>
            <div>DOC ID: {admitCard.documentFingerprint || admitCard.admitCardNumber}</div>
            <div>VER: {admitCard.version || 1}.0 • PAGE 1 OF 1</div>
          </div>
        </div>

      </div>
    </div>
  )
}
