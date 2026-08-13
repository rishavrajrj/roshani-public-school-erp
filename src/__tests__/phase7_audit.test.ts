import { describe, it, expect, vi } from 'vitest'
import { approveRefundAction } from '@/lib/fees/collection-actions'
import { publishAdmitCardAction } from '@/lib/examinations/admit-card-actions'
import { publishResultsAction } from '@/lib/examinations/result-actions'
import { publishReportCardAction } from '@/lib/examinations/document-actions'
import * as resolveUserModule from '@/lib/auth/resolve-user'
import * as supabaseServerModule from '@/lib/supabase/server'
import * as clearanceServiceModule from '@/lib/fees/clearance-service'

// ============================================================
// PHASE 7 — SECURITY AUDIT REMEDIATION TESTS
// Tests for F3, F4, F7 remediation actions
// ============================================================

describe('Phase 7 Audit Remediation Tests', () => {
  describe('F3 — Refund Self-Approval Prevention', () => {
    it('blocks refund approval when approver is the same as requester', async () => {
      const mockProfileId = 'profile-123'
      const mockSchoolId = 'school-999'

      vi.spyOn(resolveUserModule, 'resolveUser').mockResolvedValue({
        state: 'authenticated',
        user: {
          userId: 'user-123',
          profileId: mockProfileId,
          schoolId: mockSchoolId,
          fullName: 'Test Staff',
          roles: ['Admin'],
          status: 'active',
          avatarUrl: null,
        },
      })

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'refunds') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: async () => ({
                      data: {
                        id: 'refund-1',
                        requested_by: mockProfileId, // Same requester
                        status: 'pending',
                        amount: 1000,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      }

      vi.spyOn(supabaseServerModule, 'createClient').mockResolvedValue(mockSupabase as any)

      const result = await approveRefundAction({ refundId: '11111111-1111-4111-8111-111111111111' })

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Self-approval is not permitted/)
    })
  })

  describe('F4 — Live Financial Clearance Re-check at Publication', () => {
    it('blocks admit card publication if live financial clearance status is OUTSTANDING', async () => {
      const mockProfileId = 'profile-123'
      const mockSchoolId = 'school-999'

      vi.spyOn(resolveUserModule, 'resolveUser').mockResolvedValue({
        state: 'authenticated',
        user: {
          userId: 'user-123',
          profileId: mockProfileId,
          schoolId: mockSchoolId,
          fullName: 'Admin User',
          roles: ['Admin'],
          status: 'active',
          avatarUrl: null,
        },
      })

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'admit_cards') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: async () => ({
                      data: {
                        id: 'admit-1',
                        student_id: 'student-1',
                        academic_session_id: 'session-1',
                        status: 'eligible',
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
              update: () => ({
                eq: async () => ({ data: null, error: null }),
              }),
            }
          }
          return {}
        }),
      }

      vi.spyOn(supabaseServerModule, 'createClient').mockResolvedValue(mockSupabase as any)

      // Mock live clearance returning OUTSTANDING balance
      vi.spyOn(clearanceServiceModule, 'getFinancialClearance').mockResolvedValue({
        studentId: 'student-1',
        academicSessionId: 'session-1',
        status: 'OUTSTANDING',
        totalBilled: 10000,
        totalPaid: 2000,
        totalDiscounts: 0,
        totalLateFees: 0,
        totalOutstanding: 8000,
        calculatedAt: new Date().toISOString(),
      })

      const result = await publishAdmitCardAction({ admitCardId: '22222222-2222-4222-8222-222222222222' })

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/Financial clearance check failed at publication time/)
    })

    it('withholds results at publication time if live financial clearance fails', async () => {
      const mockProfileId = 'profile-123'
      const mockSchoolId = 'school-999'

      vi.spyOn(resolveUserModule, 'resolveUser').mockResolvedValue({
        state: 'authenticated',
        user: {
          userId: 'user-123',
          profileId: mockProfileId,
          schoolId: mockSchoolId,
          fullName: 'Admin User',
          roles: ['Admin'],
          status: 'active',
          avatarUrl: null,
        },
      })

      const updateResultSpy = vi.fn().mockImplementation(() => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                select: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }))

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'examinations') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: async () => ({ data: { status: 'completed' } }),
                  }),
                }),
              }),
            }
          }
          if (table === 'student_results') {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    eq: () => ({
                      in: async () => ({
                        data: [
                          {
                            id: 'result-1',
                            student_id: 'student-bad-debt',
                            academic_session_id: 'session-1',
                            status: 'approved',
                          },
                        ],
                      }),
                    }),
                  }),
                }),
              }),
              update: updateResultSpy,
            }
          }
          if (table === 'audit_logs') {
            return { insert: async () => ({}) }
          }
          return {}
        }),
      }

      vi.spyOn(supabaseServerModule, 'createClient').mockResolvedValue(mockSupabase as any)

      vi.spyOn(clearanceServiceModule, 'getFinancialClearance').mockResolvedValue({
        studentId: 'student-bad-debt',
        academicSessionId: 'session-1',
        status: 'OUTSTANDING',
        totalBilled: 5000,
        totalPaid: 0,
        totalDiscounts: 0,
        totalLateFees: 0,
        totalOutstanding: 5000,
        calculatedAt: new Date().toISOString(),
      })

      const result = await publishResultsAction({
        examinationId: '33333333-3333-4333-8333-333333333333',
        classId: '44444444-4444-4444-8444-444444444444',
      })

      expect(result.success).toBe(true)
      expect(updateResultSpy).toHaveBeenCalled()
    })
  })

  describe('F7 — Report Card Approval Gate before Publication', () => {
    it('queries only approved report cards when publishing', async () => {
      const mockProfileId = 'profile-123'
      const mockSchoolId = 'school-999'

      vi.spyOn(resolveUserModule, 'resolveUser').mockResolvedValue({
        state: 'authenticated',
        user: {
          userId: 'user-123',
          profileId: mockProfileId,
          schoolId: mockSchoolId,
          fullName: 'Principal User',
          roles: ['Principal'],
          status: 'active',
          avatarUrl: null,
        },
      })

      let inClausePassed: string[] = []

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'report_cards') {
            return {
              update: () => ({
                eq: () => ({
                  eq: () => ({
                    eq: () => ({
                      in: (col: string, statuses: string[]) => {
                        inClausePassed = statuses
                        return {
                          select: async () => ({ data: [{ id: 'rc-1' }], error: null }),
                        }
                      },
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'audit_logs') {
            return { insert: async () => ({}) }
          }
          return {}
        }),
      }

      vi.spyOn(supabaseServerModule, 'createClient').mockResolvedValue(mockSupabase as any)

      const result = await publishReportCardAction({
        examinationId: '55555555-5555-4555-8555-555555555555',
        classId: '66666666-6666-4666-8666-666666666666',
      })

      expect(result.success).toBe(true)
      expect(inClausePassed).toEqual(['approved'])
      expect(inClausePassed).not.toContain('generated')
    })
  })
})
