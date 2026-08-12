export type DurationType = 'full_day' | 'half_day_morning' | 'half_day_afternoon'

export type LeaveStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'cancelled'

export type ApproverRole = 'Class Teacher' | 'Principal' | 'Admin' | 'Super Admin'

export interface LeaveType {
  id: string
  schoolId: string
  code: string
  name: string
  applicantCategory: 'student' | 'staff' | 'all'
  defaultDaysPerYear: number
  requiresDocument: boolean
  active: boolean
}

export interface LeaveApplicationItem {
  id: string
  schoolId: string
  academicSessionId: string
  applicantProfileId: string
  applicantName: string
  applicantRole: string
  studentId?: string | null
  studentName?: string | null
  leaveTypeId: string
  leaveTypeName: string
  startDate: string
  endDate: string
  durationType: DurationType
  calculatedDays: number
  reason: string
  status: LeaveStatus
  documentPath?: string | null
  submittedAt: string
  reviewedAt?: string | null
  approvedAt?: string | null
  cancelledAt?: string | null
  rejectionReason?: string | null
  cancellationReason?: string | null
  approvals?: LeaveApprovalItem[]
}

export interface LeaveApprovalItem {
  id: string
  schoolId: string
  leaveApplicationId: string
  stepOrder: number
  approverProfileId: string
  approverRole: ApproverRole
  approverName?: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string | null
  actedAt?: string | null
}

export interface StaffLeaveBalance {
  leaveTypeId: string
  leaveTypeName: string
  entitlementDays: number
  usedDays: number
  remainingDays: number
}

export interface CreateLeaveApplicationPayload {
  academicSessionId?: string
  studentId?: string
  leaveTypeId: string
  startDate: string
  endDate: string
  durationType: DurationType
  reason: string
  documentPath?: string
}

export interface ProcessLeaveApprovalPayload {
  leaveApplicationId: string
  approved: boolean
  comments?: string
  rejectionReason?: string
}

export interface ActionLeavePayload {
  leaveApplicationId: string
  reason: string
}
