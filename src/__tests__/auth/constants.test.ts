// ============================================================
// Auth Constants — Unit Tests
// ============================================================
import { describe, it, expect } from 'vitest'
import { ROLE_ROUTES, ROUTE_ALLOWED_ROLES, ROLE_PRIORITY } from '@/lib/auth/constants'
import type { RoleName } from '@/types/auth'

describe('ROLE_ROUTES', () => {
  it('maps all 7 roles to routes', () => {
    const roles: RoleName[] = ['Super Admin', 'Admin', 'Principal', 'Accountant', 'Teacher', 'Parent', 'Student']
    for (const role of roles) {
      expect(ROLE_ROUTES[role]).toBeDefined()
      expect(ROLE_ROUTES[role]).toMatch(/^\/erp\//)
    }
  })

  it('maps Super Admin and Admin to /erp/admin', () => {
    expect(ROLE_ROUTES['Super Admin']).toBe('/erp/admin')
    expect(ROLE_ROUTES['Admin']).toBe('/erp/admin')
  })

  it('maps each role to its own portal', () => {
    expect(ROLE_ROUTES['Principal']).toBe('/erp/principal')
    expect(ROLE_ROUTES['Teacher']).toBe('/erp/teacher')
    expect(ROLE_ROUTES['Accountant']).toBe('/erp/accountant')
    expect(ROLE_ROUTES['Parent']).toBe('/erp/parent')
    expect(ROLE_ROUTES['Student']).toBe('/erp/student')
  })
})

describe('ROUTE_ALLOWED_ROLES', () => {
  it('/erp/admin allows Super Admin and Admin', () => {
    expect(ROUTE_ALLOWED_ROLES['/erp/admin']).toContain('Super Admin')
    expect(ROUTE_ALLOWED_ROLES['/erp/admin']).toContain('Admin')
    expect(ROUTE_ALLOWED_ROLES['/erp/admin']).not.toContain('Teacher')
  })

  it('each portal only allows its designated role', () => {
    expect(ROUTE_ALLOWED_ROLES['/erp/teacher']).toEqual(['Teacher'])
    expect(ROUTE_ALLOWED_ROLES['/erp/accountant']).toEqual(['Accountant'])
    expect(ROUTE_ALLOWED_ROLES['/erp/parent']).toEqual(['Parent'])
    expect(ROUTE_ALLOWED_ROLES['/erp/student']).toEqual(['Student'])
  })
})

describe('ROLE_PRIORITY', () => {
  it('Super Admin has highest priority (lowest number)', () => {
    expect(ROLE_PRIORITY['Super Admin']).toBeLessThan(ROLE_PRIORITY['Admin'])
    expect(ROLE_PRIORITY['Super Admin']).toBeLessThan(ROLE_PRIORITY['Student'])
  })

  it('Student has lowest priority (highest number)', () => {
    expect(ROLE_PRIORITY['Student']).toBeGreaterThan(ROLE_PRIORITY['Admin'])
    expect(ROLE_PRIORITY['Student']).toBeGreaterThan(ROLE_PRIORITY['Teacher'])
  })
})
