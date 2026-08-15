'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, Calendar, Shield } from 'lucide-react'
import { NotificationBell } from './notification-bell'
import { LogoutButton } from '@/components/auth/logout-button'
import { ROLE_BRANDING_MAP } from './erp-nav-config'

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
  const brand = ROLE_BRANDING_MAP[activeRole] || ROLE_BRANDING_MAP['Admin']

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-2xs">
      <div className="h-17 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Academic Session */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Academic Session Pill */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100/90 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Academic Session:</span>
            <strong className="text-slate-900 font-bold">2024–2025</strong>
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
              prefetch={true}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Switch Role</span>
            </Link>
          )}

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                {userName}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {brand.portalLabel}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
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

