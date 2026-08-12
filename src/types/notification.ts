export type NotificationEventType =
  | 'leave.submitted'
  | 'leave.under_review'
  | 'leave.approved'
  | 'leave.rejected'
  | 'leave.withdrawn'
  | 'leave.cancelled'
  | 'leave.approval_required'
  | 'leave.attendance_updated'

export interface AppNotification {
  id: string
  schoolId: string
  recipientProfileId: string
  actorProfileId?: string | null
  eventType: NotificationEventType
  title: string
  message: string
  linkUrl?: string | null
  readAt?: string | null
  createdAt: string
  actorName?: string
}
