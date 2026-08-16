import { describe, it, expect } from 'vitest'
import {
  ROLE_PORTAL_MAP,
  getRoleBranding,
  getPortalName,
  getRoleBadge,
  normalizeRoleName,
} from '@/lib/auth/portal-mapping'

describe('Centralized Role to Portal Mapping — Roshani Public School ERP', () => {
  describe('1. Canonical Role to Portal Mapping Verification', () => {
    const canonicalMappings = [
      { role: 'Super Admin', portal: 'Super Admin Portal', badge: 'SUPER ADMIN' },
      { role: 'Admin', portal: 'Admin Portal', badge: 'ADMIN' },
      { role: 'Principal', portal: 'Principal Portal', badge: 'PRINCIPAL' },
      { role: 'Vice Principal', portal: 'Vice Principal Portal', badge: 'VICE PRINCIPAL' },
      { role: 'Teacher', portal: 'Teacher Portal', badge: 'TEACHER' },
      { role: 'Class Teacher', portal: 'Class Teacher Portal', badge: 'CLASS TEACHER' },
      { role: 'Accountant', portal: 'Accounts Portal', badge: 'ACCOUNTS' },
      { role: 'Librarian', portal: 'Library Portal', badge: 'LIBRARIAN' },
      { role: 'Receptionist', portal: 'Reception Portal', badge: 'RECEPTIONIST' },
      { role: 'Exam In-charge', portal: 'Examination Portal', badge: 'EXAM IN-CHARGE' },
      { role: 'Admission Staff', portal: 'Admission Portal', badge: 'ADMISSION STAFF' },
      { role: 'HR', portal: 'HR Portal', badge: 'HR' },
      { role: 'Transport In-charge', portal: 'Transport Portal', badge: 'TRANSPORT' },
      { role: 'Student', portal: 'Student Portal', badge: 'STUDENT' },
      { role: 'Parent', portal: 'Parent Portal', badge: 'PARENT' },
    ]

    for (const item of canonicalMappings) {
      it(`maps ${item.role} -> ${item.portal} [${item.badge}]`, () => {
        const branding = getRoleBranding(item.role)
        expect(branding.portalTitle).toBe('Roshani Public School')
        expect(branding.portalLabel).toBe(item.portal)
        expect(branding.badge).toBe(item.badge)
        expect(getPortalName(item.role)).toBe(item.portal)
        expect(getRoleBadge(item.role)).toBe(item.badge)
      })
    }
  })

  describe('2. Case-Insensitivity & Safe Format Normalization', () => {
    it('normalizes various casing and hyphenation formats for Admin', () => {
      expect(getPortalName('admin')).toBe('Admin Portal')
      expect(getPortalName('ADMIN')).toBe('Admin Portal')
      expect(getPortalName('Admin')).toBe('Admin Portal')
      expect(getRoleBadge('admin')).toBe('ADMIN')
    })

    it('normalizes various formats for Super Admin', () => {
      expect(getPortalName('super admin')).toBe('Super Admin Portal')
      expect(getPortalName('SUPER ADMIN')).toBe('Super Admin Portal')
      expect(getPortalName('super_admin')).toBe('Super Admin Portal')
      expect(getPortalName('superadmin')).toBe('Super Admin Portal')
      expect(getRoleBadge('super_admin')).toBe('SUPER ADMIN')
    })

    it('normalizes various formats for Student', () => {
      expect(getPortalName('student')).toBe('Student Portal')
      expect(getPortalName('STUDENT')).toBe('Student Portal')
      expect(getPortalName('Student')).toBe('Student Portal')
      expect(getRoleBadge('student')).toBe('STUDENT')
    })

    it('normalizes various formats for Teacher & Class Teacher', () => {
      expect(getPortalName('teacher')).toBe('Teacher Portal')
      expect(getPortalName('TEACHER')).toBe('Teacher Portal')
      expect(getPortalName('class teacher')).toBe('Class Teacher Portal')
      expect(getPortalName('class_teacher')).toBe('Class Teacher Portal')
      expect(getPortalName('class-teacher')).toBe('Class Teacher Portal')
    })

    it('normalizes various formats for Exam In-charge & Transport', () => {
      expect(getPortalName('exam in-charge')).toBe('Examination Portal')
      expect(getPortalName('exam incharge')).toBe('Examination Portal')
      expect(getPortalName('exam_incharge')).toBe('Examination Portal')
      expect(getPortalName('transport incharge')).toBe('Transport Portal')
      expect(getPortalName('transport_incharge')).toBe('Transport Portal')
    })
  })

  describe('3. Dynamic Role Isolation & Strict Separation', () => {
    it('ensures a Student user never sees Admin or Teacher Portal', () => {
      const studentBrand = getRoleBranding('Student')
      expect(studentBrand.portalLabel).toBe('Student Portal')
      expect(studentBrand.portalLabel).not.toBe('Admin Portal')
      expect(studentBrand.portalLabel).not.toBe('Teacher Portal')
      expect(studentBrand.badge).toBe('STUDENT')
    })

    it('ensures a Teacher user never sees Admin or Student Portal', () => {
      const teacherBrand = getRoleBranding('Teacher')
      expect(teacherBrand.portalLabel).toBe('Teacher Portal')
      expect(teacherBrand.portalLabel).not.toBe('Admin Portal')
      expect(teacherBrand.portalLabel).not.toBe('Student Portal')
      expect(teacherBrand.badge).toBe('TEACHER')
    })

    it('ensures a Principal user sees Principal Portal', () => {
      const principalBrand = getRoleBranding('Principal')
      expect(principalBrand.portalLabel).toBe('Principal Portal')
      expect(principalBrand.badge).toBe('PRINCIPAL')
    })

    it('ensures an Accountant user sees Accounts Portal', () => {
      const accountsBrand = getRoleBranding('Accountant')
      expect(accountsBrand.portalLabel).toBe('Accounts Portal')
      expect(accountsBrand.badge).toBe('ACCOUNTS')
    })

    it('ensures an Admin user sees Admin Portal', () => {
      const adminBrand = getRoleBranding('Admin')
      expect(adminBrand.portalLabel).toBe('Admin Portal')
      expect(adminBrand.badge).toBe('ADMIN')
    })
  })
})
