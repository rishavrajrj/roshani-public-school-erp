import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { resolveUser } from '@/lib/auth/resolve-user'
import type { AppNotification } from '@/types/notification'

export const getUserNotifications = cache(async function getUserNotifications() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') return { notifications: [], unreadCount: 0 }

  const user = authState.user
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('notifications')
    .select(`
      id,
      school_id,
      recipient_profile_id,
      actor_profile_id,
      event_type,
      title,
      message,
      link_url,
      read_at,
      created_at,
      profiles!notifications_actor_profile_id_fkey(full_name)
    `)
    .eq('school_id', user.schoolId)
    .eq('recipient_profile_id', user.profileId)
    .order('created_at', { ascending: false })
    .limit(25)

  if (error || !data) return { notifications: [], unreadCount: 0 }

  const notifications = (data as any[]).map((item: any) => ({
    id: item.id,
    schoolId: item.school_id,
    recipientProfileId: item.recipient_profile_id,
    actorProfileId: item.actor_profile_id,
    eventType: item.event_type,
    title: item.title,
    message: item.message,
    linkUrl: item.link_url,
    readAt: item.read_at,
    createdAt: item.created_at,
    actorName: item.profiles?.full_name || 'System',
  })) as AppNotification[]

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return { notifications, unreadCount }
})
