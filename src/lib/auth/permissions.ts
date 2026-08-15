// ============================================================
// Granular Permission Matrix & Two-Hierarchy Definitions
// Roshani Public School ERP
// ============================================================
import type { RoleName } from '@/types/auth'

/**
 * Two Distinct Organizational Hierarchies:
 * 1. SYSTEM AUTHORITY: Controls the ERP platform itself
 *    Super Admin -> Admin
 * 2. SCHOOL AUTHORITY: Controls actual school governance & academics
 *    Principal -> Admin / Vice Principal -> Coordinator -> Teacher -> Student
 */
export type HierarchyType = 'system' | 'school' | 'finance' | 'relationship' | 'self'

export type Permission =
  // System Administration
  | 'system.config.view'
  | 'system.config.edit'
  | 'system.users.manage'
  | 'system.roles.manage'
  | 'system.audit.view'
  | 'system.backup.manage'
  // Academic & School Governance (Principal Authority)
  | 'school.governance.view'
  | 'school.governance.manage'
  | 'school.analytics.view'
  // Admissions Workflow
  | 'admission.view'
  | 'admission.create'
  | 'admission.edit'
  | 'admission.review'
  | 'admission.approve'
  | 'admission.reject'
  | 'admission.convert'
  // Students & Guardians
  | 'student.view'
  | 'student.create'
  | 'student.edit'
  | 'student.delete'
  | 'student.self.view'
  | 'student.linked.view'
  // Teacher Assignments
  | 'teacher_assignment.view'
  | 'teacher_assignment.manage'
  // Attendance & Correction Workflow
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.submit'
  | 'attendance.correct.request'
  | 'attendance.correct.approve'
  | 'attendance.lock'
  | 'attendance.self.view'
  | 'attendance.linked.view'
  // Fee Structure Workflow (Admin Propose -> Principal Approve -> Active)
  | 'fee_structure.view'
  | 'fee_structure.create'
  | 'fee_structure.edit'
  | 'fee_structure.submit'
  | 'fee_structure.approve'
  | 'fee_structure.reject'
  | 'fee_structure.version'
  | 'fee_structure.use'
  // Fee Collection & Finance (Accountant Scope)
  | 'fee_collection.view'
  | 'fee_collection.collect'
  | 'fee_collection.refund'
  | 'fee_collection.reconcile'
  | 'fee_collection.reports'
  | 'fee.self.view'
  | 'fee.self.pay'
  | 'fee.linked.view'
  | 'fee.linked.pay'
  // Examinations & Marks Workflow
  | 'examination.view'
  | 'examination.manage'
  | 'marks.view'
  | 'marks.create'
  | 'marks.edit'
  | 'marks.submit'
  | 'marks.approve'
  | 'marks.reject'
  | 'marks.publish'
  | 'marks.lock'
  | 'marks.unlock'
  | 'result.self.view'
  | 'result.linked.view'
  // Certificates & Documents Workflow
  | 'certificate.view'
  | 'certificate.create'
  | 'certificate.edit'
  | 'certificate.submit'
  | 'certificate.approve'
  | 'certificate.reject'
  | 'certificate.issue'
  | 'certificate.lock'
  | 'certificate.revoke'
  | 'certificate.self.view'
  | 'certificate.linked.view'
  | 'document.verify'
  // Leave Workflow
  | 'leave.view'
  | 'leave.apply'
  | 'leave.approve.teacher'
  | 'leave.approve.student'
  | 'leave.self.apply'
  | 'leave.linked.apply'
  // Promotions
  | 'promotion.view'
  | 'promotion.manage'

/**
 * Granular Role Permission Assignments
 */
export const ROLE_PERMISSIONS: Record<RoleName, readonly Permission[]> = {
  'Super Admin': [
    // Full ERP Platform & System Authority
    'system.config.view',
    'system.config.edit',
    'system.users.manage',
    'system.roles.manage',
    'system.audit.view',
    'system.backup.manage',
    'school.governance.view',
    'school.analytics.view',
    'student.view',
    'admission.view',
    'fee_structure.view',
    'fee_collection.view',
    'fee_collection.reports',
    'examination.view',
    'marks.view',
    'certificate.view',
    'attendance.view',
    'leave.view',
    'promotion.view',
    'teacher_assignment.view',
  ],

  'Admin': [
    // System Admin / Vice Principal Hybrid Role
    'school.governance.view',
    'school.analytics.view',
    'student.view',
    'student.create',
    'student.edit',
    'admission.view',
    'admission.create',
    'admission.edit',
    'admission.review',
    'admission.convert',
    'teacher_assignment.view',
    'teacher_assignment.manage',
    'attendance.view',
    'attendance.mark',
    'attendance.submit',
    'attendance.correct.approve',
    'attendance.lock',
    'fee_structure.view',
    'fee_structure.create',
    'fee_structure.edit',
    'fee_structure.submit',
    'fee_structure.version',
    'fee_collection.view',
    'fee_collection.collect',
    'fee_collection.reports',
    'examination.view',
    'examination.manage',
    'marks.view',
    'certificate.view',
    'certificate.create',
    'certificate.edit',
    'certificate.submit',
    'leave.view',
    'leave.apply',
    'leave.approve.student',
    'promotion.view',
    'promotion.manage',
  ],

  'Principal': [
    // Highest School & Academic Authority
    'school.governance.view',
    'school.governance.manage',
    'school.analytics.view',
    'student.view',
    'admission.view',
    'admission.review',
    'admission.approve',
    'admission.reject',
    'admission.convert',
    'teacher_assignment.view',
    'attendance.view',
    'attendance.correct.approve',
    'attendance.lock',
    'fee_structure.view',
    'fee_structure.approve',
    'fee_structure.reject',
    'fee_collection.view',
    'fee_collection.reports',
    'examination.view',
    'marks.view',
    'marks.approve',
    'marks.reject',
    'marks.publish',
    'marks.lock',
    'marks.unlock',
    'certificate.view',
    'certificate.approve',
    'certificate.reject',
    'certificate.issue',
    'certificate.lock',
    'certificate.revoke',
    'leave.view',
    'leave.apply',
    'leave.approve.teacher',
    'leave.approve.student',
    'promotion.view',
    'promotion.manage',
  ],

  'Teacher': [
    // Class & Subject Scoped
    'attendance.mark',
    'attendance.submit',
    'attendance.correct.request',
    'marks.view',
    'marks.create',
    'marks.edit',
    'marks.submit',
    'leave.apply',
    'examination.view',
  ],

  'Accountant': [
    // Financial Scope
    'fee_structure.view',
    'fee_structure.use',
    'fee_collection.view',
    'fee_collection.collect',
    'fee_collection.refund',
    'fee_collection.reconcile',
    'fee_collection.reports',
    'student.view',
    'leave.apply',
  ],

  'Parent': [
    // Linked Children Scope
    'student.linked.view',
    'attendance.linked.view',
    'fee.linked.view',
    'fee.linked.pay',
    'result.linked.view',
    'certificate.linked.view',
    'leave.linked.apply',
  ],

  'Student': [
    // Self Scope
    'student.self.view',
    'attendance.self.view',
    'fee.self.view',
    'fee.self.pay',
    'result.self.view',
    'certificate.self.view',
    'leave.self.apply',
  ],
}

/**
 * Checks if a given role possesses a specific permission.
 */
export function roleHasPermission(role: RoleName, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions ? permissions.includes(permission) : false
}

/**
 * Checks if any of the user's assigned roles has the specified permission.
 */
export function userHasPermission(roles: string[], permission: Permission): boolean {
  return roles.some((role) => roleHasPermission(role as RoleName, permission))
}
