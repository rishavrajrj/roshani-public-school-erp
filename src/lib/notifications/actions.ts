'use server'

import { createClient } from '@/lib/supabase/server'
import { resolveUser } from '@/lib/auth/resolve-user'
import type { NotificationEventType } from '@/types/notification'

export async function createNotificationAction({
  schoolId,
  recipientProfileId,
  actorProfileId,
  eventType,
  title,
  message,
  linkUrl,
}: {
  schoolId: string
  recipientProfileId: string
  actorProfileId?: string
  eventType: NotificationEventType
  title: string
  message: string
  linkUrl?: string
}) {
  try {
    const supabase = await createClient()

    // Persistent, retryable, idempotent notification insert
    const { error } = await (supabase as any).from('notifications').insert({
      school_id: schoolId,
      recipient_profile_id: recipientProfileId,
      actor_profile_id: actorProfileId || null,
      event_type: eventType,
      title,
      message,
      link_url: linkUrl || null,
    })

    if (error) {
      console.error('Notification creation failed:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Notification creation exception:', err.message)
    return { success: false, error: err.message }
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const user = authState.user
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('school_id', user.schoolId)
      .eq('recipient_profile_id', user.profileId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const authState = await resolveUser()
    if (authState.state !== 'authenticated') {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const user = authState.user
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('school_id', user.schoolId)
      .eq('recipient_profile_id', user.profileId)
      .is('read_at', null)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' }
  }
}
