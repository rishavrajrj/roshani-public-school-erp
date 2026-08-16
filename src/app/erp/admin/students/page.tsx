import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getStudents } from '@/lib/students/actions'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  UserPlus,
  Search,
  Users,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Student Directory"
        description="Comprehensive directory of enrolled students, active academic sessions, class & section assignments, and primary guardian profiles."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Students' },
        ]}
        actions={
          <Link
            href="/erp/admin/students/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            + Direct Enrollment
          </Link>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Admission #, Name, Phone..."
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={status}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
            <select
              name="classId"
              defaultValue={classId}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm py-2 px-3 rounded-xl transition"
            >
              Filter
            </button>
            <Link
              href="/erp/admin/students"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm py-2 px-3 rounded-xl transition font-medium text-center"
            >
              Clear
            </Link>
          </div>
        </form>
      </div>

      {/* Table / Mobile Fallback */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {students.length === 0 ? (
          <div className="p-6 sm:p-12">
            <EmptyState
              icon={Users}
              title="No student records found"
              description="No students match the selected filter criteria or search query."
              actionLabel="+ Direct Student Enrollment"
              actionHref="/erp/admin/students/new"
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
                  <th className="py-3.5 px-4">Primary Guardian</th>
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
                  const primaryGuardian = Array.isArray(st.student_guardians)
                    ? st.student_guardians.find((g: any) => g.is_primary)?.guardians ||
                      st.student_guardians[0]?.guardians
                    : null

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {st.admission_number}
                        </div>
                        <div className="font-mono text-[10px] text-blue-600 font-semibold">
                          {st.admission_number?.startsWith('ADM-') ? st.admission_number.replace('ADM-', 'STU-') : `STU-${st.admission_number}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {st.first_name?.[0]}
                            {st.last_name?.[0]}
                          </div>
                          <span className="font-bold text-slate-900">
                            {st.first_name} {st.middle_name ? st.middle_name + ' ' : ''}
                            {st.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {activeHistory
                          ? `${activeHistory.classes?.name || ''} - ${activeHistory.sections?.name || ''}`
                          : 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {activeHistory?.roll_number || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {primaryGuardian ? (
                          <div>
                            <div className="font-bold text-slate-900">{primaryGuardian.full_name}</div>
                            <div className="text-[11px] text-slate-600 font-mono font-medium">{primaryGuardian.phone}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic font-medium">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={st.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          href={`/erp/admin/students/${st.id}`}
                          prefetch={true}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-700 hover:text-blue-800 text-xs font-bold rounded-lg transition"
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
              Page <strong className="text-slate-900">{pagination.page}</strong> of{' '}
              <strong className="text-slate-900">{pagination.totalPages}</strong> ({pagination.total} students)
            </div>
            <div className="flex items-center gap-2">
              {pagination.page > 1 && (
                <Link
                  href={`/erp/admin/students?page=${pagination.page - 1}&search=${search}&status=${status}&sessionId=${sessionId}&classId=${classId}&gender=${gender}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Link>
              )}
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/erp/admin/students?page=${pagination.page + 1}&search=${search}&status=${status}&sessionId=${sessionId}&classId=${classId}&gender=${gender}`}
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
