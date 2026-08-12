// ============================================================
// Auth Schemas — Unit Tests
// ============================================================
import { describe, it, expect } from 'vitest'
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/auth/schemas'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'admin@rps-test.local',
      password: 'TestPass123!',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'TestPass123!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'TestPass123!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@rps-test.local',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'admin@rps-test.local',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'not-valid',
    })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords ≥ 8 chars', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPass123!',
      confirmPassword: 'NewPass123!',
    })
    expect(result.success).toBe(true)
  })

  it('rejects password under 8 chars', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPass123!',
      confirmPassword: 'DifferentPass!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty confirm password', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPass123!',
      confirmPassword: '',
    })
    expect(result.success).toBe(false)
  })
})
