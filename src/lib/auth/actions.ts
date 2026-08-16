// ============================================================
// Auth Server Actions — Roshani Public School ERP
// ============================================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './schemas'
import { ROLE_ROUTES } from './constants'
import {
  checkLoginRateLimit,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from './rate-limiter'
import type { AuthActionResult, RoleName } from '@/types/auth'

/**
 * Login server action.
 * Validates input with Zod, enforces rate limiting, authenticates via Supabase Auth,
 * logs security audit events, resolves user context, and redirects to portal.
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  // 1. Validate input structure with Zod
  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { success: false, error: firstError }
  }

  // 2. Application-Level Rate Limiting & Throttling
  const rateLimit = checkLoginRateLimit(parsed.data.email)
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: rateLimit.message || 'Too many failed login attempts. Please wait before trying again.',
    }
  }

  // Apply progressive delay if throttled
  if (rateLimit.delayMs && rateLimit.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, rateLimit.delayMs))
  }

  const supabase = await createClient()

  // 3. Supabase GoTrue Authentication
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !authData.user) {
    // Record failure in rate limiter
    const failureStatus = recordFailedAttempt(parsed.data.email)

    // Audit failed login (never logging passwords or sensitive tokens)
    try {
      await (supabase.from('audit_logs') as any).insert({
        action: 'LOGIN_FAILURE',
        entity_type: 'auth',
        new_data: {
          attempted_email: parsed.data.email,
          reason: error?.message || 'Invalid credentials',
          locked: failureStatus.locked,
          timestamp: new Date().toISOString(),
        },
      })
    } catch {
      // Audit log failures do not block auth response
    }

    if (failureStatus.locked) {
      return {
        success: false,
        error: `Too many failed login attempts. Account temporarily throttled for ${failureStatus.retryAfterSeconds} seconds.`,
      }
    }

    return { success: false, error: error?.message || 'Invalid email or password' }
  }

  // 4. Resolve profile and roles in a single unified PostgREST query using authenticated user ID
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      school_id,
      status,
      user_roles!user_roles_profile_id_fkey (
        role_id,
        roles (
          name
        )
      )
    `)
    .eq('auth_user_id', authData.user.id)
    .single()

  if (!profile) {
    return { success: true, redirectUrl: '/erp/account-not-provisioned' }
  }

  if ((profile as any).status !== 'active') {
    return { success: true, redirectUrl: '/erp/unauthorized' }
  }

  // 5. Extract roles directly from joined query
  const rawProfile = profile as Record<string, unknown>
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

  // 6. Reset rate limit and log LOGIN_SUCCESS audit event
  recordSuccessfulAttempt(parsed.data.email)

  try {
    await (supabase.from('audit_logs') as any).insert({
      school_id: (profile as any).school_id,
      actor_profile_id: (profile as any).id,
      action: 'LOGIN_SUCCESS',
      entity_type: 'auth',
      entity_id: (profile as any).id,
      new_data: {
        email: parsed.data.email,
        roles,
        timestamp: new Date().toISOString(),
      },
    })
  } catch {
    // Non-blocking
  }

  if (roles.length === 0) {
    return { success: true, redirectUrl: '/erp/account-not-provisioned' }
  }

  if (roles.length === 1) {
    const targetRoute = ROLE_ROUTES[roles[0] as RoleName] || '/erp'
    return { success: true, redirectUrl: targetRoute }
  } else {
    return { success: true, redirectUrl: '/erp/select-role' }
  }
}

/**
 * Logout server action.
 * Logs LOGOUT event, revokes session on Supabase GoTrue, clears cookies, and redirects.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, school_id')
        .eq('auth_user_id', user.id)
        .single()

      if (profile) {
        await (supabase.from('audit_logs') as any).insert({
          school_id: (profile as any).school_id,
          actor_profile_id: (profile as any).id,
          action: 'LOGOUT',
          entity_type: 'auth',
          entity_id: (profile as any).id,
          new_data: { timestamp: new Date().toISOString() },
        })
      }
    }
  } catch {
    // Non-blocking
  }

  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Forgot password server action.
 * Sends reset email via Supabase Auth and logs security audit event.
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
  }

  const parsed = forgotPasswordSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid email address'
    return { success: false, error: firstError }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  try {
    await (supabase.from('audit_logs') as any).insert({
      action: 'PASSWORD_RESET_REQUESTED',
      entity_type: 'auth',
      new_data: {
        email: parsed.data.email,
        timestamp: new Date().toISOString(),
      },
    })
  } catch {
    // Non-blocking
  }

  return { success: true }
}

/**
 * Reset password server action.
 * Updates password for current authenticated session.
 */
export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = resetPasswordSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid password'
    return { success: false, error: firstError }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, school_id')
        .eq('auth_user_id', user.id)
        .single()

      if (profile) {
        await (supabase.from('audit_logs') as any).insert({
          school_id: (profile as any).school_id,
          actor_profile_id: (profile as any).id,
          action: 'PASSWORD_CHANGED',
          entity_type: 'auth',
          entity_id: (profile as any).id,
          new_data: { timestamp: new Date().toISOString() },
        })
      }
    }
  } catch {
    // Non-blocking
  }

  redirect('/login')
}

