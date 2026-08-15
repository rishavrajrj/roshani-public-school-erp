// ============================================================
// Workflow State Machine & Lifecycle Validators
// Roshani Public School ERP
// ============================================================
import type { RoleName } from '@/types/auth'

/**
 * 1. FEE STRUCTURE WORKFLOW
 * Admin: Draft -> Edit -> Submit
 * Principal: Approve / Reject -> Active
 * Once Active: Immutable. Version cloning required for modifications.
 */
export type FeeStructureStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'rejected'
  | 'approved'
  | 'active'
  | 'archived'

const FEE_STRUCTURE_TRANSITIONS: Record<FeeStructureStatus, FeeStructureStatus[]> = {
  draft: ['submitted', 'archived'],
  submitted: ['under_review', 'approved', 'rejected', 'draft'],
  under_review: ['approved', 'rejected', 'draft'],
  rejected: ['draft', 'archived'],
  approved: ['active', 'archived'],
  active: ['archived'],
  archived: [],
}

export function validateFeeStructureTransition(
  current: FeeStructureStatus,
  target: FeeStructureStatus,
  roles: string[]
): { allowed: boolean; reason?: string } {
  const allowedNext = FEE_STRUCTURE_TRANSITIONS[current] || []
  if (!allowedNext.includes(target)) {
    return {
      allowed: false,
      reason: `Invalid state transition: Cannot move fee structure from '${current}' to '${target}'.`,
    }
  }

  const isPrincipalOrSuper = roles.includes('Principal') || roles.includes('Super Admin')
  const isAdmin = roles.includes('Admin')

  if (target === 'approved' || target === 'rejected') {
    if (!isPrincipalOrSuper) {
      return {
        allowed: false,
        reason: 'Only the Principal retains authority to approve or reject proposed fee structures.',
      }
    }
  }

  if (target === 'submitted') {
    if (!isAdmin && !isPrincipalOrSuper) {
      return {
        allowed: false,
        reason: 'Only Administrative staff can submit fee structures for approval.',
      }
    }
  }

  return { allowed: true }
}

export function isFeeStructureImmutable(status: FeeStructureStatus): boolean {
  return status === 'approved' || status === 'active' || status === 'archived'
}

/**
 * 2. EXAMINATION & RESULT WORKFLOW
 * Teacher: Draft -> Submit
 * Principal: Review -> Approve -> Publish -> Lock
 * Principal controlled unlock with audit reason.
 */
export type ResultLifecycleStatus =
  | 'draft'
  | 'calculated'
  | 'pending_approval'
  | 'approved'
  | 'blocked'
  | 'override_released'
  | 'published'
  | 'withheld'
  | 'revoked'
  | 'locked'

const RESULT_TRANSITIONS: Record<ResultLifecycleStatus, ResultLifecycleStatus[]> = {
  draft: ['calculated', 'pending_approval'],
  calculated: ['pending_approval', 'blocked', 'approved'],
  pending_approval: ['approved', 'withheld', 'draft'],
  blocked: ['override_released', 'withheld', 'calculated'],
  override_released: ['pending_approval', 'approved'],
  approved: ['published', 'withheld'],
  published: ['locked', 'revoked', 'withheld'],
  withheld: ['approved', 'published', 'revoked'],
  locked: ['published', 'approved'], // Only via controlled unlock by Principal
  revoked: [],
}

export function validateResultTransition(
  current: ResultLifecycleStatus,
  target: ResultLifecycleStatus,
  roles: string[]
): { allowed: boolean; reason?: string } {
  const allowedNext = RESULT_TRANSITIONS[current] || []
  if (!allowedNext.includes(target)) {
    return {
      allowed: false,
      reason: `Invalid result transition: Cannot move from '${current}' to '${target}'.`,
    }
  }

  const isPrincipal = roles.includes('Principal') || roles.includes('Super Admin')

  if (current === 'locked' && (target === 'published' || target === 'approved')) {
    if (!isPrincipal) {
      return {
        allowed: false,
        reason: 'Controlled unlocking of locked results requires Principal authorization with audit reason.',
      }
    }
  }

  if (target === 'approved' || target === 'published' || target === 'locked') {
    if (!isPrincipal) {
      return {
        allowed: false,
        reason: 'Only the Principal retains authority to approve, publish, or lock student examination results.',
      }
    }
  }

  return { allowed: true }
}

/**
 * 3. CERTIFICATE WORKFLOW
 * Admin: DRAFT -> SUBMITTED
 * Principal: APPROVED -> ISSUED -> LOCKED
 */
export type CertificateStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'ISSUED'
  | 'LOCKED'
  | 'REVOKED'

const CERTIFICATE_TRANSITIONS: Record<CertificateStatus, CertificateStatus[]> = {
  DRAFT: ['SUBMITTED', 'REVOKED'],
  SUBMITTED: ['APPROVED', 'DRAFT', 'REVOKED'],
  APPROVED: ['ISSUED', 'REVOKED'],
  ISSUED: ['LOCKED', 'REVOKED'],
  LOCKED: ['REVOKED'],
  REVOKED: [],
}

export function validateCertificateTransition(
  current: CertificateStatus,
  target: CertificateStatus,
  roles: string[]
): { allowed: boolean; reason?: string } {
  const allowedNext = CERTIFICATE_TRANSITIONS[current] || []
  if (!allowedNext.includes(target)) {
    return {
      allowed: false,
      reason: `Invalid certificate transition: Cannot move from '${current}' to '${target}'.`,
    }
  }

  const isPrincipal = roles.includes('Principal') || roles.includes('Super Admin')

  if (target === 'APPROVED' || target === 'ISSUED' || target === 'LOCKED' || target === 'REVOKED') {
    if (!isPrincipal && !roles.includes('Admin')) {
      return {
        allowed: false,
        reason: 'Insufficient permissions for certificate state transition.',
      }
    }
    if ((target === 'APPROVED' || target === 'ISSUED') && !isPrincipal) {
      return {
        allowed: false,
        reason: 'Principal authorization is required to approve and issue institutional certificates.',
      }
    }
  }

  return { allowed: true }
}

/**
 * 4. ADMISSION WORKFLOW
 * Admin: draft -> submitted -> under_review
 * Principal: approved / rejected -> converted
 */
export type AdmissionWorkflowStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'converted'
  | 'withdrawn'

const ADMISSION_TRANSITIONS: Record<AdmissionWorkflowStatus, AdmissionWorkflowStatus[]> = {
  draft: ['submitted', 'withdrawn'],
  submitted: ['under_review', 'withdrawn'],
  under_review: ['approved', 'rejected', 'withdrawn'],
  approved: ['converted', 'withdrawn'],
  rejected: [],
  converted: [],
  withdrawn: [],
}

export function validateAdmissionTransition(
  current: AdmissionWorkflowStatus,
  target: AdmissionWorkflowStatus,
  roles: string[]
): { allowed: boolean; reason?: string } {
  const allowedNext = ADMISSION_TRANSITIONS[current] || []
  if (!allowedNext.includes(target)) {
    return {
      allowed: false,
      reason: `Invalid admission transition: Cannot move from '${current}' to '${target}'.`,
    }
  }

  const isPrincipal = roles.includes('Principal') || roles.includes('Super Admin')
  const isAdmin = roles.includes('Admin')

  if (target === 'approved' || target === 'rejected') {
    if (!isPrincipal && !isAdmin) {
      return {
        allowed: false,
        reason: 'Final admission decisions require Principal / Administrative authority.',
      }
    }
  }

  return { allowed: true }
}
