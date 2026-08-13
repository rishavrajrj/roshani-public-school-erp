'use client'

import type { StudentResult } from '@/types/result'

interface Props {
  result: StudentResult
  schoolName?: string
}

export function ResultDocument({ result, schoolName = 'Roshani Public School' }: Props) {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto border-2 border-slate-900 shadow-lg text-slate-900 print:shadow-none print:max-w-none print:w-full print:border-none print:p-0">
      {/* Header Banner */}
      <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">{schoolName}</h1>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-1">Senior Secondary Education | Annual Evaluation Cell</p>
        <div className="inline-block bg-slate-900 text-white px-4 py-1 mt-3 rounded text-sm font-bold uppercase tracking-widest">
          OFFICIAL MARKS STATEMENT — {result.academicSessionName || '2026-27'}
        </div>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-6 border border-slate-300 p-4 mb-6 rounded text-xs bg-slate-50">
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Student Name</span>
          <span className="font-bold text-sm text-slate-900">{result.studentName}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Examination</span>
          <span className="font-bold text-sm text-indigo-700">{result.examinationName} ({result.examinationCode})</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Admission Number</span>
          <span className="font-mono font-semibold text-slate-900">{result.admissionNumber}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Roll Number</span>
          <span className="font-mono font-semibold text-slate-900">{result.rollNumber || 'N/A'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Class / Section</span>
          <span className="font-bold text-slate-900">{result.className} {result.sectionName ? `(${result.sectionName})` : ''}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Father&apos;s Name</span>
          <span className="font-semibold text-slate-900">{result.fatherName}</span>
        </div>
      </div>

      {/* Subject Marks Breakdown Table */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
          SUBJECT EVALUATION BREAKDOWN
        </h3>
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
              <th className="border border-slate-300 p-2">Code</th>
              <th className="border border-slate-300 p-2">Subject Name</th>
              <th className="border border-slate-300 p-2 text-center">Theory</th>
              <th className="border border-slate-300 p-2 text-center">Practical</th>
              <th className="border border-slate-300 p-2 text-center">Internal</th>
              <th className="border border-slate-300 p-2 text-center">Total Obtained</th>
              <th className="border border-slate-300 p-2 text-center">Max Marks</th>
              <th className="border border-slate-300 p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {result.subjectMarks && result.subjectMarks.length > 0 ? (
              result.subjectMarks.map((sm, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{sm.subjectCode}</td>
                  <td className="border border-slate-300 p-2 font-bold text-slate-900">{sm.subjectName}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{sm.theoryMarksObtained}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{sm.practicalMarksObtained}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{sm.internalMarksObtained}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold font-mono text-slate-900">{sm.totalMarksObtained}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono text-slate-500">{sm.maximumMarks || 100}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold">
                    {sm.attendanceStatus !== 'present' ? (
                      <span className="text-amber-600 uppercase text-[10px]">{sm.attendanceStatus}</span>
                    ) : sm.isPass ? (
                      <span className="text-emerald-700">PASS</span>
                    ) : (
                      <span className="text-rose-700">FAIL</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border border-slate-300 p-4 text-center text-slate-500">
                  Subject mark entries pending calculation.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
              <td colSpan={5} className="border border-slate-300 p-2 text-right uppercase">GRAND TOTAL:</td>
              <td className="border border-slate-300 p-2 text-center font-mono text-sm">{result.totalMarksObtained}</td>
              <td className="border border-slate-300 p-2 text-center font-mono text-sm">{result.maximumMarks}</td>
              <td className="border border-slate-300 p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-4 gap-4 bg-slate-900 text-white p-4 rounded-lg mb-6 text-center">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Marks</span>
          <span className="text-lg font-bold font-mono">{result.totalMarksObtained} / {result.maximumMarks}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Percentage</span>
          <span className="text-lg font-bold font-mono text-indigo-300">{result.percentage}%</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Overall Grade</span>
          <span className="text-lg font-black">{result.grade || '—'}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Result Status</span>
          <span className={['text-lg font-black uppercase', result.resultStatus === 'PASS' ? 'text-emerald-400' : 'text-rose-400'].join(' ')}>
            {result.resultStatus}
          </span>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-300 text-center text-xs font-semibold text-slate-700">
        <div>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1">Class Teacher Signature</p>
        </div>
        <div>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1">Exam Cell Coordinator</p>
        </div>
        <div>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1 font-bold text-slate-900">Principal Signature &amp; Seal</p>
        </div>
      </div>
    </div>
  )
}
