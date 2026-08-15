import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { AuthState, ResolvedUser, ProfileStatus } from '@/types/auth'

/**
 * Resolves the complete user context from Supabase Auth + database.
 *
 * Chain: auth.users.id → profiles.auth_user_id → profiles.id → user_roles → roles
 *
 * This function MUST only be called server-side (Server Components, Server Actions, Route Handlers).
 * It uses the authenticated user's session — never trusts client-provided data.
 * Wrapped in React.cache to deduplicate auth and profile lookups within the same request lifecycle.
 *
 * @returns AuthState representing the user's current authentication/authorization state
 */
export const resolveUser = cache(async function resolveUser(): Promise<AuthState> {
  const supabase = await createClient()

  // 1. Get authenticated user from Supabase Auth (verifies JWT server-side)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { state: 'unauthenticated' }
  }

  // 2. Resolve profile and assigned roles in a single unified PostgREST query
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      school_id,
      full_name,
      status,
      avatar_url,
      user_roles!user_roles_profile_id_fkey (
        role_id,
        roles (
          name
        )
      )
    `)
    .eq('auth_user_id', user.id)
    .single()

  if (profileError || !profile) {
    // Authenticated but no ERP profile — unprovisioned user
    return { state: 'unprovisioned', userId: user.id }
  }

  // 3. Check profile status
  const rawProfile = profile as Record<string, unknown>
  const status = rawProfile.status as ProfileStatus
  if (status !== 'active') {
    return { state: 'disabled', userId: user.id, status }
  }

  // 4. Extract role names from unified joined user_roles
  const roleRecords = rawProfile.user_roles as Array<{
    role_id: string
    roles: { name: string } | null
  }> | null

  const roles: string[] = []
  if (roleRecords && Array.isArray(roleRecords)) {
    for (const record of roleRecords) {
      if (record?.roles?.name) {
        roles.push(record.roles.name)
      }
    }
  }

  if (roles.length === 0) {
    // Authenticated + has profile but no roles assigned
    return { state: 'unprovisioned', userId: user.id }
  }

  const p = profile as {
    id: string
    school_id: string
    full_name: string
    avatar_url: string | null
    status: ProfileStatus
  }

  // 5. Build resolved user context
  const resolvedUser: ResolvedUser = {
    userId: user.id,
    profileId: p.id,
    schoolId: p.school_id,
    fullName: p.full_name,
    roles,
    status: p.status,
    avatarUrl: p.avatar_url,
  }

  return { state: 'authenticated', user: resolvedUser }
})

/**
 * Checks if the resolved user has any of the specified roles.
 * Used by portal pages for server-side authorization.
 */
export function hasAnyRole(user: ResolvedUser, allowedRoles: string[]): boolean {
  return user.roles.some((role) => allowedRoles.includes(role))
}

/**
 * Checks if the resolved user possesses a specific permission.
 */
export function hasPermission(user: ResolvedUser, permission: import('./permissions').Permission): boolean {
  const { userHasPermission } = require('./permissions')
  return userHasPermission(user.roles, permission)
}

/**
 * Checks if user belongs to System Authority (Super Admin, Admin).
 */
export function isSystemAuthority(user: ResolvedUser): boolean {
  return hasAnyRole(user, ['Super Admin', 'Admin'])
}

/**
 * Checks if user belongs to School Authority (Principal, Admin / VP, Coordinator, Teacher).
 */
export function isSchoolAuthority(user: ResolvedUser): boolean {
  return hasAnyRole(user, ['Principal', 'Admin', 'Teacher'])
}
