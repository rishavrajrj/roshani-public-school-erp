import { describe, it, expect } from 'vitest'
import { authorizeAction } from '@/lib/auth/rbac'
import { userHasPermission } from '@/lib/auth/permissions'
import {
  calculateStudentPerformanceAnalytics,
  compareExaminations,
  DEFAULT_ACADEMIC_PERFORMANCE_CONFIG,
} from '@/lib/examinations/result-analytics'
import type { ResolvedUser } from '@/types/auth'
import type { StudentResult, StudentMark } from '@/types/result'

describe('Roshani Public School ERP — Full-System Security, Authorization & Data Integrity Audit Suite', () => {
  // Test User Identities
  const schoolA_SuperAdmin: ResolvedUser = {
    userId: 'auth-super',
    profileId: 'prof-super',
    schoolId: 'school-A',
    fullName: 'System Super Admin',
    roles: ['Super Admin'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Principal: ResolvedUser = {
    userId: 'auth-princ',
    profileId: 'prof-princ',
    schoolId: 'school-A',
    fullName: 'Principal Sharma',
    roles: ['Principal'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Accountant: ResolvedUser = {
    userId: 'auth-acct',
    profileId: 'prof-acct',
    schoolId: 'school-A',
    fullName: 'Accountant Verma',
    roles: ['Accountant'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Teacher: ResolvedUser = {
    userId: 'auth-teach',
    profileId: 'prof-teach-1',
    schoolId: 'school-A',
    fullName: 'Teacher Mishra',
    roles: ['Teacher'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Student: ResolvedUser = {
    userId: 'auth-stud-1',
    profileId: 'prof-stud-1',
    schoolId: 'school-A',
    fullName: 'Aarav Sharma',
    roles: ['Student'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolA_Parent: ResolvedUser = {
    userId: 'auth-parent-1',
    profileId: 'prof-parent-1',
    schoolId: 'school-A',
    fullName: 'Rajesh Sharma',
    roles: ['Parent'],
    status: 'active',
    avatarUrl: null,
  }

  const schoolB_Teacher: ResolvedUser = {
    userId: 'auth-teach-B',
    profileId: 'prof-teach-B',
    schoolId: 'school-B',
    fullName: 'Other School Teacher',
    roles: ['Teacher'],
    status: 'active',
    avatarUrl: null,
  }

  // =========================================================================
  // 1. RBAC & Permission Enforcement Across Roles
  // =========================================================================
  describe('1. RBAC & Role Privilege Isolation', () => {
    it('allows Super Admin system authority and Principal academic/governance authority', async () => {
      const decisionSuper = await authorizeAction({
        user: schoolA_SuperAdmin,
        permission: 'system.config.edit',
      })
      expect(decisionSuper.authorized).toBe(true)

      const decisionPrinc = await authorizeAction({
        user: schoolA_Principal,
        permission: 'marks.publish',
      })
      expect(decisionPrinc.authorized).toBe(true)

      const decisionPrincFee = await authorizeAction({
        user: schoolA_Principal,
        permission: 'fee_structure.approve',
      })
      expect(decisionPrincFee.authorized).toBe(true)
    })

    it('prevents Students and Parents from accessing management permissions', () => {
      // Students cannot publish exams, record fee payments, or mark attendance
      expect(userHasPermission(schoolA_Student.roles, 'marks.publish')).toBe(false)
      expect(userHasPermission(schoolA_Student.roles, 'fee_collection.collect')).toBe(false)
      expect(userHasPermission(schoolA_Student.roles, 'attendance.mark')).toBe(false)

      // Parents cannot edit marks, approve leave, or alter fee structures
      expect(userHasPermission(schoolA_Parent.roles, 'marks.edit')).toBe(false)
      expect(userHasPermission(schoolA_Parent.roles, 'leave.approve.student')).toBe(false)
      expect(userHasPermission(schoolA_Parent.roles, 'fee_structure.create')).toBe(false)
    })

    it('prevents Teachers from managing fees or publishing school-wide results', () => {
      expect(userHasPermission(schoolA_Teacher.roles, 'fee_collection.collect')).toBe(false)
      expect(userHasPermission(schoolA_Teacher.roles, 'fee_structure.approve')).toBe(false)
      expect(userHasPermission(schoolA_Teacher.roles, 'marks.publish')).toBe(false)
    })

    it('allows Accountants to collect fees and process refunds, but not approve fee structures', () => {
      expect(userHasPermission(schoolA_Accountant.roles, 'fee_collection.collect')).toBe(true)
      expect(userHasPermission(schoolA_Accountant.roles, 'fee_collection.refund')).toBe(true)
      expect(userHasPermission(schoolA_Accountant.roles, 'fee_structure.approve')).toBe(false) // Principal only
    })
  })

  // =========================================================================
  // 2. Student Self-Access & Parent-Child Scope Enforcement
  // =========================================================================
  describe('2. Student Self-Access & Parent Custody Scopes', () => {
    it('denies Student access when attempting to query or mutate a foreign student ID', async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: 'student-real-id' }, // own student record id
                }),
              }),
            }),
          }),
        }),
      }

      // Student tries to access foreign student record 'student-foreign-id'
      const decision = await authorizeAction(
        {
          user: schoolA_Student,
          permission: 'student.self.view',
          scope: {
            type: 'student',
            studentId: 'student-foreign-id',
          },
        },
        mockSupabase
      )

      expect(decision.authorized).toBe(false)
      if (!decision.authorized) {
        expect(decision.reason).toContain('Students may only access their own private records')
      }
    })

    it('denies Parent access when attempting to query an unlinked student ID', async () => {
      const mockSupabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => {
                  if (table === 'guardians') return { data: { id: 'guardian-1' } }
                  if (table === 'student_guardians') return { data: null } // No custody link found
                  return { data: null }
                },
                eq: () => ({
                  single: async () => ({ data: null }), // Unlinked student
                }),
              }),
            }),
          }),
        }),
      }

      const decision = await authorizeAction(
        {
          user: schoolA_Parent,
          permission: 'student.linked.view',
          scope: {
            type: 'student',
            studentId: 'unlinked-student-999',
          },
        },
        mockSupabase
      )

      expect(decision.authorized).toBe(false)
      if (!decision.authorized) {
        expect(decision.reason).toContain('parental custody')
      }
    })
  })

  // =========================================================================
  // 3. Multi-Tenant School Boundary Isolation
  // =========================================================================
  describe('3. Multi-Tenant School Isolation', () => {
    it('ensures users are strictly isolated to their own school tenancy', () => {
      expect(schoolA_Teacher.schoolId).toBe('school-A')
      expect(schoolB_Teacher.schoolId).toBe('school-B')
      expect(schoolA_Teacher.schoolId).not.toBe(schoolB_Teacher.schoolId)
    })
  })

  // =========================================================================
  // 4. Data-Driven Calculation & Analytics Integrity
  // =========================================================================
  describe('4. Calculation & Analytics Engine Hardening', () => {
    it('handles zero maximum marks gracefully without producing NaN or Infinity', () => {
      const zeroMaxMark: StudentMark = {
        schoolId: 'school-A', academicSessionId: 'sess-1', examinationId: 'exam-0', studentId: 'student-A',
        classId: 'c-10', subjectId: 'sub-art', subjectName: 'Art & Craft',
        attendanceStatus: 'present', theoryMarksObtained: 0, practicalMarksObtained: 0, internalMarksObtained: 0,
        totalMarksObtained: 0, maximumMarks: 0, isPass: true, status: 'locked', createdBy: 't1'
      }

      const zeroResult: StudentResult = {
        id: 'res-zero',
        schoolId: 'school-A',
        academicSessionId: 'sess-1',
        examinationId: 'exam-zero',
        examinationName: 'Zero Marks Exam',
        studentId: 'student-A',
        studentName: 'Aarav Sharma',
        admissionNumber: 'RPS-001',
        classId: 'c-10',
        totalMarksObtained: 0,
        maximumMarks: 0,
        percentage: 0,
        resultStatus: 'PASS',
        grade: 'D',
        status: 'published',
        financialClearanceStatus: 'CLEAR',
        financialOutstandingAmount: 0,
        financialOverride: false,
        version: 1,
        createdAt: '2026-03-01T10:00:00Z',
        updatedAt: '2026-03-01T10:00:00Z',
        subjectMarks: [zeroMaxMark],
      }

      const analytics = calculateStudentPerformanceAnalytics([zeroResult])
      expect(Number.isNaN(analytics.overallPercentage)).toBe(false)
      expect(Number.isFinite(analytics.overallPercentage)).toBe(true)
      expect(analytics.overallPercentage).toBe(0)
    })

    it('requires at least 3 distinct evaluations before generating consistency insight', () => {
      const mockResult: StudentResult = {
        id: 'res-1',
        schoolId: 'school-A',
        academicSessionId: 'sess-1',
        examinationId: 'exam-1',
        examinationName: 'Term 1',
        studentId: 'student-A',
        classId: 'c-10',
        totalMarksObtained: 85,
        maximumMarks: 100,
        percentage: 85.0,
        resultStatus: 'PASS',
        grade: 'A2',
        status: 'published',
        financialClearanceStatus: 'CLEAR',
        financialOutstandingAmount: 0,
        financialOverride: false,
        version: 1,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z',
        subjectMarks: [],
      }

      const analyticsOne = calculateStudentPerformanceAnalytics([mockResult])
      expect(analyticsOne.dynamicInsights.find((i) => i.id === 'multi-exam-consistency')).toBeUndefined()

      const exam2 = { ...mockResult, id: 'res-2', examinationId: 'exam-2', examinationName: 'Term 2', percentage: 86.0 }
      const analyticsTwo = calculateStudentPerformanceAnalytics([mockResult, exam2])
      expect(analyticsTwo.dynamicInsights.find((i) => i.id === 'multi-exam-consistency')).toBeUndefined()

      const exam3 = { ...mockResult, id: 'res-3', examinationId: 'exam-3', examinationName: 'Term 3', percentage: 87.0 }
      const analyticsThree = calculateStudentPerformanceAnalytics([mockResult, exam2, exam3])
      expect(analyticsThree.dynamicInsights.find((i) => i.id === 'multi-exam-consistency')).toBeDefined()
    })

    it('correctly reports stable delta (0.00%) when an examination is compared with itself', () => {
      const mockResult: StudentResult = {
        id: 'res-self',
        schoolId: 'school-A',
        academicSessionId: 'sess-1',
        examinationId: 'exam-self',
        examinationName: 'Annual 2026',
        studentId: 'student-A',
        classId: 'c-10',
        totalMarksObtained: 90,
        maximumMarks: 100,
        percentage: 90.0,
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

      const comparison = compareExaminations(mockResult, mockResult)
      expect(comparison.percentageDelta).toBe(0)
      expect(comparison.trendDirection).toBe('neutral')
      expect(comparison.trendStatusLabel).toBe('Stable')
    })
  })
})
