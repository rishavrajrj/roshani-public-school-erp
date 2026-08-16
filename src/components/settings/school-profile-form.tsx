'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SchoolProfile, UpdateSchoolProfileInput, SchoolType, ManagementType, AffiliationBoard } from '@/types/school'
import { updateSchoolProfile } from '@/lib/schools/actions'
import {
  Building2,
  FileCheck2,
  MapPin,
  Phone,
  Globe,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'

interface SchoolProfileFormProps {
  initialProfile: SchoolProfile
}

export function SchoolProfileForm({ initialProfile }: SchoolProfileFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<UpdateSchoolProfileInput>({
    name: initialProfile.name || '',
    udise_code: initialProfile.udise_code || '',
    short_name: initialProfile.short_name || '',
    school_type: (initialProfile.school_type as SchoolType) || 'co-ed',
    management_type: (initialProfile.management_type as ManagementType) || 'private',
    affiliation: (initialProfile.affiliation as AffiliationBoard) || 'CBSE',
    affiliation_number: initialProfile.affiliation_number || '',
    recognition_number: initialProfile.recognition_number || '',
    registration_number: initialProfile.registration_number || '',
    address: initialProfile.address || '',
    village_town_city: initialProfile.village_town_city || '',
    city: initialProfile.city || '',
    district: initialProfile.district || '',
    state: initialProfile.state || '',
    pin_code: initialProfile.pin_code || '',
    country: initialProfile.country || 'India',
    phone: initialProfile.phone || '',
    alternate_phone: initialProfile.alternate_phone || '',
    email: initialProfile.email || '',
    website: initialProfile.website || '',
    logo_url: initialProfile.logo_url || '',
    seal_url: initialProfile.seal_url || '',
    campus_image_url: initialProfile.campus_image_url || '',
    motto: initialProfile.motto || '',
    mission: initialProfile.mission || '',
    vision: initialProfile.vision || '',
    established_year: initialProfile.established_year || 2001,
    status: initialProfile.status || 'active',
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'established_year' ? (value ? parseInt(value, 10) : null) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await updateSchoolProfile(formData)
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'School profile updated successfully.' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update school profile.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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

      {/* Section 1: Official Identity & UDISE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Official Institutional Identity</h2>
            <p className="text-xs text-slate-500">Legal registration and government educational identifiers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              School Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Roshani Public School"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Short Name / Acronym
            </label>
            <input
              type="text"
              name="short_name"
              value={formData.short_name || ''}
              onChange={handleChange}
              placeholder="e.g. RPS"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Official UDISE Code (11 Digits)
            </label>
            <input
              type="text"
              name="udise_code"
              maxLength={11}
              value={formData.udise_code || ''}
              onChange={handleChange}
              placeholder="e.g. 10022702717"
              className="w-full px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">Unique 11-digit school code issued by MoE</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              School Internal Code
            </label>
            <input
              type="text"
              disabled
              value={initialProfile.code}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Established Year
            </label>
            <input
              type="number"
              name="established_year"
              min={1800}
              max={2100}
              value={formData.established_year || ''}
              onChange={handleChange}
              placeholder="e.g. 2010"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              School Type
            </label>
            <select
              name="school_type"
              value={formData.school_type}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value="co-ed">Co-Educational</option>
              <option value="boys">Boys Only</option>
              <option value="girls">Girls Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Management Type
            </label>
            <select
              name="management_type"
              value={formData.management_type}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value="private">Private Unaided</option>
              <option value="government_aided">Government Aided</option>
              <option value="trust">Educational Trust</option>
              <option value="society">Registered Society</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Operating Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value="active">Active Operational</option>
              <option value="onboarding">Onboarding / Setup</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Board Affiliation & Accreditation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Affiliation &amp; Accreditation</h2>
            <p className="text-xs text-slate-500">Board recognition numbers and government certifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Affiliation Board
            </label>
            <select
              name="affiliation"
              value={formData.affiliation}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value="CBSE">CBSE (Central Board)</option>
              <option value="ICSE">ICSE / CISCE</option>
              <option value="State Board">State Board</option>
              <option value="IB">International Baccalaureate (IB)</option>
              <option value="Cambridge">Cambridge (CAIE)</option>
              <option value="Other">Other Authority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Affiliation Number
            </label>
            <input
              type="text"
              name="affiliation_number"
              value={formData.affiliation_number || ''}
              onChange={handleChange}
              placeholder="e.g. CBSE/AFF/2026/001"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Recognition Number
            </label>
            <input
              type="text"
              name="recognition_number"
              value={formData.recognition_number || ''}
              onChange={handleChange}
              placeholder="e.g. REC-84920"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Society Reg. Number
            </label>
            <input
              type="text"
              name="registration_number"
              value={formData.registration_number || ''}
              onChange={handleChange}
              placeholder="e.g. SOC-2010-99"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Official Address & Geographic Location */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Campus Location &amp; Address</h2>
            <p className="text-xs text-slate-500">Official mailing and geographical jurisdiction address</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Address Line / Campus Premises
            </label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              placeholder="e.g. Main Campus, Station Road, Knowledge Park"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Village / Town / City Area
            </label>
            <input
              type="text"
              name="village_town_city"
              value={formData.village_town_city || ''}
              onChange={handleChange}
              placeholder="e.g. East Patna"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              District
            </label>
            <input
              type="text"
              name="district"
              value={formData.district || ''}
              onChange={handleChange}
              placeholder="e.g. Patna"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state || ''}
              onChange={handleChange}
              placeholder="e.g. Bihar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              PIN / Postal Code
            </label>
            <input
              type="text"
              name="pin_code"
              value={formData.pin_code || ''}
              onChange={handleChange}
              placeholder="e.g. 800001"
              className="w-full px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Contact & Digital Communication */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Contact &amp; Web Presence</h2>
            <p className="text-xs text-slate-500">Official contact numbers, portal email, and institution website</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Official Primary Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Alternate Phone / Helpline
            </label>
            <input
              type="text"
              name="alternate_phone"
              value={formData.alternate_phone || ''}
              onChange={handleChange}
              placeholder="e.g. +91 0612 223344"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Official Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="e.g. info@roshanischool.edu.in"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Official Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              placeholder="e.g. https://roshanischool.edu.in"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Institutional Vision & Motto */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Institutional Philosophy &amp; Motto</h2>
            <p className="text-xs text-slate-500">Motto, mission, and vision statements for official documents</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              School Motto
            </label>
            <input
              type="text"
              name="motto"
              value={formData.motto || ''}
              onChange={handleChange}
              placeholder="e.g. Excellence in Education, Character in Life"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mission Statement
              </label>
              <textarea
                name="mission"
                rows={3}
                value={formData.mission || ''}
                onChange={handleChange}
                placeholder="To nurture curious minds and compassionate citizens through holistic learning..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Vision Statement
              </label>
              <textarea
                name="vision"
                rows={3}
                value={formData.vision || ''}
                onChange={handleChange}
                placeholder="To be a center of excellence shaping future leaders with integrity and innovation..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Changes...' : 'Save School Profile'}
        </button>
      </div>
    </form>
  )
}
