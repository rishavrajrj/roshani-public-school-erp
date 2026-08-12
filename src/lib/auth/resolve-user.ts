// ============================================================
// Resolve User — Server-Side Auth + Profile + Role Resolution
// ============================================================
import { createClient } from '@/lib/supabase/server'
import type { AuthState, ResolvedUser, ProfileStatus } from '@/types/auth'

/**
 * Resolves the complete user context from Supabase Auth + database.
 *
 * Chain: auth.users.id → profiles.auth_user_id → profiles.id → user_roles → roles
 *
 * This function MUST only be called server-side (Server Components, Server Actions, Route Handlers).
 * It uses the authenticated user's session — never trusts client-provided data.
 *
 * @returns AuthState representing the user's current authentication/authorization state
 */
export async function resolveUser(): Promise<AuthState> {
  const supabase = await createClient()

  // 1. Get authenticated user from Supabase Auth (verifies JWT server-side)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { state: 'unauthenticated' }
  }

  // 2. Resolve profile from auth_user_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, school_id, full_name, status, avatar_url')
    .eq('auth_user_id', user.id)
    .single()

  if (profileError || !profile) {
    // Authenticated but no ERP profile — unprovisioned user
    return { state: 'unprovisioned', userId: user.id }
  }

  // 3. Check profile status
  const status = (profile as Record<string, unknown>).status as ProfileStatus
  if (status !== 'active') {
    return { state: 'disabled', userId: user.id, status }
  }

  // Cast profile to a typed object for safe access
  const p = profile as { id: string; school_id: string; full_name: string; avatar_url: string | null }

  // 4. Resolve roles via user_roles → roles
  const { data: roleRecords, error: rolesError } = await supabase
    .from('user_roles')
    .select('role_id, roles(name)')
    .eq('profile_id', p.id)
    .eq('school_id', p.school_id)

  if (rolesError) {
    // Database error — treat as unprovisioned for safety
    return { state: 'unprovisioned', userId: user.id }
  }

  // Extract role names from the joined query
  const roles: string[] = []
  if (roleRecords) {
    for (const record of roleRecords) {
      // The `roles` field is the joined roles table row
      const roleData = (record as Record<string, unknown>).roles as { name: string } | null
      if (roleData?.name) {
        roles.push(roleData.name)
      }
    }
  }

  if (roles.length === 0) {
    // Authenticated + has profile but no roles assigned
    return { state: 'unprovisioned', userId: user.id }
  }

  // 5. Build resolved user context
  const resolvedUser: ResolvedUser = {
    userId: user.id,
    profileId: p.id,
    schoolId: p.school_id,
    fullName: p.full_name,
    roles,
    status,
    avatarUrl: p.avatar_url,
  }

  return { state: 'authenticated', user: resolvedUser }
}

/**
 * Checks if the resolved user has any of the specified roles.
 * Used by portal pages for server-side authorization.
 */
export function hasAnyRole(user: ResolvedUser, allowedRoles: string[]): boolean {
  return user.roles.some((role) => allowedRoles.includes(role))
}
