'use server'

// ============================================================
// Roshani Public School ERP - School Profile & Identity Service
// ============================================================

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import type { SchoolProfile, UpdateSchoolProfileInput } from '@/types/school'
import { normalizeUdiseCode } from './validation'

/**
 * Retrieves the complete school profile for the authenticated tenant.
 */
export const getSchoolProfile = cache(async function getSchoolProfile(): Promise<{
  success: boolean
  data?: SchoolProfile
  error?: string
}> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { data, error } = await (supabase
    .from('schools') as any)
    .select('*')
    .eq('id', authState.user.schoolId)
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || 'School profile not found' }
  }

  return { success: true, data: data as SchoolProfile }
})

/**
 * Updates the school profile for the current school tenant.
 */
export async function updateSchoolProfile(
  input: UpdateSchoolProfileInput
): Promise<{ success: boolean; error?: string; message?: string; profile?: SchoolProfile }> {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }

  const { user } = authState
  if (!hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])) {
    return { success: false, error: 'Forbidden: Insufficient administrative privileges.' }
  }

  // Validate UDISE code format if provided
  if (input.udise_code) {
    const udiseCheck = normalizeUdiseCode(input.udise_code)
    if (!udiseCheck.valid) {
      return { success: false, error: udiseCheck.error }
    }
    input.udise_code = udiseCheck.normalized
  }

  const supabase = await createClient()

  // Verify unique UDISE code if changing
  if (input.udise_code) {
    const { data: existingUdise } = await (supabase
      .from('schools') as any)
      .select('id')
      .eq('udise_code', input.udise_code)
      .neq('id', user.schoolId)
      .maybeSingle()

    if (existingUdise) {
      return {
        success: false,
        error: `UDISE Code '${input.udise_code}' is already registered to another school.`,
      }
    }
  }

  const now = new Date().toISOString()
  const updatePayload = {
    ...input,
    updated_at: now,
  }

  const { data, error } = await (supabase
    .from('schools') as any)
    .update(updatePayload)
    .eq('id', user.schoolId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Log in audit trail
  await (supabase.from('audit_logs') as any).insert({
    school_id: user.schoolId,
    actor_profile_id: user.profileId,
    action: 'SCHOOL_PROFILE_UPDATED',
    entity_type: 'school',
    entity_id: user.schoolId,
    new_data: { udise_code: input.udise_code, name: input.name },
  })

  return {
    success: true,
    message: 'School profile updated successfully.',
    profile: data as SchoolProfile,
  }
}
