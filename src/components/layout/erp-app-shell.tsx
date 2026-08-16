'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ERPSidebar } from './erp-sidebar'
import { ERPHeader } from './erp-header'
import { MultiTabAuthSync } from '@/components/auth/multi-tab-auth-sync'

interface ERPAppShellProps {
  userRole: string
  allRoles: string[]
  userName: string
  displayId?: string
  schoolId: string
  notifications: any[]
  unreadCount: number
  children: React.ReactNode
}

export function ERPAppShell({
  userRole,
  allRoles,
  userName,
  displayId,
  schoolId,
  notifications,
  unreadCount,
  children,
}: ERPAppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Load sidebar preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rps_erp_sidebar_collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('rps_erp_sidebar_collapsed', String(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }, [])

  const handleOpenMobile = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const handleCloseMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Real-Time Multi-Tab Session Synchronization */}
      <MultiTabAuthSync />

      {/* Sidebar */}
      <ERPSidebar
        userRole={userRole}
        allRoles={allRoles}
        userName={userName}
        displayId={displayId}
        schoolId={schoolId}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
      />

      {/* Main Layout Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-[270px]'
        }`}
      >
        {/* Sticky Header */}
        <ERPHeader
          userName={userName}
          roles={allRoles}
          activeRole={userRole}
          notifications={notifications}
          unreadCount={unreadCount}
          isMobileOpen={isMobileOpen}
          onOpenMobileSidebar={handleOpenMobile}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

