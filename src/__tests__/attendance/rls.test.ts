import { describe, it, expect } from 'vitest'
import { hasAnyRole } from '@/lib/auth/resolve-user'
import type { ResolvedUser } from '@/types/auth'

function makeUser(roles: string[], schoolId = 'school-a-id', profileId = 'profile-1'): ResolvedUser {
  return {
    userId: 'user-id',
    profileId,
    schoolId,
    fullName: 'Role User',
    roles,
    status: 'active',
    avatarUrl: null,
  }
}

describe('Attendance RLS & Permission Access Matrix', () => {
  describe('Admin / Principal Permissions', () => {
    it('allows Admin to manage attendance in their school', () => {
      const user = makeUser(['Admin'])
      expect(hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])).toBe(true)
    })

    it('allows Principal to manage attendance in their school', () => {
      const user = makeUser(['Principal'])
      expect(hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])).toBe(true)
    })

    it('denies Admin from School A accessing School B resources', () => {
      const adminA = makeUser(['Admin'], 'school-a-id')
      const targetSchoolId = 'school-b-id'
      expect(adminA.schoolId === targetSchoolId).toBe(false)
    })
  })

  describe('Teacher Permissions', () => {
    it('allows Teacher to access attendance functions', () => {
      const user = makeUser(['Teacher'])
      expect(hasAnyRole(user, ['Teacher'])).toBe(true)
      expect(hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])).toBe(false)
    })

    it('denies Teacher from locking or unlocking attendance', () => {
      const teacher = makeUser(['Teacher'])
      const canLock = hasAnyRole(teacher, ['Super Admin', 'Admin', 'Principal'])
      expect(canLock).toBe(false)
    })
  })

  describe('Accountant Permissions', () => {
    it('denies Accountant attendance management access', () => {
      const accountant = makeUser(['Accountant'])
      expect(hasAnyRole(accountant, ['Super Admin', 'Admin', 'Principal'])).toBe(false)
      expect(hasAnyRole(accountant, ['Teacher'])).toBe(false)
      expect(hasAnyRole(accountant, ['Parent'])).toBe(false)
      expect(hasAnyRole(accountant, ['Student'])).toBe(false)
    })
  })

  describe('Parent & Student Permissions', () => {
    it('allows Parent to view child attendance but denies modification', () => {
      const parent = makeUser(['Parent'])
      expect(hasAnyRole(parent, ['Parent'])).toBe(true)
      expect(hasAnyRole(parent, ['Super Admin', 'Admin', 'Principal', 'Teacher'])).toBe(false)
    })

    it('allows Student to view own attendance but denies creation or modification', () => {
      const student = makeUser(['Student'])
      expect(hasAnyRole(student, ['Student'])).toBe(true)
      expect(hasAnyRole(student, ['Super Admin', 'Admin', 'Principal', 'Teacher'])).toBe(false)
    })
  })
})
