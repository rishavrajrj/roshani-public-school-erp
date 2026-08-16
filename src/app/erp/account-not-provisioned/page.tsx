import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { UserX, Mail, HelpCircle } from 'lucide-react'
import { SchoolLogo } from '@/components/ui/school-logo'

export default function AccountNotProvisionedPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <SchoolLogo className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight">Roshani Public School</h1>
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Account Provisioning</p>
          </div>
        </div>
      </div>

      {/* Center Card */}
      <div className="max-w-md mx-auto w-full my-auto z-10">
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-5 shadow-inner">
            <UserX className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Pending Staff / Student Setup
          </span>

          <h2 className="text-2xl font-black text-white mt-3 mb-2">Account Not Provisioned</h2>
          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed mb-6">
            Your login identity has been verified, but your user profile has not yet been assigned an active ERP role (Teacher, Student, Parent, Administrator).
          </p>

          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 text-left mb-6 text-xs text-slate-200 space-y-2 font-medium">
            <div className="flex items-center gap-2 font-bold text-white">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Next Steps:</span>
            </div>
            <p className="text-slate-200">
              Please contact your school IT administrator or academic office to associate your email with your official school records.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <LogoutButton
              variant="outline"
              className="w-full justify-center bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600 hover:border-slate-500 font-semibold py-2.5 rounded-xl transition"
            >
              Sign out &amp; switch account
            </LogoutButton>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 z-10">
        Roshani Public School ERP &bull; Account Provisioning Services
      </div>
    </div>
  )
}
