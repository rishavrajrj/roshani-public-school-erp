import React from 'react'
import { redirect } from 'next/navigation'
import { resolveUser } from '@/lib/auth/resolve-user'
import { getSchoolFieldConfigs } from '@/lib/features/services'
import { RequiredFieldsForm } from '@/components/settings/required-fields-form'

export default async function RequiredFieldsSettingsPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const studentConfigs = await getSchoolFieldConfigs('student')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">School-Specific Required Fields</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure whether fields like Student Photos, Blood Groups, National ID, or Guardian Emails are mandatory during student enrollment.
        </p>
      </div>

      <RequiredFieldsForm initialStudentConfigs={studentConfigs} />
    </div>
  )
}
