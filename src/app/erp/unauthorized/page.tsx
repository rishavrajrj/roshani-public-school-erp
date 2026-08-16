'use client'

import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { SchoolLogo } from '@/components/ui/school-logo'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <SchoolLogo className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight">Roshani Public School</h1>
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Access Control</p>
          </div>
        </div>
      </div>

      {/* Center Card */}
      <div className="max-w-md mx-auto w-full my-auto z-10">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-5 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            HTTP 403 Forbidden
          </span>

          <h2 className="text-2xl font-black text-white mt-3 mb-2">Access Denied</h2>
          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed mb-8">
            You do not possess the required security permissions or assigned role to view this portal.
            If you believe this is in error, please contact the School Administrator.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/erp"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Authorized Workspace
            </Link>
            <div className="w-full flex justify-center pt-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 z-10">
        Roshani Public School ERP &bull; Security &amp; Audit Subsystem
      </div>
    </div>
  )
}
