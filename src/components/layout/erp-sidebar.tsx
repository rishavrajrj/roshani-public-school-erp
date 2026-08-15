'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROLE_NAV_CONFIG, type NavItem } from './erp-nav-config'
import { SchoolLogo } from '@/components/ui/school-logo'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  Layers,
  GraduationCap,
} from 'lucide-react'

interface ERPSidebarProps {
  userRole: string
  allRoles: string[]
  userName: string
  schoolId: string
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export function ERPSidebar({
  userRole,
  allRoles,
  userName,
  schoolId,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: ERPSidebarProps) {
  const pathname = usePathname()

  // Determine which nav items to display based on userRole
  // If user has 'Super Admin', map to 'Admin' if not explicitly defined
  const navItems: NavItem[] =
    ROLE_NAV_CONFIG[userRole] ||
    ROLE_NAV_CONFIG['Admin'] ||
    []

  function isActive(item: NavItem) {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  // Close mobile drawer when route changes
  useEffect(() => {
    onCloseMobile()
  }, [pathname])

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-18 flex items-center border-b border-slate-800/80 shrink-0 transition-all duration-300 ${
            isCollapsed
              ? 'px-2 justify-center'
              : 'px-3.5 justify-between'
          }`}
        >
          <Link
            href="/erp"
            className={`flex items-center gap-3 overflow-hidden group ${
              isCollapsed ? 'justify-center' : 'min-w-0'
            }`}
          >
            <div
              className={`rounded-xl bg-white flex items-center justify-center shadow-md ring-1 ring-white/15 group-hover:scale-105 transition-transform shrink-0 ${
                isCollapsed ? 'w-10 h-10 p-1' : 'w-11 h-11 p-1'
              }`}
            >
              <SchoolLogo
                className={isCollapsed ? 'w-8 h-8' : 'w-9 h-9'}
                priority
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-[13.5px] text-slate-100 group-hover:text-white tracking-tight leading-tight truncate transition-colors">
                  Roshani Public School
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase font-mono leading-none">
                    ERP
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 tracking-tight">
                    Portal
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-1"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed expand button below header */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center pt-2 pb-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Role Badge Indicator */}
        {!isCollapsed && (
          <div className="px-4 pt-3 pb-1">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Current Portal
                  </p>
                  <p className="text-xs font-bold text-amber-300 truncate">
                    {userRole}
                  </p>
                </div>
              </div>
              {allRoles.length > 1 && (
                <Link
                  href="/erp/select-role"
                  className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 hover:underline shrink-0"
                >
                  Switch
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar overscroll-contain">
          {navItems.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                title={isCollapsed ? item.name : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 relative ${
                  active
                    ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1">{item.name}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {/* Active left indicator bar */}
                {active && !isCollapsed && (
                  <span className="absolute right-0 w-1 h-5 bg-amber-400 rounded-l-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Info Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  ID: {schoolId || 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold text-xs"
                title={`${userName} (${userRole})`}
              >
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
