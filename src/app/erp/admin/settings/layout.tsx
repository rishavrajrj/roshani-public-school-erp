import React from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { ROUTE_ALLOWED_ROLES } from '@/lib/auth/constants'
import { PageHeader } from '@/components/ui/page-header'
import {
  Building2,
  Sliders,
  SlidersHorizontal,
  Calendar,
  Settings,
} from 'lucide-react'

export default async function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const allowedRoles = ROUTE_ALLOWED_ROLES['/erp/admin'] || []
  if (!hasAnyRole(authState.user, allowedRoles)) {
    redirect('/erp/unauthorized')
  }

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  const tabs = [
    {
      name: 'Overview',
      href: '/erp/admin/settings',
      icon: Settings,
      exact: true,
    },
    {
      name: 'School Profile',
      href: '/erp/admin/settings/school',
      icon: Building2,
    },
    {
      name: 'Modules & Features',
      href: '/erp/admin/settings/modules',
      icon: Sliders,
    },
    {
      name: 'Required Fields',
      href: '/erp/admin/settings/required-fields',
      icon: SlidersHorizontal,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Settings &amp; Configuration"
        description="Manage institutional identity, official UDISE accreditation, module enablement, and school-specific field requirements."
        breadcrumbs={[
          { label: 'Admin Dashboard', href: '/erp/admin' },
          { label: 'Settings' },
        ]}
      />

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </Link>
          )
        })}
      </div>

      <div>{children}</div>
    </div>
  )
}
