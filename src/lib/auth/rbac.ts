// ============================================================
// Central RBAC & Organizational Scope Evaluator
// Roshani Public School ERP
// ============================================================
import type { ResolvedUser, RoleName } from '@/types/auth'
import { userHasPermission, type Permission } from './permissions'
import { createClient } from '@/lib/supabase/server'

export type ActionContext = {
  user: ResolvedUser
  permission: Permission
  scope?: {
    type: 'school' | 'section' | 'subject' | 'student' | 'guardian' | 'self'
    classId?: string
    sectionId?: string
    subjectId?: string
    studentId?: string
    guardianId?: string
  }
}

export type AuthorizationDecision =
  | { authorized: true }
  | { authorized: false; reason: string }

/**
 * Validates whether the authenticated user is authorized to perform
 * the requested action within their organizational scope.
 */
export async function authorizeAction(
  context: ActionContext,
  supabaseClient?: any
): Promise<AuthorizationDecision> {
  const { user, permission, scope } = context

  // 1. Role & Permission verification
  if (!userHasPermission(user.roles, permission)) {
    return {
      authorized: false,
      reason: `Forbidden: Role(s) [${user.roles.join(', ')}] lack permission '${permission}'.`,
    }
  }

  // 2. Super Admin & Principal have school-wide scope
  if (user.roles.includes('Super Admin') || user.roles.includes('Principal')) {
    return { authorized: true }
  }

  // 3. Admin has operational school-wide scope for administrative actions
  if (user.roles.includes('Admin')) {
    return { authorized: true }
  }

  const getClient = async () => {
    if (supabaseClient) return supabaseClient
    try {
      return (await createClient()) as any
    } catch {
      return null
    }
  }

  // 4. Teacher Scope Verification
  if (user.roles.includes('Teacher') && scope) {
    if (scope.type === 'section' || scope.type === 'subject') {
      const supabase = await getClient()
      if (!supabase) {
        // Without database context in unit tests, reject unassigned scope by default
        return {
          authorized: false,
          reason: 'Access Denied: You are not assigned to this class, section, or subject.',
        }
      }

      let query = supabase
        .from('teacher_assignments')
        .select('id')
        .eq('school_id', user.schoolId)
        .eq('teacher_profile_id', user.profileId)
        .eq('active', true)

      if (scope.classId) query = query.eq('class_id', scope.classId)
      if (scope.sectionId) query = query.eq('section_id', scope.sectionId)
      if (scope.subjectId) {
        query = query.or(`subject_id.is.null,subject_id.eq.${scope.subjectId}`)
      }

      const { data, error } = await query
      if (error || !data || data.length === 0) {
        return {
          authorized: false,
          reason: 'Access Denied: You are not assigned to this class, section, or subject.',
        }
      }
    }
  }

  // 5. Parent Scope Verification (Linked Children Only)
  if (user.roles.includes('Parent') && scope?.studentId) {
    const supabase = await getClient()
    if (!supabase) {
      // In offline/mock test, check if requested student is linked
      return {
        authorized: false,
        reason: 'Access Denied: You do not have verified parental custody of this student record.',
      }
    }

    const { data: guardianRecord } = await supabase
      .from('guardians')
      .select('id')
      .eq('profile_id', user.profileId)
      .eq('school_id', user.schoolId)
      .single()

    if (!guardianRecord) {
      return {
        authorized: false,
        reason: 'Parent guardian record not found.',
      }
    }

    const { data: linkRecord } = await supabase
      .from('student_guardians')
      .select('id')
      .eq('school_id', user.schoolId)
      .eq('guardian_id', guardianRecord.id)
      .eq('student_id', scope.studentId)
      .single()

    if (!linkRecord) {
      return {
        authorized: false,
        reason: 'Access Denied: You do not have verified parental custody of this student record.',
      }
    }
  }

  // 6. Student Scope Verification (Self Only)
  if (user.roles.includes('Student') && scope?.studentId) {
    const supabase = await getClient()
    if (!supabase) {
      return {
        authorized: false,
        reason: 'Access Denied: Students may only access their own private records.',
      }
    }

    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', user.profileId)
      .eq('school_id', user.schoolId)
      .single()

    if (!studentRecord || studentRecord.id !== scope.studentId) {
      return {
        authorized: false,
        reason: 'Access Denied: Students may only access their own private records.',
      }
    }
  }

  return { authorized: true }
}
