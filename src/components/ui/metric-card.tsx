import React from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'gold'
  trend?: {
    value: string
    isPositive?: boolean
    label?: string
  }
  href?: string
  badge?: string
  className?: string
}

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    hover: 'hover:border-blue-300',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    hover: 'hover:border-emerald-300',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    hover: 'hover:border-amber-300',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-100',
    hover: 'hover:border-purple-300',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-100',
    hover: 'hover:border-rose-300',
  },
  slate: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-100',
    hover: 'hover:border-slate-300',
  },
  gold: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    hover: 'hover:border-amber-400',
  },
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  trend,
  href,
  badge,
  className = '',
}: MetricCardProps) {
  const colors = COLOR_MAP[iconColor] || COLOR_MAP.blue

  const Content = (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all duration-200 ${
        href ? `hover:shadow-md ${colors.hover} cursor-pointer group` : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trend.value} {trend.label && <span className="text-slate-400 ml-1 font-normal">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{Content}</Link>
  }

  return Content
}
