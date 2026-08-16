'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import {
  createLeaveApplicationSchema,
  processLeaveApprovalSchema,
  cancelLeaveSchema,
  type CreateLeaveApplicationInput,
  type ProcessLeaveApprovalInput,
  type CancelLeaveInput,
} from './schemas'
import { createNotificationAction } from '@/lib/notifications/actions'

export async function createLeaveApplicationAction(input: CreateLeaveApplicationInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const user = authState.user
    const parsed = createLeaveApplicationSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid leave application payload' }
    }

    const data = parsed.data
    const supabase = await createClient()

    // 1. Fetch active session if not provided
    let sessionId = data.academicSessionId
    if (!sessionId) {
      const { data: currentSession } = await (supabase as any)
        .from('academic_sessions')
        .select('id')
        .eq('school_id', user.schoolId)
        .order('is_current', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
      const sessionObj = Array.isArray(currentSession) ? currentSession[0] : currentSession
      sessionId = sessionObj?.id
    }

    if (!sessionId) {
      return { success: false, error: 'No active academic session found.' }
    }

    // 2. Server-side duration calculation
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    const dayDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1

    let calculatedDays = dayDiff
    if (data.durationType === 'half_day_morning' || data.durationType === 'half_day_afternoon') {
      calculatedDays = dayDiff * 0.5
    }

    // 3. Check applicant role and target student
    const isParent = hasAnyRole(user, ['Parent'])
    const isStudent = hasAnyRole(user, ['Student'])
    const isTeacher = hasAnyRole(user, ['Teacher'])
    const isAccountant = hasAnyRole(user, ['Accountant'])
    const isAdmin = hasAnyRole(user, ['Admin', 'Super Admin'])
    const isPrincipal = hasAnyRole(user, ['Principal'])

    let applicantRole: 'Student' | 'Parent' | 'Teacher' | 'Accountant' | 'Admin' | 'Principal' = 'Teacher'
    let targetStudentId = data.studentId || null

    if (isStudent) {
      applicantRole = 'Student'
      // Resolve student_id for student profile
      const { data: st } = await (supabase as any)
        .from('students')
        .select('id, status')
        .eq('school_id', user.schoolId)
        .eq('profile_id', user.profileId)
        .single()

      if (!st || st.status !== 'active') {
        return { success: false, error: 'Student account is not active or has exited.' }
      }
      targetStudentId = st.id
    } else if (isParent) {
      applicantRole = 'Parent'
      if (!targetStudentId) {
        return { success: false, error: 'Parent must select a linked child for leave application.' }
      }
      // Security check: guardian relationship
      const { data: sg } = await (supabase as any)
        .from('student_guardians')
        .select('id, students!student_id!inner(status)')
        .eq('school_id', user.schoolId)
        .eq('student_id', targetStudentId)
        .single()

      if (!sg) {
        return { success: false, error: 'You are not authorized for this student.' }
      }
      if ((sg as any).students?.status !== 'active') {
        return { success: false, error: 'Cannot apply leave for an exited or inactive student.' }
      }
    } else if (isPrincipal) {
      applicantRole = 'Principal'
    } else if (isAdmin) {
      applicantRole = 'Admin'
    } else if (isAccountant) {
      applicantRole = 'Accountant'
    } else {
      applicantRole = 'Teacher'
    }

    // 4. Check for overlapping approved/submitted leave
    let overlapQuery = (supabase as any)
      .from('leave_applications')
      .select('id')
      .eq('school_id', user.schoolId)
      .in('status', ['submitted', 'under_review', 'approved'])
      .lte('start_date', data.endDate)
      .gte('end_date', data.startDate)

    if (targetStudentId) {
      overlapQuery = overlapQuery.eq('student_id', targetStudentId)
    } else {
      overlapQuery = overlapQuery.eq('applicant_profile_id', user.profileId)
    }

    const { data: overlaps } = await overlapQuery
    if (overlaps && overlaps.length > 0) {
      return { success: false, error: 'An overlapping leave application already exists for this date range.' }
    }

    // 5. Create leave application
    const { data: newApp, error: appErr } = await (supabase as any)
      .from('leave_applications')
      .insert({
        school_id: user.schoolId,
        academic_session_id: sessionId,
        applicant_profile_id: user.profileId,
        applicant_role: applicantRole,
        student_id: targetStudentId,
        leave_type_id: data.leaveTypeId,
        start_date: data.startDate,
        end_date: data.endDate,
        duration_type: data.durationType,
        calculated_days: calculatedDays,
        reason: data.reason,
        status: 'submitted',
        document_path: data.documentPath || null,
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (appErr || !newApp) {
      return { success: false, error: appErr?.message || 'Failed to create leave application.' }
    }

    const applicationId = (newApp as any).id

    // 6. Build Approval Hierarchy Steps
    const approvalSteps: Array<{ stepOrder: number; approverProfileId: string; approverRole: 'Class Teacher' | 'Principal' | 'Admin' | 'Super Admin' }> = []

    if (applicantRole === 'Student' || applicantRole === 'Parent') {
      // Find Class Teacher for target student
      const { data: sah } = await (supabase as any)
        .from('student_academic_history')
        .select('class_id, section_id')
        .eq('school_id', user.schoolId)
        .eq('academic_session_id', sessionId)
        .eq('student_id', targetStudentId)
        .eq('status', 'active')
        .single()

      if (sah) {
        const { data: ta } = await (supabase as any)
          .from('teacher_assignments')
          .select('teacher_profile_id')
          .eq('school_id', user.schoolId)
          .eq('academic_session_id', sessionId)
          .eq('class_id', sah.class_id)
          .eq('section_id', sah.section_id)
          .eq('active', true)
          .maybeSingle()

        if (ta) {
          approvalSteps.push({
            stepOrder: 1,
            approverProfileId: ta.teacher_profile_id,
            approverRole: 'Class Teacher',
          })
        }
      }

      // If Long Leave (> 3 days) or no class teacher assigned, add Principal step
      if (calculatedDays > 3 || approvalSteps.length === 0) {
        // Find Principal/Admin profile ID
        const { data: princ } = await (supabase as any)
          .from('user_roles')
          .select('profile_id, roles(name)')
          .eq('school_id', user.schoolId)
          .in('roles.name', ['Principal', 'Admin', 'Super Admin'])
          .limit(1)
          .maybeSingle()

        if (princ) {
          approvalSteps.push({
            stepOrder: approvalSteps.length + 1,
            approverProfileId: princ.profile_id,
            approverRole: 'Principal',
          })
        }
      }
    } else {
      // Staff leave (Teacher, Accountant, Admin, Principal)
      // Approver is Principal or Super Admin
      const { data: principalUser } = await (supabase as any)
        .from('user_roles')
        .select('profile_id, roles(name)')
        .eq('school_id', user.schoolId)
        .in('roles.name', applicantRole === 'Principal' ? ['Super Admin'] : ['Principal', 'Admin', 'Super Admin'])
        .neq('profile_id', user.profileId) // No self approval!
        .limit(1)
        .maybeSingle()

      if (principalUser) {
        approvalSteps.push({
          stepOrder: 1,
          approverProfileId: principalUser.profile_id,
          approverRole: applicantRole === 'Principal' ? 'Super Admin' : 'Principal',
        })
      }
    }

    // Insert approval steps
    for (const step of approvalSteps) {
      await (supabase as any).from('leave_approvals').insert({
        school_id: user.schoolId,
        leave_application_id: applicationId,
        step_order: step.stepOrder,
        approver_profile_id: step.approverProfileId,
        approver_role: step.approverRole,
        status: 'pending',
      })
    }

    // 7. Audit log
    await (supabase as any).from('audit_logs').insert({
      school_id: user.schoolId,
      actor_profile_id: user.profileId,
      action: 'Leave application created',
      entity_type: 'leave_applications',
      entity_id: applicationId,
      new_data: {
        applicant_role: applicantRole,
        student_id: targetStudentId,
        start_date: data.startDate,
        end_date: data.endDate,
        calculated_days: calculatedDays,
      },
    })

    // 8. In-App Notification to first approver
    if (approvalSteps.length > 0) {
      await createNotificationAction({
        schoolId: user.schoolId,
        recipientProfileId: approvalSteps[0].approverProfileId,
        actorProfileId: user.profileId,
        eventType: 'leave.approval_required',
        title: 'New Leave Application Submitted',
        message: `Leave request for ${calculatedDays} day(s) from ${data.startDate} to ${data.endDate} requires your review.`,
        linkUrl: '/erp/teacher/leave/approvals',
      })
    }

    return { success: true, applicationId }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

export async function processLeaveApprovalAction(input: ProcessLeaveApprovalInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const user = authState.user
    const parsed = processLeaveApprovalSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
    }

    const { leaveApplicationId, approved, comments, rejectionReason } = parsed.data
    const supabase = await createClient()

    // Fetch leave application
    const { data: appData, error: appError } = await (supabase as any)
      .from('leave_applications')
      .select('id, school_id, academic_session_id, applicant_profile_id, student_id, start_date, end_date, calculated_days, status')
      .eq('id', leaveApplicationId)
      .eq('school_id', user.schoolId)
      .single()

    if (appError || !appData) {
      return { success: false, error: 'Leave application not found.' }
    }

    const appObj = appData as any

    // STRICT RULE: No applicant can approve their own leave
    if (appObj.applicant_profile_id === user.profileId) {
      return { success: false, error: 'Self-approval is strictly denied. You cannot approve your own leave.' }
    }

    // Fetch current pending approval step for this user
    const { data: stepData } = await (supabase as any)
      .from('leave_approvals')
      .select('id, step_order')
      .eq('leave_application_id', leaveApplicationId)
      .eq('approver_profile_id', user.profileId)
      .eq('status', 'pending')
      .maybeSingle()

    const stepObj = stepData as { id: string; step_order: number } | null
    const isAdminOrSuper = hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])

    if (!stepObj && !isAdminOrSuper) {
      return { success: false, error: 'You are not an authorized approver for this leave request.' }
    }

    if (!approved) {
      // Rejection Workflow
      if (!rejectionReason || rejectionReason.trim().length < 3) {
        return { success: false, error: 'A non-empty rejection reason is required.' }
      }

      if (stepObj) {
        await (supabase as any)
          .from('leave_approvals')
          .update({
            status: 'rejected',
            comments: rejectionReason.trim(),
            acted_at: new Date().toISOString(),
          })
          .eq('id', stepObj.id)
      }

      await (supabase as any)
        .from('leave_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leaveApplicationId)

      // Audit Log
      await (supabase as any).from('audit_logs').insert({
        school_id: user.schoolId,
        actor_profile_id: user.profileId,
        action: 'Leave application rejected',
        entity_type: 'leave_applications',
        entity_id: leaveApplicationId,
        new_data: { rejection_reason: rejectionReason.trim() },
      })

      // In-App Notification to Applicant
      await createNotificationAction({
        schoolId: user.schoolId,
        recipientProfileId: appObj.applicant_profile_id,
        actorProfileId: user.profileId,
        eventType: 'leave.rejected',
        title: 'Leave Application Rejected',
        message: `Your leave request for ${appObj.start_date} to ${appObj.end_date} was rejected: "${rejectionReason.trim()}".`,
        linkUrl: '/erp/student/leave',
      })

      return { success: true, status: 'rejected' }
    }

    // Approval Workflow
    if (stepObj) {
      await (supabase as any)
        .from('leave_approvals')
        .update({
          status: 'approved',
          comments: comments || null,
          acted_at: new Date().toISOString(),
        })
        .eq('id', stepObj.id)
    }

    // Check if remaining pending approval steps exist
    const { data: remainingSteps } = await (supabase as any)
      .from('leave_approvals')
      .select('id, step_order, approver_profile_id')
      .eq('leave_application_id', leaveApplicationId)
      .eq('status', 'pending')

    const hasNextStep = remainingSteps && remainingSteps.length > 0

    if (hasNextStep) {
      // Advance to under_review
      await (supabase as any)
        .from('leave_applications')
        .update({
          status: 'under_review',
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leaveApplicationId)

      // Notify next approver
      await createNotificationAction({
        schoolId: user.schoolId,
        recipientProfileId: remainingSteps[0].approver_profile_id,
        actorProfileId: user.profileId,
        eventType: 'leave.approval_required',
        title: 'Leave Approval Escalation Required',
        message: `Leave request for ${appObj.start_date} to ${appObj.end_date} has been recommended and requires final approval.`,
        linkUrl: '/erp/admin/leave/approvals',
      })

      return { success: true, status: 'under_review' }
    }

    // Final Approval
    await (supabase as any)
      .from('leave_applications')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveApplicationId)

    // ATTENDANCE INTEGRATION: If leave is for a student, update existing attendance records for date range to 'leave'
    if (appObj.student_id) {
      // Find active student class/section
      const { data: sah } = await (supabase as any)
        .from('student_academic_history')
        .select('class_id, section_id')
        .eq('school_id', user.schoolId)
        .eq('academic_session_id', appObj.academic_session_id)
        .eq('student_id', appObj.student_id)
        .eq('status', 'active')
        .single()

      if (sah) {
        // Fetch sessions in date range
        const { data: sessions } = await (supabase as any)
          .from('attendance_sessions')
          .select('id, attendance_date')
          .eq('school_id', user.schoolId)
          .eq('academic_session_id', appObj.academic_session_id)
          .eq('class_id', sah.class_id)
          .eq('section_id', sah.section_id)
          .gte('attendance_date', appObj.start_date)
          .lte('attendance_date', appObj.end_date)

        if (sessions && sessions.length > 0) {
          for (const s of (sessions as any[])) {
            await (supabase as any)
              .from('attendance_records')
              .upsert({
                school_id: user.schoolId,
                academic_session_id: appObj.academic_session_id,
                session_id: s.id,
                student_id: appObj.student_id,
                class_id: sah.class_id,
                section_id: sah.section_id,
                attendance_date: s.attendance_date,
                status: 'leave',
                remarks: 'Approved Leave Application',
                marked_by: user.profileId,
                marked_at: new Date().toISOString(),
                updated_by: user.profileId,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'school_id,academic_session_id,student_id,attendance_date',
              })
          }

          // Emit Attendance Updated notification
          await createNotificationAction({
            schoolId: user.schoolId,
            recipientProfileId: appObj.applicant_profile_id,
            actorProfileId: user.profileId,
            eventType: 'leave.attendance_updated',
            title: 'Attendance Status Updated to Leave',
            message: `Attendance register updated to Leave for dates ${appObj.start_date} to ${appObj.end_date}.`,
            linkUrl: '/erp/student/attendance',
          })
        }
      }
    }

    // Audit Log
    await (supabase as any).from('audit_logs').insert({
      school_id: user.schoolId,
      actor_profile_id: user.profileId,
      action: 'Leave application approved',
      entity_type: 'leave_applications',
      entity_id: leaveApplicationId,
      new_data: { approved_at: new Date().toISOString() },
    })

    // Notify Applicant
    await createNotificationAction({
      schoolId: user.schoolId,
      recipientProfileId: appObj.applicant_profile_id,
      actorProfileId: user.profileId,
      eventType: 'leave.approved',
      title: 'Leave Application Approved',
      message: `Your leave request for ${appObj.start_date} to ${appObj.end_date} has been approved!`,
      linkUrl: '/erp/student/leave',
    })

    return { success: true, status: 'approved' }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

export async function cancelLeaveAction(input: CancelLeaveInput) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const user = authState.user
    const parsed = cancelLeaveSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
    }

    const { leaveApplicationId, reason } = parsed.data
    const supabase = await createClient()

    const { data: appData, error: appErr } = await (supabase as any)
      .from('leave_applications')
      .select('id, school_id, applicant_profile_id, status, start_date, end_date')
      .eq('id', leaveApplicationId)
      .eq('school_id', user.schoolId)
      .single()

    if (appErr || !appData) {
      return { success: false, error: 'Leave application not found.' }
    }

    const appObj = appData as any
    const isApplicant = appObj.applicant_profile_id === user.profileId
    const isAdminOrSuper = hasAnyRole(user, ['Super Admin', 'Admin', 'Principal'])

    if (!isApplicant && !isAdminOrSuper) {
      return { success: false, error: 'You do not have permission to cancel this leave application.' }
    }

    await (supabase as any)
      .from('leave_applications')
      .update({
        status: 'cancelled',
        cancellation_reason: reason.trim(),
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveApplicationId)

    // Audit log
    await (supabase as any).from('audit_logs').insert({
      school_id: user.schoolId,
      actor_profile_id: user.profileId,
      action: 'Leave application cancelled',
      entity_type: 'leave_applications',
      entity_id: leaveApplicationId,
      new_data: { cancellation_reason: reason.trim() },
    })

    // Notify Applicant
    await createNotificationAction({
      schoolId: user.schoolId,
      recipientProfileId: appObj.applicant_profile_id,
      actorProfileId: user.profileId,
      eventType: 'leave.cancelled',
      title: 'Leave Application Cancelled',
      message: `Leave application for ${appObj.start_date} to ${appObj.end_date} was cancelled: "${reason.trim()}".`,
      linkUrl: '/erp/student/leave',
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}
