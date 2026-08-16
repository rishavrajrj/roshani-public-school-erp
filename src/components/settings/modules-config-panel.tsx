'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FeatureKey, FeatureDefinition } from '@/types/features'
import { CORE_FEATURES, OPTIONAL_FEATURES, FEATURE_CATALOG } from '@/lib/features/catalog'
import { toggleSchoolFeature } from '@/lib/features/services'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  Power,
  Info,
  Building2,
  GraduationCap,
  Users,
  HeartHandshake,
  UserCheck,
  Shield,
  UserPlus,
  CalendarCheck,
  ClipboardList,
  FileCheck,
  FileText,
  CreditCard,
  Bus,
  Home,
  BookOpen,
  Package,
  DollarSign,
  Trophy,
  Flag,
  Sparkles,
  Send,
} from 'lucide-react'

interface ModulesConfigPanelProps {
  initialFeatures: Record<FeatureKey, boolean>
}

// Icon mapper helper
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  GraduationCap,
  Users,
  HeartHandshake,
  UserCheck,
  Shield,
  UserPlus,
  CalendarCheck,
  ClipboardList,
  FileCheck,
  FileText,
  CreditCard,
  Lock,
  Bus,
  Home,
  BookOpen,
  Package,
  DollarSign,
  Trophy,
  Flag,
  Sparkles,
  Send,
}

export function ModulesConfigPanel({ initialFeatures }: ModulesConfigPanelProps) {
  const router = useRouter()
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(initialFeatures)
  const [loadingKey, setLoadingKey] = useState<FeatureKey | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)

  const handleToggle = async (feature: FeatureDefinition) => {
    const currentState = !!features[feature.key]
    const nextState = !currentState

    setLoadingKey(feature.key)
    setFeedback(null)

    try {
      const res = await toggleSchoolFeature({
        featureKey: feature.key,
        enabled: nextState,
      })

      if (res.success) {
        setFeatures((prev) => ({ ...prev, [feature.key]: nextState }))
        setFeedback({
          type: 'success',
          text: res.message || `${feature.name} status updated.`,
        })
        router.refresh()
      } else {
        setFeedback({
          type: 'error',
          text: res.error || 'Failed to update module state.',
        })
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'An unexpected error occurred.',
      })
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Alert banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Info notice on non-destructive disablement */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <span className="font-bold">Zero Data-Loss Principle:</span> When an optional module is disabled,
          all previously recorded data (routes, hostel beds, book issues, payslips, assets) remains safely preserved in
          the database. Re-enabling the module instantly restores complete operational access without data loss.
        </div>
      </div>

      {/* SECTION 1: MANDATORY / CORE ERP MODULES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Core &amp; Mandatory School Modules
            </h2>
            <p className="text-xs text-slate-500">
              Essential foundational operational subsystems. Permanently locked active for institutional integrity.
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full uppercase tracking-wider">
            {CORE_FEATURES.length} Core Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CORE_FEATURES.map((item) => {
            const Icon = ICON_MAP[item.iconName || 'Building2'] || Building2
            return (
              <div
                key={item.key}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      MANDATORY
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Scope: School-wide</span>
                  <span className="font-semibold text-emerald-600">Active (System Core)</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: OPTIONAL SCHOOL MODULES */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Power className="w-5 h-5 text-indigo-600" />
              Configurable Optional Modules
            </h2>
            <p className="text-xs text-slate-500">
              Enable or disable specialized modules according to your school's specific campus facilities.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full uppercase tracking-wider">
            {OPTIONAL_FEATURES.filter((f) => features[f.key]).length} / {OPTIONAL_FEATURES.length} Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OPTIONAL_FEATURES.map((item) => {
            const isEnabled = !!features[item.key]
            const isLoading = loadingKey === item.key
            const Icon = ICON_MAP[item.iconName || 'Package'] || Package

            return (
              <div
                key={item.key}
                className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition ${
                  isEnabled
                    ? 'bg-white border-blue-200 ring-1 ring-blue-500/10'
                    : 'bg-slate-50/80 border-slate-200 opacity-90'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Switch Button */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggle(item)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                        isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                  </div>

                  {item.dependencies.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-600">Prerequisite:</span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                        {item.dependencies.map((d) => FEATURE_CATALOG[d]?.name || d).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {isEnabled ? 'Enabled for school' : 'Currently inactive'}
                  </span>
                  <span
                    className={`font-bold ${
                      isEnabled ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  >
                    {isEnabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
