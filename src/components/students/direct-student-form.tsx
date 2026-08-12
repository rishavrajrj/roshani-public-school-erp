'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDirectStudent } from '@/lib/students/actions'
import { getSectionsByClass } from '@/lib/academic/actions'

interface AcademicSessionOption {
  id: string
  name: string
  is_current: boolean
}

interface ClassOption {
  id: string
  name: string
}

interface SectionOption {
  id: string
  name: string
}

interface Props {
  sessions: AcademicSessionOption[]
  classes: ClassOption[]
}

export function DirectStudentForm({ sessions, classes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '')
  const [sections, setSections] = useState<SectionOption[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [selectedSection, setSelectedSection] = useState('')

  const defaultSession = sessions.find((s) => s.is_current)?.id || sessions[0]?.id || ''

  useEffect(() => {
    let isMounted = true
    if (selectedClass) {
      getSectionsByClass(selectedClass).then((res) => {
        if (isMounted) {
          setSectionsLoading(false)
          if (res.success && res.data && res.data.length > 0) {
            const list = res.data as SectionOption[]
            setSections(list)
            setSelectedSection(list[0].id)
          } else {
            setSections([])
            setSelectedSection('')
          }
        }
      })
    }
    return () => {
      isMounted = false
    }
  }, [selectedClass])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
      admission_number: formData.get('admission_number') as string,
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

      academic_session_id: formData.get('academic_session_id') as string,
      class_id: selectedClass,
      section_id: selectedSection,
      roll_number: formData.get('roll_number') as string,

      guardian_name: formData.get('guardian_name') as string,
      guardian_phone: formData.get('guardian_phone') as string,
      guardian_relationship: formData.get('guardian_relationship') as string,
      guardian_email: formData.get('guardian_email') as string,
    }

    const res = await createDirectStudent(payload)
    setLoading(false)

    if (!res.success) {
      setError(res.error)
    } else {
      router.push(`/erp/admin/students/${res.data.studentId}`)
      router.refresh()
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleSubmit(e)
      }}
      action="javascript:void(0)"
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6"
    >
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Student Personal Info */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 mb-4">
          Student Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              required
              placeholder="e.g. Arjun"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
            <input
              type="text"
              name="middle_name"
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
              name="last_name"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Admission # (Optional)
            </label>
            <input
              type="text"
              name="admission_number"
              placeholder="Leave empty for auto-gen"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Academic Assignment */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 mb-4">
          Academic Assignment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Class <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setSectionsLoading(true)
              }}
              required
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Section <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              required
              disabled={sectionsLoading || sections.length === 0}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  Section {sec.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number</label>
            <input
              type="text"
              name="roll_number"
              placeholder="e.g. 05"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Guardian Details */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 mb-4">
          Primary Guardian Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Guardian Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="guardian_name"
              required
              placeholder="e.g. Rajesh Sharma"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relationship <span className="text-rose-500">*</span>
            </label>
            <select
              name="guardian_relationship"
              required
              defaultValue="father"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number <span className="text-rose-500">*</span>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              name="guardian_email"
              placeholder="guardian@example.com"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 mb-4">
          Contact Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              name="address"
              placeholder="Village / Street details"
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
          disabled={loading || !selectedSection}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition disabled:opacity-50"
        >
          {loading ? 'Enrolling...' : 'Enroll Student'}
        </button>
      </div>
    </form>
  )
}
