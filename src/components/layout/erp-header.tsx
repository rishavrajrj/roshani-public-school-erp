'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, Calendar, Shield } from 'lucide-react'
import { NotificationBell } from './notification-bell'
import { LogoutButton } from '@/components/auth/logout-button'
import { SchoolLogo } from '@/components/ui/school-logo'
import { getRoleBranding } from '@/lib/auth/portal-mapping'

interface ERPHeaderProps {
  userName: string
  roles: string[]
  activeRole: string
  notifications: any[]
  unreadCount: number
  isMobileOpen?: boolean
  onOpenMobileSidebar: () => void
}

export function ERPHeader({
  userName,
  roles,
  activeRole,
  notifications,
  unreadCount,
  isMobileOpen = false,
  onOpenMobileSidebar,
}: ERPHeaderProps) {
  const hasMultipleRoles = roles.length > 1
  const brand = getRoleBranding(activeRole)

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="h-17 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Academic Session / Mobile Branding */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-expanded={isMobileOpen}
            aria-controls="erp-main-sidebar"
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile School Brand & Dynamic Role Portal */}
          <div className="flex sm:hidden items-center gap-2 min-w-0">
            <SchoolLogo className="w-7 h-7 shrink-0" priority />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-[12px] text-slate-900 leading-tight truncate">
                Roshani Public School
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-black tracking-wider uppercase font-mono leading-none border ${brand.pillClass}`}>
                  {brand.badge}
                </span>
                <span className="text-[10px] font-semibold text-slate-700 truncate">
                  Portal
                </span>
              </div>
            </div>
          </div>

          {/* Academic Session Pill (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/95 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-800 select-none shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#1554C0] shrink-0" />
            <span className="font-medium text-slate-600">Academic Session:</span>
            <strong className="text-slate-900 font-bold font-mono">2024–2025</strong>
          </div>
        </div>

        {/* Right Side: Notifications, Role Switcher, User Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
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
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 hover:bg-blue-50 hover:text-[#1554C0] text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-[#1554C0]" />
              <span>Switch Role</span>
            </Link>
          )}

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[13px] font-bold text-slate-900 truncate max-w-[170px]">
                {userName}
              </span>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-black tracking-wider uppercase font-mono leading-none border ${brand.pillClass}`}>
                  {brand.badge}
                </span>
                <span className="text-[10.5px] font-semibold text-slate-600">
                  Portal
                </span>
              </div>
            </div>

            <div className="w-8.5 h-8.5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 font-bold text-xs shrink-0 shadow-2xs">
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
