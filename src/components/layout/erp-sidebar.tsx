'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ROLE_SECTION_NAV_CONFIG,
  ROLE_BRANDING_MAP,
  type NavItem,
  type NavSection,
} from './erp-nav-config'
import { SchoolLogo } from '@/components/ui/school-logo'
import {
  ChevronLeft,
  ChevronRight,
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
  allRoles: _allRoles,
  userName,
  schoolId,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: ERPSidebarProps) {
  const pathname = usePathname()

  // Get role branding and sections
  const brand = ROLE_BRANDING_MAP[userRole] || ROLE_BRANDING_MAP['Admin']
  const navSections: NavSection[] =
    ROLE_SECTION_NAV_CONFIG[userRole] ||
    ROLE_SECTION_NAV_CONFIG['Admin'] ||
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
  }, [pathname, onCloseMobile])

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-[270px]'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-18 flex items-center border-b border-slate-800/80 shrink-0 transition-all duration-300 ${
            isCollapsed
              ? 'px-2 justify-center'
              : 'px-4 justify-between'
          }`}
        >
          <Link
            href="/erp"
            className={`flex items-center gap-3 overflow-hidden group ${
              isCollapsed ? 'justify-center' : 'min-w-0'
            }`}
          >
            <div
              className={`rounded-xl bg-white flex items-center justify-center shadow-md ring-1 ring-white/20 group-hover:scale-105 transition-transform shrink-0 ${
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
                <span className="font-bold text-[14px] text-white group-hover:text-slate-100 tracking-tight leading-tight truncate transition-colors">
                  Roshani Public School
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase font-mono leading-none border ${brand.pillClass}`}>
                    {brand.badge}
                  </span>
                  <span className="text-[11px] font-medium text-slate-300 tracking-tight">
                    {brand.portalLabel}
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
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-1 cursor-pointer"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed expand button below header */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center pt-2.5 pb-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Sections List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar overscroll-contain">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && section.sectionTitle && (
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {section.sectionTitle}
                  </span>
                </div>
              )}

              {section.items.map((item) => {
                const active = isActive(item)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    title={isCollapsed ? item.name : undefined}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative ${
                      active
                        ? `${brand.activeNavClass}`
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    {/* Small vertical accent indicator on left */}
                    {active && !isCollapsed && (
                      <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full ${brand.indicatorClass}`} />
                    )}

                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1 font-medium">{item.name}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User Info Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/60">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">
                  ID: {schoolId || 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs"
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

