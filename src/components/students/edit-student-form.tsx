'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStudent } from '@/lib/students/actions'
import { LockedField } from '@/components/ui/locked-field'
import { User, MapPin, Shield, Lock } from 'lucide-react'

interface StudentData {
  id: string
  admission_number: string
  first_name: string
  middle_name?: string | null
  last_name: string
  date_of_birth?: string | null
  gender?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  photo_url?: string | null
}

interface Props {
  student: StudentData
}

export function EditStudentForm({ student }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
      first_name: formData.get('first_name') as string,
      middle_name: formData.get('middle_name') as string,
      last_name: formData.get('last_name') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      gender: (formData.get('gender') as 'male' | 'female' | 'other') || undefined,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      photo_url: formData.get('photo_url') as string,
    }

    const res = await updateStudent(student.id, payload)
    setLoading(false)

    if (!res.success) {
      setError(res.error)
    } else {
      router.push(`/erp/admin/students/${student.id}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8 space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold">
          {error}
        </div>
      )}

      {/* System Immutable Fields (Lock Indicator) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Shield className="w-4 h-4 text-blue-600" />
          <span>System &amp; Security-Locked Attributes</span>
        </div>
        <p className="text-xs text-slate-500">
          The following core identifiers are system-generated and immutable to maintain institutional audit integrity.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
          <LockedField
            label="Admission Number"
            value={student.admission_number}
            reason="Official institutional admission record key"
          />
          <LockedField
            label="Internal Database UUID"
            value={student.id}
            reason="Primary database reference identifier"
          />
          <LockedField
            label="Security Profile"
            value="Encrypted Role Record"
            reason="Associated with user authentication credentials"
          />
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
            Personal &amp; Identity Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              defaultValue={student.first_name}
              required
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
            <input
              type="text"
              name="middle_name"
              defaultValue={student.middle_name || ''}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              defaultValue={student.last_name}
              required
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              defaultValue={student.date_of_birth || ''}
              max={new Date().toISOString().split('T')[0]}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
            <select
              name="gender"
              defaultValue={student.gender || ''}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              defaultValue={student.phone || ''}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={student.email || ''}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Photo URL</label>
            <input
              type="text"
              name="photo_url"
              defaultValue={student.photo_url || ''}
              placeholder="https://..."
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
            Residential Address
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              name="address"
              defaultValue={student.address || ''}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City / District</label>
            <input
              type="text"
              name="city"
              defaultValue={student.city || 'East Champaran'}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
            <input
              type="text"
              name="state"
              defaultValue={student.state || 'Bihar'}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Save Profile Changes
        </button>
      </div>
    </form>
  )
}
