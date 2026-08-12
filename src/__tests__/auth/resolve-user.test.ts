// ============================================================
// hasAnyRole — Unit Tests
// ============================================================
import { describe, it, expect } from 'vitest'
import { hasAnyRole } from '@/lib/auth/resolve-user'
import type { ResolvedUser } from '@/types/auth'

function makeUser(roles: string[]): ResolvedUser {
  return {
    userId: 'test-user-id',
    profileId: 'test-profile-id',
    schoolId: 'test-school-id',
    fullName: 'Test User',
    roles,
    status: 'active',
    avatarUrl: null,
  }
}

describe('hasAnyRole', () => {
  it('returns true when user has the required role', () => {
    const user = makeUser(['Admin'])
    expect(hasAnyRole(user, ['Admin'])).toBe(true)
  })

  it('returns true when user has one of the required roles', () => {
    const user = makeUser(['Teacher'])
    expect(hasAnyRole(user, ['Admin', 'Teacher'])).toBe(true)
  })

  it('returns false when user has no matching roles', () => {
    const user = makeUser(['Student'])
    expect(hasAnyRole(user, ['Admin', 'Teacher'])).toBe(false)
  })

  it('returns true when user has multiple roles and one matches', () => {
    const user = makeUser(['Admin', 'Teacher'])
    expect(hasAnyRole(user, ['Teacher'])).toBe(true)
  })

  it('returns false when allowed roles list is empty', () => {
    const user = makeUser(['Admin'])
    expect(hasAnyRole(user, [])).toBe(false)
  })

  it('returns false when user has no roles', () => {
    const user = makeUser([])
    expect(hasAnyRole(user, ['Admin'])).toBe(false)
  })

  it('Super Admin can access admin portal', () => {
    const user = makeUser(['Super Admin'])
    expect(hasAnyRole(user, ['Super Admin', 'Admin'])).toBe(true)
  })

  it('Teacher cannot access admin portal', () => {
    const user = makeUser(['Teacher'])
    expect(hasAnyRole(user, ['Super Admin', 'Admin'])).toBe(false)
  })

  it('Parent cannot access admin portal', () => {
    const user = makeUser(['Parent'])
    expect(hasAnyRole(user, ['Super Admin', 'Admin'])).toBe(false)
  })

  it('Student cannot access admin portal', () => {
    const user = makeUser(['Student'])
    expect(hasAnyRole(user, ['Super Admin', 'Admin'])).toBe(false)
  })
})
