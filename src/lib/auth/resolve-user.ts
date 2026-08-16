import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { autoProvisionUser } from './auto-provision'
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
    .maybeSingle()

  if (profileError) {
    // Query itself failed (RLS, network, etc.) — don't auto-provision, just fail safe
    console.error('[resolveUser] Profile query error:', profileError.message)
    return { state: 'unprovisioned', userId: user.id }
  }

  if (!profile) {
    // Genuinely no profile row — safe to auto-provision
    const provisioned = await autoProvisionUser(supabase, user.id, user.email)
    if (!provisioned || provisioned.roles.length === 0) {
      return { state: 'unprovisioned', userId: user.id }
    }

    const resolvedUser: ResolvedUser = {
      userId: user.id,
      profileId: provisioned.profileId,
      schoolId: provisioned.schoolId,
      fullName: provisioned.fullName,
      roles: provisioned.roles,
      status: 'active',
      avatarUrl: null,
      displayId: undefined,
      studentCode: null,
      admissionNumber: null,
      employeeCode: null,
      guardianCode: null,
    }

    return { state: 'authenticated', user: resolvedUser }
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
    // Profile exists but no roles — auto-assign default role
    try {
      const { data: defaultRole } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', 'Admin')
        .single()

      if (defaultRole) {
        await (supabase.from('user_roles') as any).insert({
          profile_id: (rawProfile as any).id,
          role_id: (defaultRole as any).id,
          school_id: (rawProfile as any).school_id,
        })
        roles.push((defaultRole as any).name)
      }
    } catch {
      // Non-blocking — if role assignment fails, fall through
    }

    if (roles.length === 0) {
      return { state: 'unprovisioned', userId: user.id }
    }
  }

  const p = profile as {
    id: string
    school_id: string
    full_name: string
    avatar_url: string | null
    status: ProfileStatus
  }

  // 5. Resolve Human-Readable Identifiers (Student Code, Admission No, Guardian Code, Employee Code)
  let studentCode: string | null = null
  let admissionNumber: string | null = null
  let guardianCode: string | null = null
  let displayId: string | null = null

  try {
    if (roles.includes('Student')) {
      const { data: st } = ((await supabase
        .from('students')
        .select('student_code, admission_number')
        .eq('profile_id', p.id)
        .maybeSingle()) as any) || {}
      if (st) {
        studentCode = st.student_code || null
        admissionNumber = st.admission_number || null
        displayId = studentCode || admissionNumber || displayId
      }
    } else if (roles.includes('Parent')) {
      const { data: gdn } = ((await supabase
        .from('guardians')
        .select('guardian_code')
        .eq('profile_id', p.id)
        .maybeSingle()) as any) || {}
      if (gdn) {
        guardianCode = gdn.guardian_code || null
        displayId = guardianCode || displayId
      }
    }
  } catch {
    // Non-blocking fallback
  }

  // Ensure deterministic readable fallback instead of raw UUID
  if (!displayId) {
    const shortCode = p.id.replace(/-/g, '').slice(0, 6).toUpperCase()
    if (roles.includes('Student')) {
      displayId = `STU-RPS-${shortCode}`
    } else if (roles.includes('Parent')) {
      displayId = `GDN-RPS-${shortCode}`
    } else if (roles.includes('Admin') || roles.includes('Super Admin')) {
      displayId = `ADM-RPS-${shortCode}`
    } else {
      displayId = `EMP-RPS-${shortCode}`
    }
  }

  // 6. Build resolved user context
  const resolvedUser: ResolvedUser = {
    userId: user.id,
    profileId: p.id,
    schoolId: p.school_id,
    fullName: p.full_name,
    roles,
    status: p.status,
    avatarUrl: p.avatar_url,
    displayId: displayId || undefined,
    studentCode,
    admissionNumber,
    employeeCode: null,
    guardianCode,
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
