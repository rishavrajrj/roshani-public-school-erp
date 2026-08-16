import { describe, it, expect } from 'vitest'
import { authorizeAction } from '@/lib/auth/rbac'
import { userHasPermission } from '@/lib/auth/permissions'
import { sanitizeRedirectPath } from '@/lib/auth/redirect'
import { checkLoginRateLimit, recordFailedAttempt, resetRateLimits } from '@/lib/auth/rate-limiter'
import { SECURITY_HEADERS } from '../../next.config'
import {
  calculateStudentPerformanceAnalytics,
  compareExaminations,
} from '@/lib/examinations/result-analytics'
import type { ResolvedUser } from '@/types/auth'
import type { StudentResult, StudentMark } from '@/types/result'

describe('Roshani Public School ERP — Release Gate & Production Readiness Security Verification', () => {
  // Test User Contexts
  const schoolA_SuperAdmin: ResolvedUser = {
    userId: 'usr-super-a',
    profileId: 'prof-super-a',
    schoolId: 'school-A',
    fullName: 'Super Admin',
    roles: ['Super Admin'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Principal: ResolvedUser = {
    userId: 'usr-princ-a',
    profileId: 'prof-princ-a',
    schoolId: 'school-A',
    fullName: 'Principal Sharma',
    roles: ['Principal'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Admin: ResolvedUser = {
    userId: 'usr-admin-a',
    profileId: 'prof-admin-a',
    schoolId: 'school-A',
    fullName: 'Admin Vice Principal',
    roles: ['Admin'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Teacher: ResolvedUser = {
    userId: 'usr-teach-a',
    profileId: 'prof-teach-a',
    schoolId: 'school-A',
    fullName: 'Teacher Mishra',
    roles: ['Teacher'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Student: ResolvedUser = {
    userId: 'usr-stud-a1',
    profileId: 'prof-stud-a1',
    schoolId: 'school-A',
    fullName: 'Aarav Sharma',
    roles: ['Student'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Parent: ResolvedUser = {
    userId: 'usr-parent-a1',
    profileId: 'prof-parent-a1',
    schoolId: 'school-A',
    fullName: 'Rajesh Sharma',
    roles: ['Parent'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Accountant: ResolvedUser = {
    userId: 'usr-acct-a',
    profileId: 'prof-acct-a',
    schoolId: 'school-A',
    fullName: 'Accountant Verma',
    roles: ['Accountant'],
    status: 'active',
    avatarUrl: null,
  }

  // =========================================================================
  // 1. Authentication & Open Redirect Security
  // =========================================================================
  describe('1. Authentication & Open Redirect Sanitization', () => {
    it('sanitizes malicious external open redirects back to safe default /erp', () => {
      expect(sanitizeRedirectPath('https://evil-hacker.com/steal-session', '/erp')).toBe('/erp')
      expect(sanitizeRedirectPath('//evil-phishing.com', '/erp')).toBe('/erp')
      expect(sanitizeRedirectPath('javascript:alert(1)', '/erp')).toBe('/erp')
      expect(sanitizeRedirectPath('/erp/student/results', '/erp')).toBe('/erp/student/results')
      expect(sanitizeRedirectPath('/erp/teacher/marks', '/erp')).toBe('/erp/teacher/marks')
    })

    it('enforces lockout after maximum failed attempts in rate limiter', () => {
      resetRateLimits()
      const testEmail = `test-release-${Date.now()}@roshani.edu`

      // Initial state: allowed
      expect(checkLoginRateLimit(testEmail).allowed).toBe(true)

      // Record 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(testEmail)
      }

      // 6th attempt is locked out
      const limitResult = checkLoginRateLimit(testEmail)
      expect(limitResult.allowed).toBe(false)
      expect(limitResult.retryAfterSeconds).toBeGreaterThan(0)

      // Cleanup
      resetRateLimits()
    })
  })

  // =========================================================================
  // 2. HTTP Security Headers
  // =========================================================================
  describe('2. HTTP Security Headers Verification', () => {
    it('contains all required security headers including nosniff, DENY, CSP, and Referrer Policy', () => {
      const keys = SECURITY_HEADERS.map((h) => h.key)
      expect(keys).toContain('X-Content-Type-Options')
      expect(keys).toContain('X-Frame-Options')
      expect(keys).toContain('Referrer-Policy')
      expect(keys).toContain('Content-Security-Policy')
      expect(keys).toContain('Permissions-Policy')

      const xFrame = SECURITY_HEADERS.find((h) => h.key === 'X-Frame-Options')
      expect(xFrame?.value).toBe('DENY')

      const nosniff = SECURITY_HEADERS.find((h) => h.key === 'X-Content-Type-Options')
      expect(nosniff?.value).toBe('nosniff')
    })
  })

  // =========================================================================
  // 3. Granular RBAC & Role Boundaries
  // =========================================================================
  describe('3. Granular RBAC Role Boundaries', () => {
    it('strictly segregates System Authority vs Academic Governance vs Finance', () => {
      // Super Admin: System config
      expect(userHasPermission(schoolA_SuperAdmin.roles, 'system.config.edit')).toBe(true)
      expect(userHasPermission(schoolA_SuperAdmin.roles, 'system.roles.manage')).toBe(true)

      // Principal: Academic & governance, publish marks, approve fee structures
      expect(userHasPermission(schoolA_Principal.roles, 'marks.publish')).toBe(true)
      expect(userHasPermission(schoolA_Principal.roles, 'fee_structure.approve')).toBe(true)
      expect(userHasPermission(schoolA_Principal.roles, 'system.config.edit')).toBe(false)

      // Accountant: Fee collection and refunds, cannot approve fee structures or publish marks
      expect(userHasPermission(schoolA_Accountant.roles, 'fee_collection.collect')).toBe(true)
      expect(userHasPermission(schoolA_Accountant.roles, 'fee_collection.refund')).toBe(true)
      expect(userHasPermission(schoolA_Accountant.roles, 'fee_structure.approve')).toBe(false)
      expect(userHasPermission(schoolA_Accountant.roles, 'marks.publish')).toBe(false)

      // Student: Self views only, cannot mutate attendance, fees, marks
      expect(userHasPermission(schoolA_Student.roles, 'student.self.view')).toBe(true)
      expect(userHasPermission(schoolA_Student.roles, 'attendance.self.view')).toBe(true)
      expect(userHasPermission(schoolA_Student.roles, 'result.self.view')).toBe(true)
      expect(userHasPermission(schoolA_Student.roles, 'attendance.mark')).toBe(false)
      expect(userHasPermission(schoolA_Student.roles, 'fee_collection.collect')).toBe(false)
      expect(userHasPermission(schoolA_Student.roles, 'marks.create')).toBe(false)

      // Parent: Linked views only
      expect(userHasPermission(schoolA_Parent.roles, 'student.linked.view')).toBe(true)
      expect(userHasPermission(schoolA_Parent.roles, 'attendance.linked.view')).toBe(true)
      expect(userHasPermission(schoolA_Parent.roles, 'result.linked.view')).toBe(true)
      expect(userHasPermission(schoolA_Parent.roles, 'marks.edit')).toBe(false)
    })
  })

  // =========================================================================
  // 4. Object-Level IDOR & Custody Scopes
  // =========================================================================
  describe('4. Object-Level IDOR Protection & Custody Verification', () => {
    it('denies Student from querying another student record via IDOR manipulation', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: { id: 'real-student-id' } }),
              }),
            }),
          }),
        }),
      }

      const decision = await authorizeAction(
        {
          user: schoolA_Student,
          permission: 'student.self.view',
          scope: {
            type: 'student',
            studentId: 'target-victim-student-id',
          },
        },
        mockSupabase
      )

      expect(decision.authorized).toBe(false)
    })

    it('denies Teacher from marking attendance or entering marks for unassigned classes', async () => {
      const createChainableQuery = () => {
        const queryObj: any = {
          eq: () => queryObj,
          or: () => queryObj,
          then: (resolve: any) => resolve({ data: [], error: null }),
        }
        return queryObj
      }

      const mockSupabase = {
        from: () => ({
          select: () => createChainableQuery(),
        }),
      }

      const decision = await authorizeAction(
        {
          user: schoolA_Teacher,
          permission: 'attendance.mark',
          scope: {
            type: 'section',
            classId: 'unassigned-class-12',
            sectionId: 'unassigned-sec-b',
          },
        },
        mockSupabase
      )

      expect(decision.authorized).toBe(false)
    })
  })

  // =========================================================================
  // 5. Financial & Numerical Calculation Integrity
  // =========================================================================
  describe('5. Data-Driven Calculation & Numerical Integrity', () => {
    it('maintains mathematical precision without producing NaN or Infinity in exam analytics', () => {
      const mockResult: StudentResult = {
        id: 'res-rel-gate',
        schoolId: 'school-A',
        academicSessionId: 'sess-1',
        examinationId: 'exam-1',
        examinationName: 'Final Board Exam',
        studentId: 'student-A',
        classId: 'c-10',
        totalMarksObtained: 95.5,
        maximumMarks: 100,
        percentage: 95.5,
        resultStatus: 'PASS',
        grade: 'A1',
        status: 'published',
        financialClearanceStatus: 'CLEAR',
        financialOutstandingAmount: 0,
        financialOverride: false,
        version: 1,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
        subjectMarks: [],
      }

      const analytics = calculateStudentPerformanceAnalytics([mockResult])
      expect(analytics.overallPercentage).toBe(95.5)
      expect(analytics.overallGrade).toBe('A1')
      expect(Number.isNaN(analytics.overallPercentage)).toBe(false)
      expect(Number.isFinite(analytics.overallPercentage)).toBe(true)
    })
  })
})
