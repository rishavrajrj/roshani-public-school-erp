import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resolveUser } from '@/lib/auth/resolve-user'
import { ROLE_ROUTES, ROLE_PRIORITY } from '@/lib/auth/constants'
import type { RoleName } from '@/types/auth'
import { SchoolLogo } from '@/components/ui/school-logo'
import { LogoutButton } from '@/components/auth/logout-button'
import {
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  Users,
  CreditCard,
  User,
  HeartHandshake,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

const ROLE_METADATA: Record<
  string,
  {
    icon: typeof ShieldCheck
    description: string
    color: string
    bg: string
    badge: string
  }
> = {
  'Super Admin': {
    icon: ShieldAlert,
    description: 'Full institutional configuration, admissions, security, and enterprise audit logs.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200 group-hover:border-indigo-400',
    badge: 'System Admin',
  },
  Admin: {
    icon: ShieldCheck,
    description: 'School operations, student enrollment, fee structures, examinations, and staff management.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200 group-hover:border-blue-400',
    badge: 'Administration',
  },
  Principal: {
    icon: GraduationCap,
    description: 'Executive academic overview, institutional performance, approvals, and report card finalization.',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200 group-hover:border-purple-400',
    badge: 'Executive',
  },
  Teacher: {
    icon: Users,
    description: 'Daily classroom tools, speed attendance marking, subject marks entry, and leave requests.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200 group-hover:border-emerald-400',
    badge: 'Academic Staff',
  },
  Accountant: {
    icon: CreditCard,
    description: 'Finance counter, student fee ledger, instant receipts, and daily cash reconciliation.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200 group-hover:border-amber-400',
    badge: 'Accounts Office',
  },
  Student: {
    icon: User,
    description: 'Student portal, live attendance, exam admit cards, result reports, and document issuance.',
    color: 'text-sky-600',
    bg: 'bg-sky-50 border-sky-200 group-hover:border-sky-400',
    badge: 'Student Portal',
  },
  Parent: {
    icon: HeartHandshake,
    description: 'Family portal, multi-child switcher, fee dues & online payment, and academic progress.',
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200 group-hover:border-rose-400',
    badge: 'Parent Portal',
  },
}

export default async function SelectRolePage() {
  const authState = await resolveUser()

  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const sortedRoles = [...authState.user.roles].sort((a, b) => {
    const priorityA = ROLE_PRIORITY[a as RoleName] ?? 99
    const priorityB = ROLE_PRIORITY[b as RoleName] ?? 99
    return priorityA - priorityB
  })

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Subtle Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <SchoolLogo className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base sm:text-lg tracking-tight">
              Roshani Public School
            </h1>
            <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              Management ERP
            </p>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-1 border border-slate-700">
          <LogoutButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto w-full my-auto py-10 z-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-400/20 text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Authenticated User: {authState.user.fullName}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Select Your Portal
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mt-2">
            You have access to multiple operational roles. Choose the workspace you wish to launch.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {sortedRoles.map((role) => {
            const meta = ROLE_METADATA[role] || {
              icon: ShieldCheck,
              description: `Access the ${role} dashboard and workspace.`,
              color: 'text-blue-600',
              bg: 'bg-blue-50 border-blue-200 group-hover:border-blue-400',
              badge: 'ERP Role',
            }
            const Icon = meta.icon

            return (
              <Link
                key={role}
                href={ROLE_ROUTES[role as RoleName] || '/erp'}
                className="group bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-2xl hover:scale-[1.01] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center ${meta.color} group-hover:scale-110 transition shrink-0`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/60">
                      {meta.badge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                    {role}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
                    {meta.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 z-10">
        Roshani Public School ERP &bull; Secured with Role-Based Access Control
      </div>
    </div>
  )
}
