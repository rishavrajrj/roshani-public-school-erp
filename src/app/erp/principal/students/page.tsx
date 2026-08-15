import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getStudents } from '@/lib/students/actions'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Search, Users, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  searchParams: Promise<{
    search?: string
    status?: string
    sessionId?: string
    classId?: string
    page?: string
  }>
}

export default async function PrincipalStudentsPage({ searchParams }: Props) {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  if (!hasAnyRole(authState.user, ['Principal'])) {
    redirect('/erp/unauthorized')
  }

  const sParams = await searchParams
  const search = sParams.search || ''
  const status = sParams.status || 'all'
  const sessionId = sParams.sessionId || ''
  const classId = sParams.classId || ''
  const page = parseInt(sParams.page || '1', 10)

  const [studentsRes, sessionsRes, classesRes] = await Promise.all([
    getStudents({ search, status, sessionId, classId, page, limit: 15 }),
    getAcademicSessions(),
    getClasses(),
  ])

  const students: any[] = studentsRes.success ? studentsRes.data.students : []
  const pagination = studentsRes.success ? studentsRes.data : { total: 0, totalPages: 1, page: 1 }
  const sessions: any[] = sessionsRes.success ? sessionsRes.data : []
  const classes: any[] = classesRes.success ? classesRes.data : []

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Student Directory &amp; Records"
        description="Access institutional student profiles, academic histories, class enrollments, and status."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/principal' },
          { label: 'Students' },
        ]}
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Admission #, Name..."
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={status}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session</label>
            <select
              name="sessionId"
              defaultValue={sessionId}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
            >
              <option value="">All Sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
            <select
              name="classId"
              defaultValue={classId}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm py-2 px-4 rounded-xl transition"
            >
              Filter
            </button>
            <Link
              href="/erp/principal/students"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm py-2 px-3 rounded-xl transition font-medium text-center"
            >
              Clear
            </Link>
          </div>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {students.length === 0 ? (
          <div className="p-6 sm:p-12">
            <EmptyState
              icon={Users}
              title="No students found"
              description="No student records match the selected filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Admission #</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class &amp; Section</th>
                  <th className="py-3.5 px-4">Roll #</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st: any) => {
                  const activeHistory = Array.isArray(st.student_academic_history)
                    ? st.student_academic_history.find((h: any) => h.status === 'active') ||
                      st.student_academic_history[0]
                    : null
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{st.admission_number}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {st.first_name} {st.last_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {activeHistory ? `${activeHistory.classes?.name} - ${activeHistory.sections?.name}` : 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{activeHistory?.roll_number || '—'}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={st.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/erp/admin/students/${st.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-purple-50 text-purple-700 hover:text-purple-800 text-xs font-bold rounded-lg transition"
                        >
                          Profile <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="bg-slate-50/70 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Showing page <strong className="text-slate-900">{pagination.page}</strong> of{' '}
              <strong className="text-slate-900">{pagination.totalPages}</strong> ({pagination.total} records)
            </div>
            <div className="flex items-center gap-2">
              {pagination.page > 1 && (
                <Link
                  href={`/erp/principal/students?page=${pagination.page - 1}&search=${search}&status=${status}&sessionId=${sessionId}&classId=${classId}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Link>
              )}
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/erp/principal/students?page=${pagination.page + 1}&search=${search}&status=${status}&sessionId=${sessionId}&classId=${classId}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
