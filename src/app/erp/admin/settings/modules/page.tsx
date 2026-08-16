import React from 'react'
import { redirect } from 'next/navigation'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { getSchoolFeatures } from '@/lib/features/services'
import { ModulesConfigPanel } from '@/components/settings/modules-config-panel'

export default async function ModulesSettingsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const { features } = await getSchoolFeatures()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Module &amp; Subsystem Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enable or disable optional modules for your campus. System core modules are permanently preserved.
        </p>
      </div>

      <ModulesConfigPanel initialFeatures={features} />
    </div>
  )
}
