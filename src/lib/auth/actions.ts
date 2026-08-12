// ============================================================
// Auth Server Actions — Roshani Public School ERP
// ============================================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './schemas'
import { ROLE_ROUTES } from './constants'
import type { AuthActionResult, RoleName } from '@/types/auth'

/**
 * Login server action.
 * Validates input with Zod, authenticates via Supabase Auth,
 * resolves user context, and redirects directly to target portal.
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  // Validate with Zod
  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { success: false, error: firstError }
  }

  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !authData.user) {
    return { success: false, error: 'Invalid email or password' }
  }

  // 1. Resolve profile directly using authenticated user ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, school_id, status')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (!profile) {
    redirect('/erp/account-not-provisioned')
  }

  if ((profile as any).status !== 'active') {
    redirect('/erp/unauthorized')
  }

  // 2. Resolve roles directly using profile ID
  const p = profile as { id: string; school_id: string }
  const { data: roleRecords } = await supabase
    .from('user_roles')
    .select('role_id, roles(name)')
    .eq('profile_id', p.id)
    .eq('school_id', p.school_id)

  const roles: string[] = []
  if (roleRecords) {
    for (const record of roleRecords) {
      const roleData = (record as Record<string, unknown>).roles as { name: string } | null
      if (roleData?.name) {
        roles.push(roleData.name)
      }
    }
  }

  if (roles.length === 0) {
    redirect('/erp/account-not-provisioned')
  }

  if (roles.length === 1) {
    const targetRoute = ROLE_ROUTES[roles[0] as RoleName] || '/erp'
    redirect(targetRoute)
  } else {
    redirect('/erp/select-role')
  }
}

/**
 * Logout server action.
 * Signs out and redirects to login.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Forgot password server action.
 * Sends reset email via Supabase Auth.
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

  redirect('/login')
}
