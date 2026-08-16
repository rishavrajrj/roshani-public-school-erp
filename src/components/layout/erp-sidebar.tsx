'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ROLE_SECTION_NAV_CONFIG,
  getRoleBranding,
  type NavItem,
  type NavSection,
} from './erp-nav-config'
import { SchoolLogo } from '@/components/ui/school-logo'
import {
  ChevronLeft,
  ChevronRight,
  X,
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
  const prevPathnameRef = useRef(pathname)

  // Get role branding and sections
  const brand = getRoleBranding(userRole)
  const navSections: NavSection[] =
    ROLE_SECTION_NAV_CONFIG[brand.role] ||
    ROLE_SECTION_NAV_CONFIG[userRole] ||
    ROLE_SECTION_NAV_CONFIG['Admin'] ||
    []


  function isActive(item: NavItem) {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname === item.href || pathname.startsWith(item.href + '/')
  }

  // Close mobile drawer ONLY when route actually changes
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      onCloseMobile()
    }
  }, [pathname, onCloseMobile])

  // Manage body scroll lock & keyboard escape dismiss for mobile drawer
  useEffect(() => {
    if (!isMobileOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseMobile()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileOpen, onCloseMobile])

  const handleLinkClick = () => {
    if (isMobileOpen) {
      onCloseMobile()
    }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="erp-main-sidebar"
        aria-label="Main Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#031B3A] text-slate-100 flex flex-col border-r border-[#0F2440] transition-all duration-300 ease-in-out select-none shadow-2xl lg:shadow-none w-[280px] ${
          isCollapsed ? 'lg:w-20' : 'lg:w-[270px]'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-17 flex items-center border-b border-[#0F2440] shrink-0 transition-all duration-300 px-4 justify-between ${
            isCollapsed ? 'lg:px-2 lg:justify-center' : 'lg:px-4'
          }`}
        >
          <Link
            href="/erp"
            onClick={handleLinkClick}
            className={`flex items-center gap-3 overflow-hidden group ${
              isCollapsed ? 'lg:justify-center' : 'min-w-0'
            }`}
          >
            <div
              className={`rounded-xl bg-white flex items-center justify-center shadow-md ring-1 ring-white/20 group-hover:scale-105 transition-transform shrink-0 w-11 h-11 p-1 ${
                isCollapsed ? 'lg:w-10 lg:h-10' : ''
              }`}
            >
              <SchoolLogo
                className={`w-9 h-9 ${isCollapsed ? 'lg:w-8 lg:h-8' : ''}`}
                priority
              />
            </div>
            <div className={`flex flex-col min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
              <span className="font-extrabold text-[13.5px] text-white group-hover:text-slate-100 tracking-tight leading-tight truncate transition-colors">
                Roshani Public School
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[8.5px] font-black tracking-wider uppercase font-mono leading-none border ${brand.pillClass}`}>
                  {brand.badge}
                </span>
                <span className="text-[10.5px] font-medium text-slate-300 tracking-tight truncate">
                  Portal
                </span>
              </div>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0F2440] transition cursor-pointer"
            title="Close Sidebar"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-controls="erp-main-sidebar"
            className={`hidden ${
              isCollapsed ? 'lg:hidden' : 'lg:flex'
            } p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0F2440] transition shrink-0 ml-1 cursor-pointer`}
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed expand button below header (Desktop Only) */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center pt-2.5 pb-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!isCollapsed}
              aria-controls="erp-main-sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0F2440] transition cursor-pointer"
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
              {section.sectionTitle && (
                <div className={`px-3 pt-2.5 pb-1 ${isCollapsed ? 'lg:hidden' : ''}`}>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 font-mono">
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
                    onClick={handleLinkClick}
                    title={isCollapsed ? item.name : undefined}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 relative ${
                      active
                        ? 'bg-[#1554C0] text-white font-bold shadow-xs shadow-blue-950/40 ring-1 ring-blue-400/30'
                        : 'text-slate-200 hover:bg-[#0F2440] hover:text-white font-medium'
                    } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                  >
                    {/* Vertical accent indicator on left */}
                    {active && (
                      <span className={`absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-r-full ${brand.indicatorClass} ${isCollapsed ? 'lg:hidden' : ''}`} />
                    )}

                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                        active ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}
                    />
                    <span className={`truncate flex-1 tracking-tight ${isCollapsed ? 'lg:hidden' : ''}`}>
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className={`text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-mono shadow-2xs ${isCollapsed ? 'lg:hidden' : ''}`}>
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
        <div className="p-3 border-t border-[#0F2440] shrink-0 bg-[#021329]/90">
          <div className={`flex items-center gap-3 px-2 py-1 ${isCollapsed ? 'lg:hidden' : ''}`}>
            <div className="w-8.5 h-8.5 rounded-full bg-[#0F2440] border border-slate-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {userName}
              </p>
              <p className="text-[11px] text-slate-300 truncate font-mono">
                ID: {schoolId || 'N/A'}
              </p>
            </div>
          </div>
          {isCollapsed && (
            <div className="hidden lg:flex justify-center">
              <div
                className="w-8.5 h-8.5 rounded-full bg-[#0F2440] border border-slate-600 flex items-center justify-center text-white font-bold text-xs shadow-xs"
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

