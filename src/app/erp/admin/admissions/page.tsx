import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getAdmissionApplications } from '@/lib/admissions/actions'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  UserPlus,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

interface Props {
  searchParams: Promise<{
    search?: string
    status?: string
    sessionId?: string
    classId?: string
    page?: string
  }>
}

export default async function AdmissionsListPage({ searchParams }: Props) {
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
  const page = parseInt(sParams.page || '1', 10)

  const [appsResult, sessionsResult, classesResult] = await Promise.all([
    getAdmissionApplications({ search, status, sessionId, classId, page, limit: 15 }),
    getAcademicSessions(),
    getClasses(),
  ])

  const applications: any[] = appsResult.success ? appsResult.data.applications : []
  const pagination = appsResult.success ? appsResult.data : { total: 0, totalPages: 1, page: 1 }
  const sessions: any[] = sessionsResult.success ? sessionsResult.data : []
  const classes: any[] = classesResult.success ? classesResult.data : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Admission Applications"
        description="Review student admission enquiries, track document submission, approve candidate applications, and convert to student records."
        breadcrumbs={[
          { label: 'ERP Portal', href: '/erp/admin' },
          { label: 'Admissions' },
        ]}
        actions={
          <Link
            href="/erp/admin/admissions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            + New Application
          </Link>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Search Applicant
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="App #, Name, Phone..."
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition"
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
              <option value="all">All Application Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="converted">Converted to Student</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session</label>
            <select
              name="sessionId"
              defaultValue={sessionId}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            >
              <option value="">All Academic Sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Applying Class</label>
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
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm py-2 px-4 rounded-xl transition"
            >
              Apply Filter
            </button>
            <Link
              href="/erp/admin/admissions"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm py-2 px-3 rounded-xl transition font-medium text-center"
            >
              Clear
            </Link>
          </div>
        </form>
      </div>

      {/* Table / Mobile Cards */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-6 sm:p-12">
            <EmptyState
              title="No admission applications found"
              description="No applications match the currently applied filter or search parameters."
              actionLabel="+ Create New Application"
              actionHref="/erp/admin/admissions/new"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Application #</th>
                  <th className="py-3.5 px-4">Applicant Name</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Guardian Details</th>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {app.application_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {app.applicant_first_name} {app.applicant_middle_name ? app.applicant_middle_name + ' ' : ''}
                      {app.applicant_last_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {(app.classes as { name?: string })?.name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-bold text-slate-900">{app.guardian_name}</div>
                      <div className="text-[11px] text-slate-600 font-mono font-medium">{app.guardian_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {(app.academic_sessions as { name?: string })?.name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                      {new Date(app.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/erp/admin/admissions/${app.id}`}
                        prefetch={true}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-700 hover:text-blue-800 text-xs font-bold rounded-lg transition"
                      >
                        Manage <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
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
                  href={`/erp/admin/admissions?page=${pagination.page - 1}&search=${search}&status=${status}&sessionId=${sessionId}&classId=${classId}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Link>
              )}
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/erp/admin/admissions?page=${pagination.page + 1}&search=${search}&status=${status}&sessionId=${sessionId}&classId=${classId}`}
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
