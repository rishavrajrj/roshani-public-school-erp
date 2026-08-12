'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdmissionApplication } from '@/lib/admissions/actions'

interface AcademicSessionOption {
  id: string
  name: string
  is_current: boolean
}

interface ClassOption {
  id: string
  name: string
}

interface Props {
  sessions: AcademicSessionOption[]
  classes: ClassOption[]
}

export function AdmissionApplicationForm({ sessions, classes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultSession = sessions.find((s) => s.is_current)?.id || sessions[0]?.id || ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
      academic_session_id: formData.get('academic_session_id') as string,
      applying_for_class_id: formData.get('applying_for_class_id') as string,
      applicant_first_name: formData.get('applicant_first_name') as string,
      applicant_middle_name: formData.get('applicant_middle_name') as string,
      applicant_last_name: formData.get('applicant_last_name') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      gender: (formData.get('gender') as 'male' | 'female' | 'other') || undefined,
      guardian_name: formData.get('guardian_name') as string,
      guardian_phone: formData.get('guardian_phone') as string,
      guardian_email: formData.get('guardian_email') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      source: formData.get('source') as string,
      notes: formData.get('notes') as string,
      status: (formData.get('status') as 'draft' | 'submitted') || 'draft',
    }

    const res = await createAdmissionApplication(payload)
    setLoading(false)

    if (!res.success) {
      setError(res.error)
    } else {
      router.push(`/erp/admin/admissions/${res.data.id}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Academic & Application Target */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 mb-4">
          Academic Assignment Target
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Session <span className="text-rose-500">*</span>
            </label>
            <select
              name="academic_session_id"
              defaultValue={defaultSession}
              required
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select Session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? '(Current Session)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Applying for Class <span className="text-rose-500">*</span>
            </label>
            <select
              name="applying_for_class_id"
              required
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applicant Basic Info */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 mb-4">
          Applicant Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="applicant_first_name"
              required
              placeholder="e.g. Rahul"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
            <input
              type="text"
              name="applicant_middle_name"
              placeholder="e.g. Kumar"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="applicant_last_name"
              required
              placeholder="e.g. Sharma"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              max={new Date().toISOString().split('T')[0]}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
            <select
              name="gender"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guardian Info */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 mb-4">
          Guardian Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Guardian Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="guardian_name"
              required
              placeholder="e.g. Ramesh Sharma"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Guardian Phone <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              name="guardian_phone"
              required
              placeholder="+91 9876543210"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Email</label>
            <input
              type="email"
              name="guardian_email"
              placeholder="guardian@example.com"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Address & Source */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 mb-4">
          Address & Additional Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              name="address"
              placeholder="Village / Town / Street details"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City / District</label>
            <input
              type="text"
              name="city"
              defaultValue="East Champaran"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
            <input
              type="text"
              name="state"
              defaultValue="Bihar"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
            <select
              name="source"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Direct Walk-in">Direct Walk-in</option>
              <option value="Referral">Referral</option>
              <option value="Website">Website</option>
              <option value="Advertisement">Advertisement</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Additional comments or observations..."
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
            <select
              name="status"
              defaultValue="submitted"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="submitted">Submitted (Ready for Review)</option>
              <option value="draft">Draft (Save temporary)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="pt-4 border-t flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Application'}
        </button>
      </div>
    </form>
  )
}
