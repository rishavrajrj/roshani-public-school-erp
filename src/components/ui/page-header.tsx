import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  eyebrow?: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  badge?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  eyebrow,
  description,
  breadcrumbs,
  actions,
  badge,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`mb-6 md:mb-8 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2.5">
          <ol className="flex items-center space-x-1.5 text-xs text-slate-600 flex-wrap">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              return (
                <li key={idx} className="flex items-center space-x-1.5">
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      prefetch={true}
                      className="hover:text-[#1554C0] font-semibold text-slate-600 hover:underline transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-slate-900 font-bold truncate' : 'text-slate-600 font-medium'}>
                      {crumb.label}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      {/* Eyebrow Module Label if provided */}
      {eyebrow && (
        <div className="mb-1.5">
          <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-[#1554C0] bg-blue-50/90 px-2.5 py-0.5 rounded-md border border-blue-200/80 font-mono shadow-2xs">
            {eyebrow}
          </span>
        </div>
      )}

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed font-medium">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
