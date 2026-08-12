import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { LogoutButton } from '@/components/auth/logout-button'

export default async function ERPLayout({ children }: { children: React.ReactNode }) {
  const authState = await resolveUser()
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  if (authState.state === 'unauthenticated') {
    redirect('/login')
  }

  const isExempt = ['/erp/account-not-provisioned', '/erp/unauthorized', '/erp/select-role'].includes(pathname)

  if (!isExempt) {
    if (authState.state === 'unprovisioned') {
      redirect('/erp/account-not-provisioned')
    }
    if (authState.state === 'disabled') {
      redirect('/erp/unauthorized')
    }
  }

  const isFullyAuthenticated = authState.state === 'authenticated'
  const user = isFullyAuthenticated ? authState.user : null
  const userName = user ? user.fullName : ''
  const roles = user ? user.roles.join(', ') : ''

  const isAdminOrSuper = user ? hasAnyRole(user, ['Super Admin', 'Admin']) : false
  const isPrincipal = user ? hasAnyRole(user, ['Principal']) : false

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-6">
            <div>
              <Link href="/erp/admin" className="text-xl font-bold tracking-tight text-white hover:text-blue-200 transition">
                Roshani Public School <span className="text-xs font-normal text-blue-400 bg-blue-950 px-2 py-0.5 rounded ml-1">ERP</span>
              </Link>
              {isFullyAuthenticated && (
                <div className="text-xs text-slate-300 mt-0.5">
                  <span className="font-semibold">{userName}</span> ({roles})
                </div>
              )}
            </div>

            {/* Navigation links */}
            {isFullyAuthenticated && !isExempt && (
              <nav className="hidden md:flex items-center space-x-2 text-sm font-medium">
                {isAdminOrSuper && (
                  <>
                    <Link href="/erp/admin" className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition">Dashboard</Link>
                    <Link href="/erp/admin/admissions" className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition">Admissions</Link>
                    <Link href="/erp/admin/students" className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition">Students</Link>
                  </>
                )}
                {isPrincipal && (
                  <>
                    <Link href="/erp/principal" className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition">Dashboard</Link>
                    <Link href="/erp/principal/admissions" className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition">Admissions</Link>
                    <Link href="/erp/principal/students" className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 hover:text-white transition">Students</Link>
                  </>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {isFullyAuthenticated && user && user.roles.length > 1 && (
              <Link href="/erp/select-role" className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md transition">
                Switch Role
              </Link>
            )}
            <div className="bg-white rounded-md">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
