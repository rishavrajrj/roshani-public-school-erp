'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, Calendar, Shield, Sparkles, User } from 'lucide-react'
import { NotificationBell } from './notification-bell'
import { LogoutButton } from '@/components/auth/logout-button'

interface ERPHeaderProps {
  userName: string
  roles: string[]
  activeRole: string
  notifications: any[]
  unreadCount: number
  onOpenMobileSidebar: () => void
}

export function ERPHeader({
  userName,
  roles,
  activeRole,
  notifications,
  unreadCount,
  onOpenMobileSidebar,
}: ERPHeaderProps) {
  const hasMultipleRoles = roles.length > 1

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-2xs">
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Academic Session */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Academic Session Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100/80 border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Academic Session: <strong className="text-slate-900">2024–2025</strong></span>
          </div>
        </div>

        {/* Right Side: Notifications, Role Switcher, User Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Notifications Bell */}
          <NotificationBell
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />

          {/* Multi-role Switcher */}
          {hasMultipleRoles && (
            <Link
              href="/erp/select-role"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Switch Role</span>
            </Link>
          )}

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                {userName}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                {activeRole}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800 font-bold text-xs shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="shrink-0">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
