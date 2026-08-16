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
  | 'leave'
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
  | 'superseded'
  | 'revoked'
  | 'eligible'
  | 'financial_hold'
  | 'override_released'
  | string

interface StatusBadgeProps {
  status: StatusType
  label?: string
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  className?: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  // Positive / Active / Paid / Approved / Present / Eligible / Verified / Promoted
  active: { bg: 'bg-emerald-50/90', text: 'text-emerald-800', border: 'border-emerald-300/90', dot: 'bg-emerald-600' },
  approved: { bg: 'bg-emerald-50/90', text: 'text-emerald-800', border: 'border-emerald-300/90', dot: 'bg-emerald-600' },
  present: { bg: 'bg-emerald-50/90', text: 'text-emerald-800', border: 'border-emerald-300/90', dot: 'bg-emerald-600' },
  paid: { bg: 'bg-emerald-50/90', text: 'text-emerald-800', border: 'border-emerald-300/90', dot: 'bg-emerald-600' },
  published: { bg: 'bg-emerald-50/90', text: 'text-emerald-800', border: 'border-emerald-300/90', dot: 'bg-emerald-600' },
  passed: { bg: 'bg-emerald-50/90', text: 'text-emerald-800', border: 'border-emerald-300/90', dot: 'bg-emerald-600' },
  promoted: { bg: 'bg-emerald-50/90', text: 'text-emerald-800', border: 'border-emerald-300/90', dot: 'bg-emerald-600' },
  verified: { bg: 'bg-emerald-50/90', text: 'text-emerald-800', border: 'border-emerald-300/90', dot: 'bg-emerald-600' },
  eligible: { bg: 'bg-emerald-50/90', text: 'text-emerald-800', border: 'border-emerald-300/90', dot: 'bg-emerald-600' },
  override_released: { bg: 'bg-teal-50/90', text: 'text-teal-800', border: 'border-teal-300/90', dot: 'bg-teal-600' },

  // Warning / Pending / Under Review / Late / Partial / Retained / Financial Hold
  pending: { bg: 'bg-amber-50/90', text: 'text-amber-900', border: 'border-amber-300/90', dot: 'bg-amber-600' },
  under_review: { bg: 'bg-amber-50/90', text: 'text-amber-900', border: 'border-amber-300/90', dot: 'bg-amber-600' },
  late: { bg: 'bg-amber-50/90', text: 'text-amber-900', border: 'border-amber-300/90', dot: 'bg-amber-600' },
  half_day: { bg: 'bg-amber-50/90', text: 'text-amber-900', border: 'border-amber-300/90', dot: 'bg-amber-600' },
  partial: { bg: 'bg-amber-50/90', text: 'text-amber-900', border: 'border-amber-300/90', dot: 'bg-amber-600' },
  retained: { bg: 'bg-amber-50/90', text: 'text-amber-900', border: 'border-amber-300/90', dot: 'bg-amber-600' },
  financial_hold: { bg: 'bg-amber-50/90', text: 'text-amber-900', border: 'border-amber-300/90', dot: 'bg-amber-600' },
  superseded: { bg: 'bg-amber-50/90', text: 'text-amber-900', border: 'border-amber-300/90', dot: 'bg-amber-600' },

  // Danger / Absent / Rejected / Overdue / Revoked / Invalid / Unpaid / Withdrawn
  absent: { bg: 'bg-rose-50/90', text: 'text-rose-800', border: 'border-rose-300/90', dot: 'bg-rose-600' },
  rejected: { bg: 'bg-rose-50/90', text: 'text-rose-800', border: 'border-rose-300/90', dot: 'bg-rose-600' },
  overdue: { bg: 'bg-rose-50/90', text: 'text-rose-800', border: 'border-rose-300/90', dot: 'bg-rose-600' },
  cancelled: { bg: 'bg-rose-50/90', text: 'text-rose-800', border: 'border-rose-300/90', dot: 'bg-rose-600' },
  revoked: { bg: 'bg-rose-50/90', text: 'text-rose-800', border: 'border-rose-300/90', dot: 'bg-rose-600' },
  invalid: { bg: 'bg-rose-50/90', text: 'text-rose-800', border: 'border-rose-300/90', dot: 'bg-rose-600' },
  unpaid: { bg: 'bg-rose-50/90', text: 'text-rose-800', border: 'border-rose-300/90', dot: 'bg-rose-600' },
  withdrawn: { bg: 'bg-rose-50/90', text: 'text-rose-800', border: 'border-rose-300/90', dot: 'bg-rose-600' },

  // Informational / Blue / Converted / Alumni / Leave / Transferred
  submitted: { bg: 'bg-blue-50/90', text: 'text-blue-800', border: 'border-blue-300/90', dot: 'bg-blue-600' },
  converted: { bg: 'bg-indigo-50/90', text: 'text-indigo-800', border: 'border-indigo-300/90', dot: 'bg-indigo-600' },
  alumni: { bg: 'bg-blue-50/90', text: 'text-blue-800', border: 'border-blue-300/90', dot: 'bg-blue-600' },
  transferred: { bg: 'bg-purple-50/90', text: 'text-purple-800', border: 'border-purple-300/90', dot: 'bg-purple-600' },
  excused: { bg: 'bg-sky-50/90', text: 'text-sky-800', border: 'border-sky-300/90', dot: 'bg-sky-600' },
  leave: { bg: 'bg-sky-50/90', text: 'text-sky-800', border: 'border-sky-300/90', dot: 'bg-sky-600' },

  // Neutral / Draft / Inactive
  draft: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', dot: 'bg-slate-500' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' },
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
    text: 'text-slate-800',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  }

  const displayLabel = label || String(status || '').replace(/_/g, ' ').toUpperCase()

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10.5px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3.5 py-1 text-sm gap-2',
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border shadow-2xs ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]} ${className}`}
    >
      {dot && <span className={`rounded-full shrink-0 ${style.dot} ${dotSizes[size]}`} />}
      <span className="tracking-wide font-bold">{displayLabel}</span>
    </span>
  )
}
