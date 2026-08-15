'use client'

import React, { useState, useEffect } from 'react'
import { ERPSidebar } from './erp-sidebar'
import { ERPHeader } from './erp-header'

interface ERPAppShellProps {
  userRole: string
  allRoles: string[]
  userName: string
  schoolId: string
  notifications: any[]
  unreadCount: number
  children: React.ReactNode
}

export function ERPAppShell({
  userRole,
  allRoles,
  userName,
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

  function toggleCollapse() {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('rps_erp_sidebar_collapsed', String(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <ERPSidebar
        userRole={userRole}
        allRoles={allRoles}
        userName={userName}
        schoolId={schoolId}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Layout Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Header */}
        <ERPHeader
          userName={userName}
          roles={allRoles}
          activeRole={userRole}
          notifications={notifications}
          unreadCount={unreadCount}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
