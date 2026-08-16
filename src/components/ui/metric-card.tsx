import React from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'gold' | 'sky' | 'indigo' | 'cyan'
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
    glow: 'group-hover:bg-blue-600 group-hover:text-white',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    hover: 'hover:border-emerald-300',
    glow: 'group-hover:bg-emerald-600 group-hover:text-white',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    hover: 'hover:border-amber-300',
    glow: 'group-hover:bg-amber-600 group-hover:text-white',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-100',
    hover: 'hover:border-purple-300',
    glow: 'group-hover:bg-purple-600 group-hover:text-white',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-100',
    hover: 'hover:border-rose-300',
    glow: 'group-hover:bg-rose-600 group-hover:text-white',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    hover: 'hover:border-slate-300',
    glow: 'group-hover:bg-slate-800 group-hover:text-white',
  },
  gold: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    hover: 'hover:border-amber-400',
    glow: 'group-hover:bg-amber-600 group-hover:text-white',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    border: 'border-sky-100',
    hover: 'hover:border-sky-300',
    glow: 'group-hover:bg-sky-600 group-hover:text-white',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    hover: 'hover:border-indigo-300',
    glow: 'group-hover:bg-indigo-600 group-hover:text-white',
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-100',
    hover: 'hover:border-cyan-300',
    glow: 'group-hover:bg-cyan-600 group-hover:text-white',
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
      className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all duration-200 ${
        href ? `hover:shadow-md ${colors.hover} cursor-pointer group hover:-translate-y-0.5` : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">{title}</p>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
              {value}
            </span>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} shrink-0 transition-colors duration-200 ${colors.glow}`}>
          <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
          {subtitle && <span className="text-slate-500 font-medium truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-semibold shrink-0 ${
                trend.isPositive ? 'text-emerald-700' : 'text-rose-700'
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
    return <Link href={href} prefetch={true} className="block">{Content}</Link>
  }

  return Content
}
