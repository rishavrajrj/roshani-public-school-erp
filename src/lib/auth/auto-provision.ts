// ============================================================
// Auto-Provisioning — Roshani Public School ERP
// ============================================================
// Automatically creates a profile and assigns a default Admin role
// for authenticated users who don't have a profile yet.
//
// This prevents the "Account Not Provisioned" dead-end page by
// ensuring every authenticated user gets immediate ERP access.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'

/** Default school for auto-provisioned users */
const DEFAULT_SCHOOL_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

/** Default role assigned to auto-provisioned users */
const DEFAULT_ROLE_NAME = 'Admin'

interface AutoProvisionResult {
  profileId: string
  schoolId: string
  fullName: string
  roles: string[]
}

/**
 * Auto-provisions a new profile and default role for an authenticated user
 * who has no existing profile in the database.
 *
 * Steps:
 * 1. Creates a `profiles` row linked to the auth user ID
 * 2. Looks up the default role ID
 * 3. Creates a `user_roles` entry
 * 4. Logs an audit event
 *
 * @param supabase - Authenticated Supabase client (user's session)
 * @param authUserId - The auth.users.id of the authenticated user
 * @param email - The user's email (used for deriving display name)
 * @returns The provisioned profile details, or null if provisioning failed
 */
export async function autoProvisionUser(
  supabase: SupabaseClient,
  authUserId: string,
  email?: string | null,
): Promise<AutoProvisionResult | null> {
  try {
    // 1. Derive a display name from email
    const fullName = deriveDisplayName(email)

    // 2. Try to find an existing profile first (handles race conditions / RLS issues)
    let profileId: string
    let schoolId: string
    let profileName: string

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, school_id, full_name')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (existingProfile) {
      // Profile already exists — skip creation, just ensure roles
      profileId = existingProfile.id
      schoolId = existingProfile.school_id
      profileName = existingProfile.full_name
    } else {
      // 3. Create profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          auth_user_id: authUserId,
          school_id: DEFAULT_SCHOOL_ID,
          full_name: fullName,
          status: 'active',
        })
        .select('id, school_id, full_name')
        .single()

      if (profileError || !newProfile) {
        // Handle duplicate key race condition: another request created it first
        if (profileError?.message?.includes('duplicate key')) {
          const { data: raceProfile } = await supabase
            .from('profiles')
            .select('id, school_id, full_name')
            .eq('auth_user_id', authUserId)
            .maybeSingle()

          if (raceProfile) {
            profileId = raceProfile.id
            schoolId = raceProfile.school_id
            profileName = raceProfile.full_name
          } else {
            console.error('[auto-provision] Profile exists but cannot be read (RLS?)')
            return null
          }
        } else {
          console.error('[auto-provision] Failed to create profile:', profileError?.message)
          return null
        }
      } else {
        profileId = newProfile.id
        schoolId = newProfile.school_id
        profileName = newProfile.full_name
      }
    }

    // 4. Get default role ID
    const { data: role } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', DEFAULT_ROLE_NAME)
      .single()

    const assignedRoles: string[] = []

    if (role) {
      // 5. Check if role already assigned
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('profile_id', profileId)
        .eq('role_id', (role as any).id)
        .maybeSingle()

      if (existingRole) {
        assignedRoles.push((role as any).name)
      } else {
        // 6. Assign default role
        const { error: roleError } = await (supabase.from('user_roles') as any).insert({
          profile_id: profileId,
          role_id: (role as any).id,
          school_id: schoolId,
        })

        if (!roleError) {
          assignedRoles.push((role as any).name)
        } else {
          console.error('[auto-provision] Failed to assign role:', roleError.message)
        }
      }
    }

    // 7. Audit log (non-blocking)
    try {
      await (supabase.from('audit_logs') as any).insert({
        school_id: schoolId,
        actor_profile_id: profileId,
        action: 'AUTO_PROVISIONED',
        entity_type: 'profile',
        entity_id: profileId,
        new_data: {
          email,
          roles: assignedRoles,
          timestamp: new Date().toISOString(),
        },
      })
    } catch {
      // Non-blocking
    }

    return {
      profileId,
      schoolId,
      fullName: profileName,
      roles: assignedRoles,
    }
  } catch (err) {
    console.error('[auto-provision] Unexpected error:', err)
    return null
  }
}

/**
 * Derives a human-readable display name from an email address.
 * e.g. "john.doe@school.com" → "John Doe"
 */
function deriveDisplayName(email?: string | null): string {
  if (!email) return 'School User'

  const localPart = email.split('@')[0] || 'User'
  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'School User'
}
