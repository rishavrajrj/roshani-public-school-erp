'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateAdmissionStatus, convertAdmissionToStudent } from '@/lib/admissions/actions'
import { getSectionsByClass } from '@/lib/academic/actions'
import type { ApplicationStatus } from '@/lib/admissions/schemas'

interface SectionOption {
  id: string
  name: string
  capacity?: number | null
}

interface ApplicationData {
  id: string
  application_number: string
  applicant_first_name: string
  applicant_middle_name?: string | null
  applicant_last_name: string
  date_of_birth?: string | null
  gender?: string | null
  guardian_name: string
  guardian_phone: string
  guardian_email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  source?: string | null
  notes?: string | null
  status: string
  created_at: string
  reviewed_at?: string | null
  approved_at?: string | null
  rejected_at?: string | null
  converted_at?: string | null
  applying_for_class_id: string
  academic_sessions?: { name: string } | null
  classes?: { name: string } | null
  reviewed_profile?: { full_name: string } | null
  converted_student?: { id: string; admission_number: string } | null
}

interface Props {
  application: ApplicationData
  userRoles: string[]
}

export function AdmissionDetailView({ application, userRoles }: Props) {
  const router = useRouter()
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  // Conversion Modal State
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [sections, setSections] = useState<SectionOption[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [selectedSection, setSelectedSection] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [customAdmissionNo, setCustomAdmissionNo] = useState('')
  const [convertLoading, setConvertLoading] = useState(false)
  const [convertError, setConvertError] = useState<string | null>(null)

  const isAdminOrSuper = userRoles.includes('Super Admin') || userRoles.includes('Admin')
  const isPrincipal = userRoles.includes('Principal')

  useEffect(() => {
    let isMounted = true
    if (showConvertModal && application.applying_for_class_id) {
      setSectionsLoading(true)
      getSectionsByClass(application.applying_for_class_id)
        .then((res) => {
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
        .catch((err) => {
          if (isMounted) {
            console.error('Failed to load sections:', err)
            setSectionsLoading(false)
            setSections([])
            setSelectedSection('')
          }
        })
    }
    return () => {
      isMounted = false
    }
  }, [showConvertModal, application.applying_for_class_id])

  async function handleStatusChange(targetStatus: ApplicationStatus, notes?: string) {
    setStatusLoading(true)
    setStatusError(null)

    const res = await updateAdmissionStatus(application.id, {
      status: targetStatus,
      notes,
    })

    setStatusLoading(false)
    if (!res.success) {
      setStatusError(res.error)
    } else {
      router.refresh()
    }
  }

  async function handleConvertSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSection) {
      setConvertError('Please select a section for class assignment')
      return
    }

    setConvertLoading(true)
    setConvertError(null)

    const res = await convertAdmissionToStudent(application.id, {
      section_id: selectedSection,
      roll_number: rollNumber,
      admission_number: customAdmissionNo,
    })

    setConvertLoading(false)
    if (!res.success) {
      setConvertError(res.error)
    } else {
      setShowConvertModal(false)
      router.push(`/erp/admin/students/${res.data.studentId}`)
      router.refresh()
    }
  }

  const statusBadgeColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    under_review: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    withdrawn: 'bg-gray-100 text-gray-600 border-gray-200',
    converted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }

  return (
    <div className="space-y-6">
      {statusError && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {statusError}
        </div>
      )}

      {/* Main Header & Status Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
              {application.application_number}
            </span>
            <span
              className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${
                statusBadgeColors[application.status] || 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {application.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            {[application.applicant_first_name, application.applicant_middle_name, application.applicant_last_name].filter(Boolean).join(' ')}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Applying for <span className="font-semibold text-slate-700">{application.classes?.name || 'Class'}</span> ({application.academic_sessions?.name || 'Session'})
          </p>
        </div>

        {/* Dynamic Action Buttons based on lifecycle */}
        <div className="flex items-center space-x-3">
          {application.status === 'draft' && isAdminOrSuper && (
            <button
              onClick={() => handleStatusChange('submitted')}
              disabled={statusLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50"
            >
              Submit Application
            </button>
          )}

          {application.status === 'submitted' && (isAdminOrSuper || isPrincipal) && (
            <button
              onClick={() => handleStatusChange('under_review')}
              disabled={statusLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50"
            >
              Start Review
            </button>
          )}

          {application.status === 'under_review' && (isAdminOrSuper || isPrincipal) && (
            <>
              <button
                onClick={() => handleStatusChange('approved')}
                disabled={statusLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50"
              >
                Approve Application
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                disabled={statusLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50"
              >
                Reject Application
              </button>
            </>
          )}

          {application.status === 'approved' && isAdminOrSuper && (
            <button
              onClick={() => {
                setSectionsLoading(true)
                setShowConvertModal(true)
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
            >
              Convert to Enrolled Student &rarr;
            </button>
          )}

          {application.status === 'converted' && application.converted_student && (
            <Link
              href={`/erp/admin/students/${application.converted_student.id}`}
              className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium text-sm rounded-lg border border-emerald-300 transition"
            >
              View Student Profile ({application.converted_student.admission_number}) &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Applicant Details */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 font-mono">
            Applicant Profile
          </h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Full Name</span>
              <span className="font-bold text-slate-900">
                {application.applicant_first_name} {application.applicant_middle_name || ''} {application.applicant_last_name}
              </span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Date of Birth</span>
              <span className="font-bold text-slate-900">
                {application.date_of_birth
                  ? new Date(application.date_of_birth).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Gender</span>
              <span className="font-bold text-slate-900 capitalize">{application.gender || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Applying Class</span>
              <span className="font-bold text-slate-900">{application.classes?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Academic Session</span>
              <span className="font-bold text-slate-900">{application.academic_sessions?.name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Guardian Details */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 font-mono">
            Guardian & Address
          </h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Guardian Name</span>
              <span className="font-bold text-slate-900">{application.guardian_name}</span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Contact Phone</span>
              <span className="font-bold text-slate-900 font-mono">{application.guardian_phone}</span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Contact Email</span>
              <span className="font-bold text-slate-900">{application.guardian_email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Address</span>
              <span className="font-bold text-slate-900">
                {application.address || ''}
                {application.city ? `, ${application.city}` : ''}
                {application.state ? `, ${application.state}` : ''}
                {!application.address && !application.city && 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline & Audit Info */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 font-mono">
            Workflow & Audit History
          </h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Created Date</span>
              <span className="font-bold text-slate-900">
                {new Date(application.created_at).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-600 text-xs block font-semibold">Source / Channel</span>
              <span className="font-bold text-slate-900">{application.source || 'Direct Entry'}</span>
            </div>
            {application.reviewed_profile && (
              <div>
                <span className="text-slate-600 text-xs block font-semibold">Reviewed By</span>
                <span className="font-bold text-slate-900">{application.reviewed_profile.full_name}</span>
              </div>
            )}
            {application.approved_at && (
              <div>
                <span className="text-slate-600 text-xs block font-semibold">Approved Timestamp</span>
                <span className="font-bold text-emerald-800">
                  {new Date(application.approved_at).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {application.converted_at && (
              <div>
                <span className="text-slate-600 text-xs block font-semibold">Converted Timestamp</span>
                <span className="font-bold text-indigo-900">
                  {new Date(application.converted_at).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes Box */}
      {application.notes && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3 font-mono">
            Application Notes & Log
          </h3>
          <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap">{application.notes}</p>
        </div>
      )}

      {/* Convert to Student Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Convert Admission to Student</h3>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {convertError && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {convertError}
              </div>
            )}

            <form onSubmit={handleConvertSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Applicant:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {application.applicant_first_name} {application.applicant_last_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Applying Class:</span>{' '}
                  <span className="font-semibold text-slate-800">{application.classes?.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Section <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  required
                  disabled={sectionsLoading || sections.length === 0}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {sectionsLoading ? (
                    <option value="">Loading sections...</option>
                  ) : sections.length === 0 ? (
                    <option value="">No active sections found for this class</option>
                  ) : (
                    <>
                      <option value="">Select Section</option>
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          Section {sec.name} {sec.capacity ? `(Capacity: ${sec.capacity})` : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {!sectionsLoading && sections.length === 0 && (
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    No active section exists for {application.classes?.name || 'this class'}. Please create a section in Class Settings before converting.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number (Optional)</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 01"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Admission Number (Optional)
                </label>
                <input
                  type="text"
                  value={customAdmissionNo}
                  onChange={(e) => setCustomAdmissionNo(e.target.value)}
                  placeholder="Leave empty to auto-generate (e.g. RPS-2026-006)"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  If left blank, the system auto-generates a unique sequence admission number.
                </p>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertLoading || !selectedSection}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50"
                >
                  {convertLoading ? 'Converting...' : 'Confirm Conversion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
