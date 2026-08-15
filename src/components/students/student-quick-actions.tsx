import React from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  CreditCard,
  Award,
  FileCheck,
  FileText,
  CalendarOff,
  type LucideIcon,
} from 'lucide-react'

interface QuickActionItem {
  name: string
  href: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  hoverBg: string
  hoverBorder: string
  hoverText: string
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    name: 'Attendance',
    href: '/erp/student/attendance',
    icon: CalendarCheck,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hoverBg: 'hover:bg-blue-50/50',
    hoverBorder: 'hover:border-blue-300',
    hoverText: 'group-hover:text-blue-700',
  },
  {
    name: 'Fee Ledger',
    href: '/erp/student/fees',
    icon: CreditCard,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    hoverBg: 'hover:bg-emerald-50/50',
    hoverBorder: 'hover:border-emerald-300',
    hoverText: 'group-hover:text-emerald-700',
  },
  {
    name: 'Admit Card',
    href: '/erp/student/admit-cards',
    icon: Award,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    hoverBg: 'hover:bg-amber-50/50',
    hoverBorder: 'hover:border-amber-300',
    hoverText: 'group-hover:text-amber-700',
  },
  {
    name: 'My Results',
    href: '/erp/student/results',
    icon: FileCheck,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    hoverBg: 'hover:bg-purple-50/50',
    hoverBorder: 'hover:border-purple-300',
    hoverText: 'group-hover:text-purple-700',
  },
  {
    name: 'Certificates',
    href: '/erp/student/documents',
    icon: FileText,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    hoverBg: 'hover:bg-rose-50/50',
    hoverBorder: 'hover:border-rose-300',
    hoverText: 'group-hover:text-rose-700',
  },
  {
    name: 'Apply Leave',
    href: '/erp/student/leave',
    icon: CalendarOff,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    hoverBg: 'hover:bg-indigo-50/50',
    hoverBorder: 'hover:border-indigo-300',
    hoverText: 'group-hover:text-indigo-700',
  },
]

export function StudentQuickActions() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Academic Shortcuts &amp; Services
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/90 ${action.hoverBg} ${action.hoverBorder} transition-all duration-150 group shadow-2xs text-center cursor-pointer`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center ${action.iconColor} mb-2.5 group-hover:scale-105 transition-transform shrink-0`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-bold text-slate-800 ${action.hoverText} transition-colors line-clamp-1`}
              >
                {action.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
