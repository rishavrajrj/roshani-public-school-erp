'use client'

import { useState } from 'react'
import type { AppNotification } from '@/types/notification'
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from '@/lib/notifications/actions'
import { Bell, CheckCheck, BookOpen, Award, CreditCard, CalendarCheck, Info } from 'lucide-react'

interface NotificationBellProps {
  initialNotifications: AppNotification[]
  initialUnreadCount: number
}

function getCategoryBadge(eventType: string = '', title: string = '') {
  const combined = (eventType + ' ' + title).toLowerCase()
  if (combined.includes('exam') || combined.includes('admit')) {
    return { label: 'Exam', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Award }
  }
  if (combined.includes('fee') || combined.includes('payment') || combined.includes('dues')) {
    return { label: 'Fees', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CreditCard }
  }
  if (combined.includes('attendance')) {
    return { label: 'Attendance', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CalendarCheck }
  }
  if (combined.includes('result') || combined.includes('grade') || combined.includes('academic')) {
    return { label: 'Academic', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: BookOpen }
  }
  return { label: 'General', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Info }
}

export function NotificationBell({ initialNotifications, initialUnreadCount }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    await markNotificationAsReadAction(id)
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    )
    setUnreadCount(0)
    await markAllNotificationsAsReadAction()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  School Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar-light">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No new notifications.
                </div>
              ) : (
                notifications.map((n) => {
                  const badge = getCategoryBadge(n.eventType, n.title)
                  const isUnread = !n.readAt
                  const BadgeIcon = badge.icon
                  return (
                    <div
                      key={n.id}
                      onClick={() => isUnread && handleMarkRead(n.id)}
                      className={`p-3.5 text-xs transition cursor-pointer ${
                        isUnread ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge.color}`}>
                            <BadgeIcon className="w-2.5 h-2.5" />
                            {badge.label}
                          </span>
                          <p className="font-bold text-slate-900 truncate">{n.title}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                          {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

