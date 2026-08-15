import { describe, it, expect } from 'vitest'
import {
  validateFeeStructureTransition,
  isFeeStructureImmutable,
  validateResultTransition,
  validateCertificateTransition,
  validateAdmissionTransition,
} from '@/lib/auth/workflow'

describe('Multi-Stage Workflow State Machines & Immutability', () => {
  describe('1. Fee Structure Workflow', () => {
    it('allows Admin to submit draft fee structure for approval', () => {
      const res = validateFeeStructureTransition('draft', 'submitted', ['Admin'])
      expect(res.allowed).toBe(true)
    })

    it('allows Principal to approve submitted fee structure', () => {
      const res = validateFeeStructureTransition('submitted', 'approved', ['Principal'])
      expect(res.allowed).toBe(true)
    })

    it('forbids Admin from self-approving a fee structure', () => {
      const res = validateFeeStructureTransition('submitted', 'approved', ['Admin'])
      expect(res.allowed).toBe(false)
      expect(res.reason).toContain('Principal retains authority')
    })

    it('enforces immutability on approved and active fee structures', () => {
      expect(isFeeStructureImmutable('approved')).toBe(true)
      expect(isFeeStructureImmutable('active')).toBe(true)
      expect(isFeeStructureImmutable('draft')).toBe(false)
    })
  })

  describe('2. Examination & Result Workflow', () => {
    it('allows Principal to approve pending results', () => {
      const res = validateResultTransition('calculated', 'approved', ['Principal'])
      expect(res.allowed).toBe(true)
    })

    it('allows Principal to publish and lock approved results', () => {
      const resPub = validateResultTransition('approved', 'published', ['Principal'])
      expect(resPub.allowed).toBe(true)

      const resLock = validateResultTransition('published', 'locked', ['Principal'])
      expect(resLock.allowed).toBe(true)
    })

    it('forbids Teachers and Admins from approving or publishing results', () => {
      const resTeacher = validateResultTransition('calculated', 'approved', ['Teacher'])
      expect(resTeacher.allowed).toBe(false)

      const resAdmin = validateResultTransition('approved', 'published', ['Admin'])
      expect(resAdmin.allowed).toBe(false)
    })

    it('allows controlled unlocking of locked results only by Principal', () => {
      const resPrincipal = validateResultTransition('locked', 'published', ['Principal'])
      expect(resPrincipal.allowed).toBe(true)

      const resAdmin = validateResultTransition('locked', 'published', ['Admin'])
      expect(resAdmin.allowed).toBe(false)
    })
  })

  describe('3. Certificate Workflow', () => {
    it('allows Admin to prepare and submit certificates', () => {
      const res = validateCertificateTransition('DRAFT', 'SUBMITTED', ['Admin'])
      expect(res.allowed).toBe(true)
    })

    it('requires Principal authority to approve and issue certificates', () => {
      const resApproveAdmin = validateCertificateTransition('SUBMITTED', 'APPROVED', ['Admin'])
      expect(resApproveAdmin.allowed).toBe(false)

      const resApprovePrincipal = validateCertificateTransition('SUBMITTED', 'APPROVED', ['Principal'])
      expect(resApprovePrincipal.allowed).toBe(true)

      const resIssuePrincipal = validateCertificateTransition('APPROVED', 'ISSUED', ['Principal'])
      expect(resIssuePrincipal.allowed).toBe(true)
    })
  })

  describe('4. Admission Workflow', () => {
    it('allows Admin to review admission applications', () => {
      const res = validateAdmissionTransition('draft', 'submitted', ['Admin'])
      expect(res.allowed).toBe(true)
      const resReview = validateAdmissionTransition('submitted', 'under_review', ['Admin'])
      expect(resReview.allowed).toBe(true)
    })

    it('forbids unauthorized roles from deciding admissions', () => {
      const resTeacher = validateAdmissionTransition('under_review', 'approved', ['Teacher'])
      expect(resTeacher.allowed).toBe(false)
    })
  })
})
