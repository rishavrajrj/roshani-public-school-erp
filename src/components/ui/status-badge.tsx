import React from 'react'

export type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'withdrawn'
  | 'converted'
  | 'present'
  | 'absent'
  | 'late'
  | 'half_day'
  | 'excused'
  | 'paid'
  | 'unpaid'
  | 'partial'
  | 'overdue'
  | 'cancelled'
  | 'published'
  | 'passed'
  | 'promoted'
  | 'retained'
  | 'verified'
  | 'invalid'
  | 'alumni'
  | 'transferred'
  | string

interface StatusBadgeProps {
  status: StatusType
  label?: string
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  className?: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  // Positive / Active / Paid / Approved / Present
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  present: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  passed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  promoted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },

  // Warning / Pending / Under Review / Late / Partial
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  under_review: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  late: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  half_day: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  partial: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  retained: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },

  // Danger / Absent / Rejected / Overdue / Invalid
  absent: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  overdue: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  invalid: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  unpaid: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  withdrawn: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },

  // Informational / Blue / Converted / Alumni
  submitted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  converted: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  alumni: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  transferred: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  excused: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },

  // Neutral / Draft / Inactive
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  dot = true,
  className = '',
}: StatusBadgeProps) {
  const normalizedKey = status ? String(status).toLowerCase().trim().replace(/[\s-]+/g, '_') : 'draft'
  const style = STATUS_STYLES[normalizedKey] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  }

  const displayLabel = label || String(status || '').replace(/_/g, ' ').toUpperCase()

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-sm gap-2',
  }

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]} ${className}`}
    >
      {dot && <span className={`rounded-full shrink-0 ${style.dot} ${dotSizes[size]}`} />}
      <span className="tracking-wide">{displayLabel}</span>
    </span>
  )
}
