'use client'

import type { StudentResult } from '@/types/result'

interface Props {
  result: StudentResult
  historicalResults?: StudentResult[]
  schoolName?: string
  schoolAddress?: string
  affiliationNo?: string
}

export function ResultDocument({
  result,
  historicalResults = [],
  schoolName = 'ROSHANI PUBLIC SCHOOL',
  schoolAddress = 'Station Road, Samastipur, Bihar - 848101',
  affiliationNo = 'CBSE Affiliation No: 330892',
}: Props) {
  const marks = result.subjectMarks || []

  // Detect whether practical or internal columns are genuinely present across any subject
  const hasTheory = marks.some((m) => (m.theoryMarksObtained || 0) > 0)
  const hasPractical = marks.some((m) => (m.practicalMarksObtained || 0) > 0)
  const hasInternal = marks.some((m) => (m.internalMarksObtained || 0) > 0)

  // Calculate SGPA and CGPA
  const resolveSubjectGrade = (pct: number): { grade: string; gradePoint: number } => {
    if (pct >= 91) return { grade: 'A1', gradePoint: 10.0 }
    if (pct >= 81) return { grade: 'A2', gradePoint: 9.0 }
    if (pct >= 71) return { grade: 'B1', gradePoint: 8.0 }
    if (pct >= 61) return { grade: 'B2', gradePoint: 7.0 }
    if (pct >= 51) return { grade: 'C1', gradePoint: 6.0 }
    if (pct >= 41) return { grade: 'C2', gradePoint: 5.0 }
    if (pct >= 33) return { grade: 'D', gradePoint: 4.0 }
    return { grade: 'E', gradePoint: 0.0 }
  }

  let totalGp = 0
  let passedCount = 0
  let failedCount = 0

  marks.forEach((sm) => {
    const maxM = sm.maximumMarks || 100
    const pct = maxM > 0 ? (sm.totalMarksObtained / maxM) * 100 : 0
    const { gradePoint } = resolveSubjectGrade(pct)
    totalGp += gradePoint
    if (sm.isPass && sm.attendanceStatus === 'present') {
      passedCount++
    } else {
      failedCount++
    }
  })

  const currentSgpa = marks.length > 0 ? Number((totalGp / marks.length).toFixed(2)) : Number((result.percentage / 10).toFixed(2))
  
  // Calculate CGPA across all available results
  const allSgpas = historicalResults.length > 0
    ? historicalResults.map(r => Number((r.percentage / 10).toFixed(2)))
    : [currentSgpa]
  const cgpa = Number((allSgpas.reduce((a, b) => a + b, 0) / allSgpas.length).toFixed(2))

  const totalCredits = marks.length * 4 || 20
  const creditsEarned = failedCount === 0 ? totalCredits : (passedCount * 4)

  const formattedDate = result.publishedAt
    ? new Date(result.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="bg-white p-6 sm:p-10 max-w-4xl mx-auto border-2 border-slate-900 shadow-xl text-slate-900 rounded-sm print:shadow-none print:max-w-none print:w-full print:border-none print:p-0 print:m-0">
      {/* Header Banner */}
      <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xl ring-2 ring-slate-900 ring-offset-2">
            RPS
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900">{schoolName}</h1>
            <p className="text-xs font-semibold text-slate-600 tracking-wide mt-0.5">{schoolAddress}</p>
          </div>
        </div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{affiliationNo} • ISO 9001:2015 Certified</p>
        
        <div className="inline-block bg-slate-900 text-white px-5 py-1.5 mt-4 rounded text-xs sm:text-sm font-black uppercase tracking-widest shadow-sm">
          STATEMENT OF MARKS (PROVISIONAL)
        </div>
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-2">
          {result.className} {result.sectionName ? `(Section ${result.sectionName})` : ''} • {result.examinationName} ({result.academicSessionName || '2025–26'})
        </div>
      </div>

      {/* Student Information Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 border border-slate-300 p-4 mb-6 rounded text-xs bg-slate-50/80">
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Name of Student</span>
          <span className="font-bold text-sm text-slate-900 uppercase">{result.studentName}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Father&apos;s Name</span>
          <span className="font-semibold text-xs sm:text-sm text-slate-900 uppercase">{result.fatherName || 'N/A'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Enrollment / Adm. No</span>
          <span className="font-mono font-bold text-slate-900">{result.admissionNumber}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Roll Number</span>
          <span className="font-mono font-bold text-slate-900">{result.rollNumber || 'N/A'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Class &amp; Section</span>
          <span className="font-bold text-slate-900">{result.className} {result.sectionName ? `• ${result.sectionName}` : ''}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Academic Session</span>
          <span className="font-bold text-slate-900">{result.academicSessionName || '2025–26'}</span>
        </div>
      </div>

      {/* Subject Performance Table */}
      <div className="mb-6 overflow-x-auto">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
          <span>SUBJECT EVALUATION &amp; SCHOLASTIC PERFORMANCE</span>
          <span className="text-[10px] text-slate-500 font-medium">PASS CRITERIA: 33% AGGREGATE</span>
        </h3>
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
              <th className="border border-slate-300 p-2.5">Code</th>
              <th className="border border-slate-300 p-2.5">Subject Title</th>
              {hasTheory && <th className="border border-slate-300 p-2 text-center">Theory</th>}
              {hasPractical && <th className="border border-slate-300 p-2 text-center">Practical</th>}
              {hasInternal && <th className="border border-slate-300 p-2 text-center">Internal</th>}
              <th className="border border-slate-300 p-2 text-center font-bold">Total Obt.</th>
              <th className="border border-slate-300 p-2 text-center text-slate-600">Max</th>
              <th className="border border-slate-300 p-2 text-center text-slate-600">Min</th>
              <th className="border border-slate-300 p-2 text-center">Grade</th>
              <th className="border border-slate-300 p-2 text-center">GP</th>
              <th className="border border-slate-300 p-2 text-center font-bold">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {marks && marks.length > 0 ? (
              marks.map((sm, idx) => {
                const maxMarks = sm.maximumMarks || 100
                const minMarks = sm.passingMarks || Math.round(maxMarks * 0.33)
                const pct = maxMarks > 0 ? (sm.totalMarksObtained / maxMarks) * 100 : 0
                const { grade, gradePoint } = resolveSubjectGrade(pct)
                const isPass = sm.isPass && sm.attendanceStatus === 'present'

                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 font-mono font-bold text-slate-700">{sm.subjectCode || `SUB${idx+1}`}</td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">{sm.subjectName}</td>
                    {hasTheory && <td className="border border-slate-300 p-2 text-center font-mono">{sm.theoryMarksObtained}</td>}
                    {hasPractical && <td className="border border-slate-300 p-2 text-center font-mono">{sm.practicalMarksObtained}</td>}
                    {hasInternal && <td className="border border-slate-300 p-2 text-center font-mono">{sm.internalMarksObtained}</td>}
                    <td className="border border-slate-300 p-2 text-center font-bold font-mono text-slate-900 bg-slate-50/50">
                      {sm.totalMarksObtained}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-slate-500">{maxMarks}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-slate-500">{minMarks}</td>
                    <td className="border border-slate-300 p-2 text-center font-black text-indigo-900">{grade}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-slate-700">{gradePoint.toFixed(1)}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">
                      {sm.attendanceStatus !== 'present' ? (
                        <span className="text-amber-600 uppercase text-[10px]">{sm.attendanceStatus}</span>
                      ) : isPass ? (
                        <span className="text-emerald-700">Pass</span>
                      ) : (
                        <span className="text-rose-700">Fail</span>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={11} className="border border-slate-300 p-6 text-center text-slate-500 italic">
                  Subject evaluation entries are currently being processed.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
              <td colSpan={hasTheory || hasPractical || hasInternal ? 2 + (hasTheory ? 1 : 0) + (hasPractical ? 1 : 0) + (hasInternal ? 1 : 0) : 2} className="border border-slate-300 p-2.5 text-right uppercase tracking-wider text-[11px]">
                GRAND TOTAL:
              </td>
              <td className="border border-slate-300 p-2.5 text-center font-mono font-black text-sm text-slate-900 bg-slate-200/60">
                {result.totalMarksObtained}
              </td>
              <td className="border border-slate-300 p-2.5 text-center font-mono text-xs text-slate-700">
                {result.maximumMarks}
              </td>
              <td colSpan={4} className="border border-slate-300 p-2.5 text-right font-bold text-xs text-slate-700">
                Overall Percentage: <span className="font-mono text-indigo-700 font-black">{result.percentage.toFixed(2)}%</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Result Metrics & Academic Progression Summary (Inspired by attached marksheet) */}
      <div className="border border-slate-300 bg-slate-50 p-4 rounded-lg mb-6 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="border-r border-slate-200 last:border-r-0">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Credits Registered</span>
            <span className="text-base font-bold font-mono text-slate-900">{totalCredits}</span>
          </div>
          <div className="border-r border-slate-200 last:border-r-0">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Credits Earned</span>
            <span className="text-base font-bold font-mono text-emerald-700">{creditsEarned} / {totalCredits}</span>
          </div>
          <div className="border-r border-slate-200 last:border-r-0">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Exam SGPA / GPA</span>
            <span className="text-base font-bold font-mono text-indigo-700">{currentSgpa.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Overall Result</span>
            <span className={`text-base font-black uppercase ${result.resultStatus === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {result.resultStatus}
            </span>
          </div>
        </div>

        {/* Previous Examination / Half-Yearly & Yearly Progression Strip */}
        {historicalResults.length > 1 && (
          <div className="pt-3 border-t border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-700">
            <div className="flex flex-wrap items-center gap-4 font-mono">
              {historicalResults.slice(0, 4).map((hr, idx) => (
                <div key={idx} className="bg-white px-2.5 py-1 rounded border border-slate-200 text-[11px]">
                  <span className="text-slate-500 font-sans font-medium">{hr.examinationName?.substring(0, 12)}: </span>
                  <span className="font-bold text-slate-900">{hr.percentage.toFixed(1)}%</span>
                  <span className="text-slate-400 ml-1">({(hr.percentage / 10).toFixed(2)} SGPA)</span>
                </div>
              ))}
            </div>
            <div className="font-bold text-slate-900 bg-slate-900 text-white px-3 py-1 rounded text-xs">
              Cumulative CGPA: {cgpa.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Barcode, Instructions & Security Note */}
      <div className="border-t border-slate-300 pt-4 mb-8 text-[10px] text-slate-600 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="font-mono text-slate-800 font-bold tracking-widest text-xs">
            *RPS{(result.admissionNumber || '000').replace(/\D/g, '')}EXAM{result.examinationId.substring(0, 6).toUpperCase()}*
          </div>
          <div className="font-semibold text-slate-500">
            Official System Generated Document
          </div>
        </div>
        <p className="font-bold text-slate-800">INSTRUCTIONS &amp; STATUTORY RULES:</p>
        <p>1. This is a computer-generated provisional statement of marks issued by the examination cell.</p>
        <p>2. A candidate is declared passed upon securing at least 33% marks in aggregate as well as individually in each theory and practical component.</p>
        <p>3. In case of any discrepancy or query regarding marks entry, report to the Examination Controller within 15 days of publication.</p>
      </div>

      {/* Official Signatures */}
      <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-900 text-center text-xs font-bold text-slate-800 break-inside-avoid print:break-inside-avoid">
        <div>
          <div className="text-[11px] text-slate-500 font-medium mb-1">Date of Issue: {formattedDate}</div>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1 uppercase">Class Teacher</p>
        </div>
        <div>
          <div className="h-14"></div>
          <p className="border-t border-slate-400 pt-1 uppercase">Exam Coordinator</p>
        </div>
        <div>
          <div className="h-14"></div>
          <p className="border-t border-slate-400 pt-1 uppercase text-slate-900 font-black">Principal &amp; Seal</p>
        </div>
      </div>
    </div>
  )
}


