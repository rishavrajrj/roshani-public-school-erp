import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { FolderSearch } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs transition"
            >
              {actionLabel}
            </Link>
          )}
          {onAction && actionLabel && !actionHref && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs transition"
            >
              {actionLabel}
            </button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm rounded-lg transition"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
