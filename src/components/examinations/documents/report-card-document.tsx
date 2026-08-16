'use client'

import type { ReportCard } from '@/types/document'

interface Props {
  reportCard: ReportCard
  schoolName?: string
}

export function ReportCardDocument({ reportCard, schoolName = 'Roshani Public School' }: Props) {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto border-4 border-double border-slate-900 shadow-xl text-slate-900 print:shadow-none print:max-w-none print:w-full print:border-2 print:p-4">
      {/* School Branding Header */}
      <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">{schoolName}</h1>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-1">Turkauliya, East Champaran, Bihar – 845437</p>
        <p className="text-[10px] text-slate-500 font-serif italic mt-0.5">Affiliated to CBSE, New Delhi (Affiliation No. 330943, School Code: 66664)</p>
        <div className="inline-block bg-slate-900 text-white px-6 py-1.5 mt-3 rounded text-sm font-black uppercase tracking-widest">
          ANNUAL PROGRESS REPORT CARD — SESSION {reportCard.academicSessionName || '2026-27'}
        </div>
      </div>

      {/* Student Metadata Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 border border-slate-300 p-4 mb-6 rounded text-xs bg-slate-50">
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Student Name</span>
          <span className="font-bold text-sm text-slate-900">{reportCard.studentName}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Admission Number</span>
          <span className="font-mono font-bold text-slate-900">{reportCard.admissionNumber}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Roll Number</span>
          <span className="font-mono font-bold text-slate-900">{reportCard.rollNumber || 'N/A'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Class / Section</span>
          <span className="font-bold text-slate-900">{reportCard.className} {reportCard.sectionName ? `(${reportCard.sectionName})` : ''}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Father&apos;s Name</span>
          <span className="font-semibold text-slate-900">{reportCard.fatherName}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold text-[10px] block">Examination</span>
          <span className="font-bold text-indigo-700">{reportCard.examinationName}</span>
        </div>
      </div>

      {/* Subject Marks Breakdown Table */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
          ACADEMIC PERFORMANCE EVALUATION
        </h3>
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
              <th className="border border-slate-300 p-2">Code</th>
              <th className="border border-slate-300 p-2">Subject Title</th>
              <th className="border border-slate-300 p-2 text-center">Theory</th>
              <th className="border border-slate-300 p-2 text-center">Practical</th>
              <th className="border border-slate-300 p-2 text-center">Internal</th>
              <th className="border border-slate-300 p-2 text-center">Obtained</th>
              <th className="border border-slate-300 p-2 text-center">Max Marks</th>
              <th className="border border-slate-300 p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {reportCard.subjectMarks && reportCard.subjectMarks.length > 0 ? (
              reportCard.subjectMarks.map((sm, idx) => (
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
                  Academic performance summary snapshot attached.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Attendance & Scoreboard Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Attendance Summary */}
        <div className="border border-slate-300 p-4 rounded-lg bg-slate-50 text-xs space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
            ATTENDANCE RECORD
          </h4>
          <div className="grid grid-cols-2 gap-2 text-slate-700">
            <div>Total School Days: <span className="font-bold font-mono text-slate-900">{reportCard.attendanceDays}</span></div>
            <div>Days Present: <span className="font-bold font-mono text-slate-900">{reportCard.presentDays}</span></div>
            <div>Days Absent: <span className="font-bold font-mono text-slate-900">{reportCard.absentDays}</span></div>
            <div>Approved Leave: <span className="font-bold font-mono text-slate-900">{reportCard.leaveDays}</span></div>
          </div>
          <div className="pt-2 border-t text-sm font-bold text-slate-900">
            Attendance Percentage: <span className="text-indigo-700 font-mono">{reportCard.attendanceDays > 0 ? `${reportCard.attendancePercentage}%` : 'N/A'}</span>
          </div>
        </div>

        {/* Overall Evaluation Summary */}
        <div className="bg-slate-900 text-white p-4 rounded-lg text-xs space-y-2 flex flex-col justify-between">
          <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-400 border-b border-slate-700 pb-1">
            OVERALL ACADEMIC RESULT
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Percentage</span>
              <span className="text-lg font-bold font-mono text-indigo-300">{reportCard.overallPercentage}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Grade</span>
              <span className="text-lg font-black">{reportCard.overallGrade || '—'}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black uppercase">
            <span>Result Outcome:</span>
            <span className={reportCard.resultStatus === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>{reportCard.resultStatus}</span>
          </div>
        </div>
      </div>

      {/* Promotion Status Banner */}
      <div className="bg-slate-100 border border-slate-300 p-4 rounded-lg mb-6 flex justify-between items-center text-xs font-bold text-slate-900">
        <span className="uppercase tracking-wider">ACADEMIC PROMOTION DECISION:</span>
        <span className="px-3 py-1 bg-slate-900 text-white rounded text-sm uppercase tracking-widest font-black">
          {reportCard.promotionStatus}
        </span>
      </div>

      {/* Remarks Section */}
      <div className="border border-slate-300 p-4 rounded-lg mb-6 text-xs space-y-3 bg-slate-50">
        <div>
          <span className="font-bold text-slate-900 uppercase block mb-1">Class Teacher Remarks:</span>
          <p className="text-slate-700 italic border-l-2 border-indigo-500 pl-3 py-1">
            &quot;{reportCard.teacherRemarks || 'Demonstrates consistent academic effort and positive classroom behavior.'}&quot;
          </p>
        </div>
        {reportCard.principalRemarks && (
          <div>
            <span className="font-bold text-slate-900 uppercase block mb-1">Principal Remarks:</span>
            <p className="text-slate-700 italic border-l-2 border-slate-900 pl-3 py-1">
              &quot;{reportCard.principalRemarks}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Signatures & QR Token Verification Footer */}
      <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-xs font-semibold text-slate-700 items-end">
        <div>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1">Class Teacher Signature</p>
        </div>
        <div className="text-[10px] text-slate-500 space-y-1">
          <div className="font-mono text-[9px] text-slate-400">TOKEN: {reportCard.verificationToken.slice(0, 18)}...</div>
          <p className="font-bold text-slate-900 text-[10px]">Document Version: V{reportCard.version}</p>
        </div>
        <div>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1 font-bold text-slate-900">Principal Signature &amp; Seal</p>
        </div>
      </div>
    </div>
  )
}
