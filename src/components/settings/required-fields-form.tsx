'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SchoolFieldConfig, EntityType } from '@/types/features'
import { saveSchoolFieldConfigs } from '@/lib/features/services'
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Save,
  Users,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react'

interface RequiredFieldsFormProps {
  initialStudentConfigs: SchoolFieldConfig[]
}

const DEFAULT_CONFIGURABLE_FIELDS = [
  {
    field_name: 'photo_url',
    default_label: 'Student Passport Photo',
    description: 'Mandatory uploaded portrait photo for student ID cards and admit cards',
  },
  {
    field_name: 'blood_group',
    default_label: 'Blood Group',
    description: 'Student medical blood group profile for health and emergency records',
  },
  {
    field_name: 'national_id',
    default_label: 'Aadhaar / National ID Number',
    description: 'Government 12-digit Aadhaar / National identification number',
  },
  {
    field_name: 'previous_school',
    default_label: 'Previous School / Transfer School',
    description: 'Previous educational institution name and transfer certificate reference',
  },
  {
    field_name: 'guardian_email',
    default_label: 'Guardian Email Address',
    description: 'Mandatory email address for digital fee receipts and progress reports',
  },
  {
    field_name: 'guardian_occupation',
    default_label: 'Guardian Occupation / Profession',
    description: 'Primary guardian profession or employer details',
  },
]

export function RequiredFieldsForm({ initialStudentConfigs }: RequiredFieldsFormProps) {
  const router = useRouter()

  // Initialize state with default fields mapped to initial configs
  const [configs, setConfigs] = useState(() => {
    return DEFAULT_CONFIGURABLE_FIELDS.map((item) => {
      const match = initialStudentConfigs.find((c) => c.field_name === item.field_name)
      return {
        field_name: item.field_name,
        label: match?.custom_label || item.default_label,
        description: item.description,
        is_required: match ? match.is_required : false,
        is_enabled: match ? match.is_enabled : true,
      }
    })
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleToggleRequired = (fieldName: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.field_name === fieldName ? { ...c, is_required: !c.is_required } : c))
    )
  }

  const handleToggleEnabled = (fieldName: string) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.field_name === fieldName
          ? {
              ...c,
              is_enabled: !c.is_enabled,
              is_required: !c.is_enabled ? c.is_required : false, // cannot be required if disabled
            }
          : c
      )
    )
  }

  const handleLabelChange = (fieldName: string, newLabel: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.field_name === fieldName ? { ...c, label: newLabel } : c))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const payload = configs.map((c) => ({
        field_name: c.field_name,
        is_required: c.is_required,
        is_enabled: c.is_enabled,
        custom_label: c.label,
      }))

      const res = await saveSchoolFieldConfigs('student', payload)
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Field validation rules saved successfully.' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to save rules.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Field Strategy Matrix Explainer */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">4-Tier Field Governance Model</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="font-bold text-slate-300 block mb-1">Tier 1: System Required</span>
            <span className="text-slate-400">ID, School UUID, Created Timestamps (Enforced in DB)</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="font-bold text-slate-300 block mb-1">Tier 2: Business Required</span>
            <span className="text-slate-400">First Name, Last Name, Class, Session, Status</span>
          </div>
          <div className="bg-cyan-950/80 p-3 rounded-xl border border-cyan-700/50">
            <span className="font-bold text-cyan-300 block mb-1">Tier 3: School Configurable</span>
            <span className="text-cyan-200">Photo, Blood Group, Aadhaar, Guardian Email</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="font-bold text-slate-300 block mb-1">Tier 4: Optional</span>
            <span className="text-slate-400">Middle Name, Alternate Phone, Remarks</span>
          </div>
        </div>
      </div>

      {/* Field Configuration Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Student &amp; Guardian Profile Fields</h2>
              <p className="text-xs text-slate-500">Configure which institutional fields are strictly required for your school</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {configs.map((field) => (
            <div
              key={field.field_name}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">{field.label}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {field.field_name}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{field.description}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Field Status toggle */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 font-medium">Field Active:</label>
                  <input
                    type="checkbox"
                    checked={field.is_enabled}
                    onChange={() => handleToggleEnabled(field.field_name)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>

                {/* Required switch */}
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">Requirement:</span>
                  <button
                    type="button"
                    disabled={!field.is_enabled}
                    onClick={() => handleToggleRequired(field.field_name)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                      !field.is_enabled
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : field.is_required
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {field.is_required ? 'MANDATORY (Required)' : 'OPTIONAL'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Rules...' : 'Save Field Requirements'}
        </button>
      </div>
    </form>
  )
}
