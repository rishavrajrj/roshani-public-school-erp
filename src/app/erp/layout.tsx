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

  // Determine current active role from authenticated user's assigned roles
  let activeRole = roles[0] || 'User'

  if (pathname.startsWith('/erp/admin')) {
    if (roles.includes('Super Admin')) activeRole = 'Super Admin'
    else if (roles.includes('Admin')) activeRole = 'Admin'
    else if (roles.length > 0) activeRole = roles[0]
  } else if (pathname.startsWith('/erp/principal')) {
    if (roles.includes('Principal')) activeRole = 'Principal'
    else if (roles.includes('Vice Principal')) activeRole = 'Vice Principal'
    else if (roles.length > 0) activeRole = roles[0]
  } else if (pathname.startsWith('/erp/teacher')) {
    if (roles.includes('Class Teacher')) activeRole = 'Class Teacher'
    else if (roles.includes('Teacher')) activeRole = 'Teacher'
    else if (roles.length > 0) activeRole = roles[0]
  } else if (pathname.startsWith('/erp/accountant')) {
    if (roles.includes('Accountant')) activeRole = 'Accountant'
    else if (roles.length > 0) activeRole = roles[0]
  } else if (pathname.startsWith('/erp/student')) {
    if (roles.includes('Student')) activeRole = 'Student'
    else if (roles.length > 0) activeRole = roles[0]
  } else if (pathname.startsWith('/erp/parent')) {
    if (roles.includes('Parent')) activeRole = 'Parent'
    else if (roles.length > 0) activeRole = roles[0]
  } else if (roles.length > 0) {
    activeRole = roles[0]
  }


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
      displayId={user?.displayId || ''}
      schoolId={user?.schoolId || ''}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </ERPAppShell>
  )
}

