import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SECURITY_HEADERS } from '../../../next.config'
import {
  checkLoginRateLimit,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  resetRateLimits,
} from '@/lib/auth/rate-limiter'
import { broadcastAuthLogout, AUTH_CHANNEL_NAME, LOGOUT_STORAGE_KEY } from '@/components/auth/multi-tab-auth-sync'
import { loginAction, logoutAction, forgotPasswordAction, resetPasswordAction } from '@/lib/auth/actions'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { authorizeAction } from '@/lib/auth/rbac'
import * as supabaseServerModule from '@/lib/supabase/server'
import type { ResolvedUser } from '@/types/auth'

describe('Security Hardening & Login Session Audit Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimits()
  })

  // --------------------------------------------------------------------------
  // 1. HTTP Security Headers Audit
  // --------------------------------------------------------------------------
  describe('1. HTTP Security Headers Audit', () => {
    it('enforces X-Content-Type-Options: nosniff', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'X-Content-Type-Options')
      expect(header).toBeDefined()
      expect(header?.value).toBe('nosniff')
    })

    it('enforces X-Frame-Options: DENY (anti-clickjacking)', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'X-Frame-Options')
      expect(header).toBeDefined()
      expect(header?.value).toBe('DENY')
    })

    it('enforces Referrer-Policy: strict-origin-when-cross-origin', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'Referrer-Policy')
      expect(header).toBeDefined()
      expect(header?.value).toBe('strict-origin-when-cross-origin')
    })

    it('enforces restrictive Permissions-Policy', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'Permissions-Policy')
      expect(header).toBeDefined()
      expect(header?.value).toContain('camera=()')
      expect(header?.value).toContain('microphone=()')
      expect(header?.value).toContain('geolocation=()')
    })

    it('enforces Content-Security-Policy with frame-ancestors none and restrictive origins', () => {
      const header = SECURITY_HEADERS.find((h) => h.key === 'Content-Security-Policy')
      expect(header).toBeDefined()
      expect(header?.value).toContain("default-src 'self'")
      expect(header?.value).toContain("frame-ancestors 'none'")
      expect(header?.value).toContain("base-uri 'self'")
      expect(header?.value).toContain("form-action 'self'")
    })
  })

  // --------------------------------------------------------------------------
  // 2. Application-Level Rate Limiting & Throttling
  // --------------------------------------------------------------------------
  describe('2. Rate Limiting & Brute-Force Protection', () => {
    const testEmail = 'attacker@target.com'

    it('allows initial login attempts without delay', () => {
      const status = checkLoginRateLimit(testEmail)
      expect(status.allowed).toBe(true)
      expect(status.delayMs).toBe(0)
    })

    it('introduces progressive delay after consecutive failed attempts', () => {
      recordFailedAttempt(testEmail) // 1
      recordFailedAttempt(testEmail) // 2
      recordFailedAttempt(testEmail) // 3

      const status = checkLoginRateLimit(testEmail)
      expect(status.allowed).toBe(true)
      expect(status.delayMs).toBeGreaterThan(0)
    })

    it('temporarily locks out login attempts after reaching maximum failures', () => {
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(testEmail)
      }

      const status = checkLoginRateLimit(testEmail)
      expect(status.allowed).toBe(false)
      expect(status.retryAfterSeconds).toBeGreaterThan(0)
      expect(status.message).toContain('Too many failed login attempts')
    })

    it('resets rate limit tracking upon successful authentication', () => {
      for (let i = 0; i < 4; i++) {
        recordFailedAttempt(testEmail)
      }
      expect(checkLoginRateLimit(testEmail).delayMs).toBeGreaterThan(0)

      recordSuccessfulAttempt(testEmail)
      expect(checkLoginRateLimit(testEmail).delayMs).toBe(0)
      expect(checkLoginRateLimit(testEmail).allowed).toBe(true)
    })
  })

  // --------------------------------------------------------------------------
  // 3. Authentication & Failed Login Audit Logging
  // --------------------------------------------------------------------------
  describe('3. Auth Security Events & Audit Trail', () => {
    it('records LOGIN_FAILURE into audit logs without recording passwords', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid login credentials' },
          }),
        },
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      }

      vi.spyOn(supabaseServerModule, 'createClient').mockResolvedValue(mockSupabase as any)

      const formData = new FormData()
      formData.append('email', 'admin@roshanischool.com')
      formData.append('password', 'WrongPassword123!')

      const result = await loginAction(formData)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid login credentials')

      // Verify audit log call
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
      expect(mockInsert).toHaveBeenCalledTimes(1)
      const auditPayload = mockInsert.mock.calls[0][0]
      expect(auditPayload.action).toBe('LOGIN_FAILURE')
      expect(auditPayload.entity_type).toBe('auth')
      expect(auditPayload.new_data.attempted_email).toBe('admin@roshanischool.com')
      // Critical check: password must NEVER be logged!
      expect(JSON.stringify(auditPayload)).not.toContain('WrongPassword123!')
    })

    it('records LOGIN_SUCCESS into audit logs on authenticated entry', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: 'auth-user-123' } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'prof-123',
                  school_id: 'school-123',
                  status: 'active',
                  user_roles: [{ role_id: 'r1', roles: { name: 'Admin' } }],
                },
                error: null,
              }),
            }
          }
          if (table === 'audit_logs') {
            return { insert: mockInsert }
          }
          return {}
        }),
      }

      vi.spyOn(supabaseServerModule, 'createClient').mockResolvedValue(mockSupabase as any)

      const formData = new FormData()
      formData.append('email', 'admin@roshanischool.com')
      formData.append('password', 'ValidPass123!')

      const result = await loginAction(formData)
      expect(result.success).toBe(true)
      expect(result.redirectUrl).toBe('/erp/admin')

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          entity_type: 'auth',
          school_id: 'school-123',
          actor_profile_id: 'prof-123',
          new_data: expect.objectContaining({
            email: 'admin@roshanischool.com',
            roles: ['Admin'],
          }),
        })
      )
      // Passwords never logged
      expect(JSON.stringify(mockInsert.mock.calls[0][0])).not.toContain('ValidPass123!')
    })
  })

  // --------------------------------------------------------------------------
  // 4. Account Disablement & Real-Time Lockout
  // --------------------------------------------------------------------------
  describe('4. Account Disablement & Real-Time Lockout', () => {
    it('immediately denies access when profile status is suspended or inactive', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'auth-user-suspended' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'prof-suspended',
              school_id: 'school-1',
              full_name: 'Suspended Teacher',
              status: 'suspended',
              user_roles: [{ role_id: 'r-teacher', roles: { name: 'Teacher' } }],
            },
            error: null,
          }),
        }),
      }

      vi.spyOn(supabaseServerModule, 'createClient').mockResolvedValue(mockSupabase as any)

      const authState = await resolveUser()
      expect(authState.state).toBe('disabled')
      if (authState.state === 'disabled') {
        expect(authState.status).toBe('suspended')
      }
    })
  })

  // --------------------------------------------------------------------------
  // 5. Dynamic Role Changes & Zero Stale Role Persistence
  // --------------------------------------------------------------------------
  describe('5. Dynamic Role Changes', () => {
    it('immediately reflects modified roles without relying on stale tokens', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'auth-user-demoted' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'prof-demoted',
              school_id: 'school-1',
              full_name: 'Former Admin',
              status: 'active',
              user_roles: [{ role_id: 'r-teacher', roles: { name: 'Teacher' } }], // Demoted from Admin to Teacher
            },
            error: null,
          }),
        }),
      }

      vi.spyOn(supabaseServerModule, 'createClient').mockResolvedValue(mockSupabase as any)

      const authState = await resolveUser()
      expect(authState.state).toBe('authenticated')
      if (authState.state === 'authenticated') {
        expect(authState.user.roles).toEqual(['Teacher'])
        expect(hasAnyRole(authState.user, ['Admin', 'Super Admin'])).toBe(false)
        expect(hasAnyRole(authState.user, ['Teacher'])).toBe(true)
      }
    })
  })

  // --------------------------------------------------------------------------
  // 6. Multi-Tab Logout Broadcast Synchronization
  // --------------------------------------------------------------------------
  describe('6. Multi-Tab Logout Broadcast Synchronization', () => {
    it('dispatches logout broadcast channel message and storage event fallback', () => {
      const mockConstructor = vi.fn()
      const postMessageSpy = vi.fn()
      const closeSpy = vi.fn()
      const setItemSpy = vi.fn()

      class MockBroadcastChannel {
        name: string
        constructor(name: string) {
          this.name = name
          mockConstructor(name)
        }
        postMessage(data: any) {
          postMessageSpy(data)
        }
        close() {
          closeSpy()
        }
      }

      // Mock window and localStorage in Node test environment
      const originalWindow = (global as any).window
      const originalBroadcastChannel = (global as any).BroadcastChannel

      ;(global as any).BroadcastChannel = MockBroadcastChannel
      ;(global as any).window = {
        BroadcastChannel: MockBroadcastChannel,
        localStorage: {
          setItem: setItemSpy,
          getItem: vi.fn(),
          removeItem: vi.fn(),
        },
      }
      ;(global as any).localStorage = (global as any).window.localStorage

      broadcastAuthLogout()

      expect(mockConstructor).toHaveBeenCalledWith(AUTH_CHANNEL_NAME)
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'AUTH_LOGOUT' })
      )
      expect(setItemSpy).toHaveBeenCalledWith(LOGOUT_STORAGE_KEY, expect.any(String))

      ;(global as any).window = originalWindow
      ;(global as any).BroadcastChannel = originalBroadcastChannel
    })
  })

  // --------------------------------------------------------------------------
  // 7. Tenant & Cross-School Isolation
  // --------------------------------------------------------------------------
  describe('7. Tenant & Cross-School Isolation', () => {
    it('denies parent access to students in another school or without verified custody', async () => {
      const parentUser: ResolvedUser = {
        userId: 'auth-parent-1',
        profileId: 'prof-parent-1',
        schoolId: 'school-alpha',
        fullName: 'Parent User',
        roles: ['Parent'],
        status: 'active',
        avatarUrl: null,
      }

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'guardians') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: 'guardian-123' },
                error: null,
              }),
            }
          }
          if (table === 'student_guardians') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null, // No custody link found
                error: { message: 'Row not found' },
              }),
            }
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }),
      }

      const decision = await authorizeAction(
        {
          user: parentUser,
          permission: 'student.linked.view',
          scope: {
            type: 'student',
            studentId: 'student-foreign-school',
          },
        },
        mockSupabase
      )

      expect(decision.authorized).toBe(false)
      if (!decision.authorized) {
        expect(decision.reason).toContain('Access Denied')
      }
    })
  })

  // --------------------------------------------------------------------------
  // 8. Open Redirect Vulnerability Prevention
  // --------------------------------------------------------------------------
  describe('8. Open Redirect Vulnerability Prevention', () => {
    it('allows valid internal ERP paths', async () => {
      const { sanitizeRedirectPath } = await import('@/lib/auth/redirect')
      expect(sanitizeRedirectPath('/erp')).toBe('/erp')
      expect(sanitizeRedirectPath('/erp/admin/attendance')).toBe('/erp/admin/attendance')
      expect(sanitizeRedirectPath('/erp/teacher/marks?subject=math')).toBe('/erp/teacher/marks?subject=math')
    })

    it('rejects external absolute URLs and redirects to fallback', async () => {
      const { sanitizeRedirectPath } = await import('@/lib/auth/redirect')
      expect(sanitizeRedirectPath('https://evil-phishing.com')).toBe('/erp')
      expect(sanitizeRedirectPath('http://attacker.example/steal-session')).toBe('/erp')
      expect(sanitizeRedirectPath('ftp://attacker.example')).toBe('/erp')
    })

    it('rejects protocol-relative and backslash injection bypasses', async () => {
      const { sanitizeRedirectPath } = await import('@/lib/auth/redirect')
      expect(sanitizeRedirectPath('//attacker.com')).toBe('/erp')
      expect(sanitizeRedirectPath('///attacker.com')).toBe('/erp')
      expect(sanitizeRedirectPath('/\\attacker.com')).toBe('/erp')
      expect(sanitizeRedirectPath('\\attacker.com')).toBe('/erp')
      expect(sanitizeRedirectPath('/erp/..//evil.com')).toBe('/erp')
    })

    it('rejects javascript: and data: pseudoprotocol schemes', async () => {
      const { sanitizeRedirectPath } = await import('@/lib/auth/redirect')
      expect(sanitizeRedirectPath('javascript:alert(document.cookie)')).toBe('/erp')
      expect(sanitizeRedirectPath('/javascript:alert(1)')).toBe('/erp')
      expect(sanitizeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/erp')
    })

    it('rejects percent-encoded and multi-encoded evasion bypasses', async () => {
      const { sanitizeRedirectPath } = await import('@/lib/auth/redirect')
      expect(sanitizeRedirectPath('/%2F%2Fevil.com')).toBe('/erp')
      expect(sanitizeRedirectPath('/%5C%5Cevil.com')).toBe('/erp')
      expect(sanitizeRedirectPath('/..%2Fevil.com')).toBe('/erp')
      expect(sanitizeRedirectPath('/%2F..%2Fevil.com')).toBe('/erp')
      expect(sanitizeRedirectPath('/%252F%252Fevil.com')).toBe('/erp')
      expect(sanitizeRedirectPath('/%00//evil.com')).toBe('/erp')
      expect(sanitizeRedirectPath('/%E0%A4%95%E0%A4')).toBe('/erp') // Malformed UTF-8 sequence
    })
  })

  // --------------------------------------------------------------------------
  // 9. Identifier Normalization & DoS Memory Boundary
  // --------------------------------------------------------------------------
  describe('9. Identifier Normalization & DoS Memory Boundary', () => {
    it('normalizes mixed-case and whitespace-padded email identifiers', async () => {
      const { normalizeIdentifier } = await import('@/lib/auth/rate-limiter')
      expect(normalizeIdentifier('  User@Example.COM  ')).toBe('user@example.com')
      expect(normalizeIdentifier('Admin.Staff@School.Edu\t\n')).toBe('admin.staff@school.edu')
    })

    it('safely handles null, undefined, and non-string inputs', async () => {
      const { normalizeIdentifier } = await import('@/lib/auth/rate-limiter')
      expect(normalizeIdentifier(null)).toBe('anonymous_client')
      expect(normalizeIdentifier(undefined)).toBe('anonymous_client')
      expect(normalizeIdentifier('')).toBe('anonymous_client')
    })

    it('clamps oversized identifiers to prevent memory exhaustion', async () => {
      const { normalizeIdentifier } = await import('@/lib/auth/rate-limiter')
      const hugeString = 'a'.repeat(500) + '@school.edu'
      const normalized = normalizeIdentifier(hugeString)
      expect(normalized.length).toBeLessThanOrEqual(255)
    })
  })
})
