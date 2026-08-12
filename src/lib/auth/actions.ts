// ============================================================
// Auth Server Actions — Roshani Public School ERP
// ============================================================
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './schemas'
import type { AuthActionResult } from '@/types/auth'

/**
 * Login server action.
 * Validates input with Zod, authenticates via Supabase Auth.
 * Never reveals whether a specific email exists.
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

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Safe error message — don't reveal whether email exists
    return { success: false, error: 'Invalid email or password' }
  }

  return { success: true }
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
 * Sends a password reset email via Supabase Auth.
 * Always shows success to avoid revealing whether the email exists.
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get('email'),
  }

  const parsed = forgotPasswordSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { success: false, error: firstError }
  }

  const supabase = await createClient()

  // Always return success regardless of whether email exists
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : ''}${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/reset-password`,
  })

  return { success: true }
}

/**
 * Reset password server action.
 * Updates the user's password after they've clicked the reset link.
 */
export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = resetPasswordSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { success: false, error: firstError }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: 'Failed to update password. Please try again.' }
  }

  return { success: true }
}
