import React from 'react'
import { Lock } from 'lucide-react'

interface LockedFieldProps {
  label: string
  value: string | number | null | undefined
  reason?: string
  badgeText?: string
  className?: string
}

export function LockedField({
  label,
  value,
  reason = 'System managed or restricted field',
  badgeText = 'Locked',
  className = '',
}: LockedFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-600">{label}</label>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          <Lock className="w-2.5 h-2.5" />
          {badgeText}
        </span>
      </div>
      <div className="relative">
        <input
          type="text"
          readOnly
          disabled
          value={value ?? '—'}
          title={reason}
          className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed select-all"
        />
      </div>
      {reason && <p className="text-[10px] text-slate-400 italic">{reason}</p>}
    </div>
  )
}
