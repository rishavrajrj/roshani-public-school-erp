// ============================================================
// Auth Types — Roshani Public School ERP
// ============================================================

/** Resolved user context from server-side auth + profile + role resolution */
export type ResolvedUser = {
  userId: string       // auth.users.id
  profileId: string    // profiles.id
  schoolId: string     // profiles.school_id
  fullName: string     // profiles.full_name
  roles: string[]      // e.g. ['Admin', 'Teacher']
  status: ProfileStatus
  avatarUrl: string | null
  displayId?: string
  studentCode?: string | null
  admissionNumber?: string | null
  employeeCode?: string | null
  guardianCode?: string | null
}

/** Profile status values matching the database CHECK constraint */
export type ProfileStatus = 'active' | 'inactive' | 'suspended'

/** Authentication state machine */
export type AuthState =
  | { state: 'unauthenticated' }
  | { state: 'authenticated'; user: ResolvedUser }
  | { state: 'unprovisioned'; userId: string }
  | { state: 'disabled'; userId: string; status: ProfileStatus }

/** Result from server actions (login, forgot-password, etc.) */
export type AuthActionResult = {
  success: boolean
  error?: string
  redirectUrl?: string
}

/** Login form data shape */
export type LoginFormData = {
  email: string
  password: string
}

/** Forgot password form data */
export type ForgotPasswordFormData = {
  email: string
}

/** Reset password form data */
export type ResetPasswordFormData = {
  password: string
  confirmPassword: string
}

/** Role name literal type matching database roles */
export type RoleName =
  | 'Super Admin'
  | 'Admin'
  | 'Principal'
  | 'Accountant'
  | 'Teacher'
  | 'Parent'
  | 'Student'
