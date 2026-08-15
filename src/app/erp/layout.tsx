import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getUserNotifications } from '@/lib/notifications/queries'
import { ERPAppShell } from '@/components/layout/erp-app-shell'

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
  const userName = user ? user.fullName : 'School User'
  const roles = user ? user.roles : []

  // Determine current active role from pathname or default to primary role
  let activeRole = roles[0] || 'User'
  if (pathname.includes('/erp/admin')) activeRole = 'Admin'
  else if (pathname.includes('/erp/principal')) activeRole = 'Principal'
  else if (pathname.includes('/erp/teacher')) activeRole = 'Teacher'
  else if (pathname.includes('/erp/accountant')) activeRole = 'Accountant'
  else if (pathname.includes('/erp/student')) activeRole = 'Student'
  else if (pathname.includes('/erp/parent')) activeRole = 'Parent'

  const { notifications, unreadCount } = isFullyAuthenticated
    ? await getUserNotifications()
    : { notifications: [], unreadCount: 0 }

  // If user is on an exempt page (like select-role or 403), render simplified container
  if (isExempt) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    )
  }

  return (
    <ERPAppShell
      userRole={activeRole}
      allRoles={roles}
      userName={userName}
      schoolId={user?.schoolId || ''}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </ERPAppShell>
  )
}

