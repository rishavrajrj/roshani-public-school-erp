import React from 'react'
import { redirect } from 'next/navigation'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { ROUTE_ALLOWED_ROLES } from '@/lib/auth/constants'
import { getSchoolProfile } from '@/lib/schools/actions'
import { SchoolProfileForm } from '@/components/settings/school-profile-form'

export default async function SchoolProfileSettingsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const profileRes = await getSchoolProfile()
  if (!profileRes.success || !profileRes.data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">
        Unable to load school profile. Please contact system administrator.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Institutional Profile &amp; Governance</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Maintain legal school details, official UDISE registration, affiliation numbers, and campus branding.
        </p>
      </div>

      <SchoolProfileForm initialProfile={profileRes.data} />
    </div>
  )
}
