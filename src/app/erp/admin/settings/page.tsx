import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { resolveUser, hasAnyRole } from '@/lib/auth/resolve-user'
import { ROUTE_ALLOWED_ROLES } from '@/lib/auth/constants'
import { getSchoolProfile } from '@/lib/schools/actions'
import { getSchoolFeatures } from '@/lib/features/services'
import { CORE_FEATURES, OPTIONAL_FEATURES } from '@/lib/features/catalog'
import {
  Building2,
  Sliders,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
} from 'lucide-react'

export default async function SettingsOverviewPage() {
  const authState = await resolveUser()
  if (authState.state !== 'authenticated') {
    redirect('/login')
  }

  const profileRes = await getSchoolProfile()
  const featuresRes = await getSchoolFeatures()

  const school = profileRes.data
  const activeFeatures = featuresRes.features
  const activeOptionalCount = OPTIONAL_FEATURES.filter((f) => activeFeatures[f.key]).length

  return (
    <div className="space-y-6">
      {/* School Status Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                TENANT IDENTITY
              </span>
              <span className="text-xs text-slate-300 font-mono font-bold bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700">
                CODE: {school?.code ? (school.code.startsWith('SCH-') ? school.code : `SCH-${school.code}`) : 'SCH-10022702717'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {school?.name || 'Roshani Public School'}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              {school?.motto || 'Knowledge • Discipline • Character'}
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700 space-y-2 shrink-0">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Official UDISE Registration
            </div>
            <div className="text-xl font-mono font-bold text-cyan-300 flex items-center gap-2">
              {school?.udise_code || school?.code || '10022702717'}
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-[11px] text-slate-400">
              Affiliation: <span className="text-slate-200 font-semibold">{school?.affiliation || 'CBSE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: School Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 transition group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">School Profile &amp; Branding</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                Configure school name, official 11-digit UDISE code, affiliation number, address, contacts, and logos.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              Status: <strong className="text-emerald-800 capitalize font-bold">{school?.status || 'Active'}</strong>
            </span>
            <Link
              href="/erp/admin/settings/school"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Edit Profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Modules & Features */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 transition group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Modules &amp; Feature Registry</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                Activate or deactivate optional subsystems (Transport, Hostel, Library, Inventory, Payroll, Activities).
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              Optional: <strong className="text-blue-700 font-bold">{activeOptionalCount} Active</strong>
            </span>
            <Link
              href="/erp/admin/settings/modules"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Configure <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Required Fields */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 transition group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Configurable Field Rules</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                Define institutional field requirements for student admissions, photos, blood groups, and parent records.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium font-mono">Tier-3 Governance</span>
            <Link
              href="/erp/admin/settings/required-fields"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Manage Rules <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
