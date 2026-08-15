import { describe, it, expect, vi } from 'vitest'
import { authorizeAction } from '@/lib/auth/rbac'
import type { ResolvedUser } from '@/types/auth'

describe('Organizational Scopes & IDOR Isolation', () => {
  const teacherUser: ResolvedUser = {
    userId: 'user-t1',
    profileId: 'prof-t1',
    schoolId: 'school-1',
    fullName: 'Priya Singh',
    roles: ['Teacher'],
    status: 'active',
    avatarUrl: null,
  }

  const studentUser: ResolvedUser = {
    userId: 'user-s1',
    profileId: 'prof-s1',
    schoolId: 'school-1',
    fullName: 'Arjun Kumar',
    roles: ['Student'],
    status: 'active',
    avatarUrl: null,
  }

  const parentUser: ResolvedUser = {
    userId: 'user-p1',
    profileId: 'prof-p1',
    schoolId: 'school-1',
    fullName: 'Rajesh Kumar',
    roles: ['Parent'],
    status: 'active',
    avatarUrl: null,
  }

  it('verifies teacher cannot access unauthorized actions', async () => {
    const dec = await authorizeAction({
      user: teacherUser,
      permission: 'fee_structure.create',
    })
    expect(dec.authorized).toBe(false)
    if (!dec.authorized) {
      expect(dec.reason).toContain('Forbidden')
    }
  })

  it('verifies student cannot access administrative permissions', async () => {
    const dec = await authorizeAction({
      user: studentUser,
      permission: 'student.create',
    })
    expect(dec.authorized).toBe(false)
  })

  it('verifies parent cannot access system administration', async () => {
    const dec = await authorizeAction({
      user: parentUser,
      permission: 'system.config.edit',
    })
    expect(dec.authorized).toBe(false)
  })
})
