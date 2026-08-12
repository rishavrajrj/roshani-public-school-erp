import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getAdmissionApplications } from '@/lib/admissions/actions'
import { getAcademicSessions, getClasses } from '@/lib/academic/actions'

interface Props {
  searchParams: Promise<{
    search?: string
    status?: string
    sessionId?: string
    classId?: string
    page?: string
  }>
}

export default async function PrincipalAdmissionsPage({ searchParams }: Props) {
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

  const [appsResult, sessionsResult, classesResult] = await Promise.all([
    getAdmissionApplications({ search, status, sessionId, classId, page, limit: 15 }),
    getAcademicSessions(),
    getClasses(),
  ])

  const applications: any[] = appsResult.success ? appsResult.data.applications : []
  const pagination = appsResult.success ? appsResult.data : { total: 0, totalPages: 1, page: 1 }
  const sessions: any[] = sessionsResult.success ? sessionsResult.data : []
  const classes: any[] = classesResult.success ? classesResult.data : []

  const statusBadgeColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    under_review: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    withdrawn: 'bg-gray-100 text-gray-600 border-gray-200',
    converted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }

  return (
    <div className="flex-1 bg-slate-50 p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Principal — Admissions Review</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Review submitted student applications and approve or reject candidates.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="App #, Name..."
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
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="converted">Converted</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Session</label>
            <select
              name="sessionId"
              defaultValue={sessionId}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Applying Class</label>
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
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm py-2 px-4 rounded-md transition"
            >
              Filter
            </button>
            <Link
              href="/erp/principal/admissions"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm py-2 px-3 rounded-md transition text-center"
            >
              Clear
            </Link>
          </div>
        </form>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">App #</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Applying Class</th>
                <th className="py-3 px-4">Guardian</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No admission applications found matching current criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{app.application_number}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {app.applicant_first_name} {app.applicant_last_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{(app.classes as { name?: string })?.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{app.guardian_name}</div>
                      <div className="text-xs text-slate-400">{app.guardian_phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          statusBadgeColors[app.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {app.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/erp/admin/admissions/${app.id}`}
                        className="inline-flex items-center px-3 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded"
                      >
                        Review &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
