import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getStudents } from '@/lib/students/actions'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'

interface Props {
  searchParams: Promise<{
    search?: string
    status?: string
    sessionId?: string
    classId?: string
    gender?: string
    page?: string
  }>
}

export default async function StudentsListPage({ searchParams }: Props) {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  if (!hasAnyRole(authState.user, ['Super Admin', 'Admin'])) {
    redirect('/erp/unauthorized')
  }

  const sParams = await searchParams
  const search = sParams.search || ''
  const status = sParams.status || 'all'
  const sessionId = sParams.sessionId || ''
  const classId = sParams.classId || ''
  const gender = sParams.gender || 'all'
  const page = parseInt(sParams.page || '1', 10)

  const [studentsRes, sessionsRes, classesRes] = await Promise.all([
    getStudents({ search, status, sessionId, classId, gender, page, limit: 15 }),
    getAcademicSessions(),
    getClasses(),
  ])

  const students: any[] = studentsRes.success ? studentsRes.data.students : []
  const pagination = studentsRes.success ? studentsRes.data : { total: 0, totalPages: 1, page: 1 }
  const sessions: any[] = sessionsRes.success ? sessionsRes.data : []
  const classes: any[] = classesRes.success ? classesRes.data : []

  const statusBadgeColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-amber-50 text-amber-700 border-amber-200',
    alumni: 'bg-blue-50 text-blue-700 border-blue-200',
    transferred: 'bg-purple-50 text-purple-700 border-purple-200',
    withdrawn: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  return (
    <div className="flex-1 bg-slate-50 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Enrolled students, academic assignments, guardian details, and profiles.
          </p>
        </div>
        <Link
          href="/erp/admin/students/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
        >
          + Direct Enrollment
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Admission #, Name..."
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              name="status"
              defaultValue={status}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="alumni">Alumni</option>
              <option value="transferred">Transferred</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Session</label>
            <select
              name="sessionId"
              defaultValue={sessionId}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
            <select
              name="classId"
              defaultValue={classId}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm py-2 px-3 rounded-md transition"
            >
              Filter
            </button>
            <Link
              href="/erp/admin/students"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm py-2 px-3 rounded-md transition text-center"
            >
              Clear
            </Link>
          </div>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Admission #</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class & Section</th>
                <th className="py-3 px-4">Roll #</th>
                <th className="py-3 px-4">Primary Guardian</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No student records found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                students.map((st: any) => {
                  const activeHistory = Array.isArray(st.student_academic_history)
                    ? st.student_academic_history.find((h: any) => h.status === 'active') || st.student_academic_history[0]
                    : null
                  const primaryGuardian = Array.isArray(st.student_guardians)
                    ? st.student_guardians.find((g: any) => g.is_primary)?.guardians || st.student_guardians[0]?.guardians
                    : null

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {st.admission_number}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {st.first_name} {st.middle_name ? st.middle_name + ' ' : ''}{st.last_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {activeHistory
                          ? `${activeHistory.classes?.name || ''} - ${activeHistory.sections?.name || ''}`
                          : 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {activeHistory?.roll_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {primaryGuardian ? (
                          <div>
                            <div className="font-medium text-slate-800">{primaryGuardian.full_name}</div>
                            <div className="text-xs text-slate-400">{primaryGuardian.phone}</div>
                          </div>
                        ) : (
                          'None'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            statusBadgeColors[st.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {st.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/erp/admin/students/${st.id}`}
                          className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 hover:text-blue-800 text-xs font-semibold rounded transition"
                        >
                          View Profile &rarr;
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Page <span className="font-semibold text-slate-700">{pagination.page}</span> of{' '}
              <span className="font-semibold text-slate-700">{pagination.totalPages}</span> ({pagination.total} students)
            </div>
            <div className="flex space-x-2">
              {pagination.page > 1 && (
                <Link
                  href={`/erp/admin/students?page=${pagination.page - 1}&search=${search}&status=${status}&sessionId=${sessionId}&classId=${classId}&gender=${gender}`}
                  className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Previous
                </Link>
              )}
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/erp/admin/students?page=${pagination.page + 1}&search=${search}&status=${status}&sessionId=${sessionId}&classId=${classId}&gender=${gender}`}
                  className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
