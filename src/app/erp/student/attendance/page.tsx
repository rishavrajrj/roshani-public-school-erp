import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getStudentSelfAttendanceData } from '@/lib/attendance/queries'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarCheck, Users, Clock, AlertCircle } from 'lucide-react'

export default async function StudentAttendancePage() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    return <div className="p-8 text-red-600">Unauthorized session</div>
  }

  const user = authState.user
  if (!hasAnyRole(user, ['Student'])) {
    return <div className="p-8 text-red-600">Access Denied. Student privileges required.</div>
  }

  const data = await getStudentSelfAttendanceData()

  if (!data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Student Profile Not Linked"
        description="No linked student records were found for your user account. Please contact school administration."
      />
    )
  }

  const { studentName, admissionNumber, records, summary } = data

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="My Attendance Record"
        description="View your personal attendance history, monthly presence percentage, and attendance remarks."
        breadcrumbs={[
          { label: 'Student Portal', href: '/erp/student' },
          { label: 'Attendance' },
        ]}
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Days</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{summary.totalSchoolDays}</div>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl shadow-xs text-center">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Present</div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{summary.presentCount}</div>
          </div>
          <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-2xl shadow-xs text-center">
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Absent</div>
            <div className="text-2xl font-black text-rose-900 mt-1">{summary.absentCount}</div>
          </div>
          <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl shadow-xs text-center">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Late</div>
            <div className="text-2xl font-black text-amber-900 mt-1">{summary.lateCount}</div>
          </div>
          <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl shadow-xs text-center">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Leave</div>
            <div className="text-2xl font-black text-blue-900 mt-1">{summary.leaveCount}</div>
          </div>
          <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-2xl shadow-xs text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Attendance %</div>
            <div className="text-2xl font-black text-indigo-900 mt-1">{summary.attendancePercentage}%</div>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap justify-between items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">{studentName}</span>
          <span className="text-xs text-slate-500 font-mono">Admission No: {admissionNumber}</span>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
            No attendance records found for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Class &amp; Section</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.date}</td>
                    <td className="py-3.5 px-4 text-slate-600">{r.className} — Sec {r.sectionName}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{r.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
