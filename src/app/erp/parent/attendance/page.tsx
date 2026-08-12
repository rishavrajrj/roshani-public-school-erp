import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getParentAttendanceData } from '@/lib/attendance/queries'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    studentId?: string
  }>
}

export default async function ParentAttendancePage({ searchParams }: PageProps) {
  const params = await searchParams
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    return <div className="p-8 text-red-600">Unauthorized session</div>
  }

  const user = authState.user
  if (!hasAnyRole(user, ['Parent'])) {
    return <div className="p-8 text-red-600">Access Denied. Parent privileges required.</div>
  }

  const data = await getParentAttendanceData(params.studentId)

  if (!data || data.children.length === 0 || !data.selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center text-slate-600">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Child Attendance</h1>
        <p className="text-sm">No linked student profiles found for your account. Please contact school administration.</p>
      </div>
    )
  }

  const { children, selectedStudent, records, summary } = data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Child Attendance</h1>
        <p className="text-sm text-slate-600">View real-time daily attendance records and percentages for your children.</p>
      </div>

      {/* Child Switcher Tabs */}
      {children.length > 1 && (
        <div className="flex border-b border-slate-200 mb-6 space-x-4">
          {children.map((c) => (
            <Link
              key={c.id}
              href={`/erp/parent/attendance?studentId=${c.id}`}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                c.id === selectedStudent.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {c.name} ({c.admissionNumber})
            </Link>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Days</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summary.totalSchoolDays}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm text-center">
            <div className="text-xs font-semibold text-emerald-800 uppercase">Present</div>
            <div className="text-2xl font-bold text-emerald-900 mt-1">{summary.presentCount}</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-sm text-center">
            <div className="text-xs font-semibold text-rose-800 uppercase">Absent</div>
            <div className="text-2xl font-bold text-rose-900 mt-1">{summary.absentCount}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm text-center">
            <div className="text-xs font-semibold text-amber-800 uppercase">Late</div>
            <div className="text-2xl font-bold text-amber-900 mt-1">{summary.lateCount}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm text-center">
            <div className="text-xs font-semibold text-blue-800 uppercase">Leave</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{summary.leaveCount}</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-sm text-center col-span-2 sm:col-span-1">
            <div className="text-xs font-semibold text-indigo-800 uppercase">Attendance %</div>
            <div className="text-2xl font-bold text-indigo-900 mt-1">{summary.attendancePercentage}%</div>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Attendance Log for {selectedStudent.name}</h2>
          <span className="text-xs text-slate-500 font-mono">Admission: {selectedStudent.admissionNumber}</span>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No attendance records found for this student.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Class & Section</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((r) => {
                  let badgeClass = 'bg-emerald-100 text-emerald-800'
                  if (r.status === 'absent') badgeClass = 'bg-rose-100 text-rose-800'
                  if (r.status === 'late') badgeClass = 'bg-amber-100 text-amber-800'
                  if (r.status === 'leave') badgeClass = 'bg-blue-100 text-blue-800'

                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{r.date}</td>
                      <td className="px-6 py-4">{r.className} — Sec {r.sectionName}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md capitalize ${badgeClass}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{r.remarks || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
