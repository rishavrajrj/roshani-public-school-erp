'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { linkGuardianToStudent, unlinkGuardianFromStudent, changeStudentStatus } from '@/lib/students/actions'

interface StudentData {
  id: string
  admission_number: string
  first_name: string
  middle_name?: string | null
  last_name: string
  date_of_birth?: string | null
  gender?: string | null
  photo_url?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  status: string
  created_at: string
  student_academic_history?: Array<{
    id: string
    roll_number?: string | null
    status: string
    created_at: string
    academic_sessions?: { name: string; is_current: boolean } | null
    classes?: { name: string } | null
    sections?: { name: string } | null
  }>
  student_guardians?: Array<{
    id: string
    relationship: string
    is_primary: boolean
    guardians?: {
      id: string
      full_name: string
      phone?: string | null
      alternate_phone?: string | null
      email?: string | null
      address?: string | null
      occupation?: string | null
    } | null
  }>
  student_documents?: Array<{
    id: string
    document_type: string
    file_name: string
    mime_type?: string | null
    file_size?: number | null
    created_at: string
  }>
}

interface Props {
  student: StudentData
  userRoles: string[]
}

export function StudentProfileView({ student, userRoles }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'guardians' | 'documents'>('overview')

  // Status Change State
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState(student.status)
  const [statusReason, setStatusReason] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  // Guardian Link Modal State
  const [showGuardianModal, setShowGuardianModal] = useState(false)
  const [gFullName, setGFullName] = useState('')
  const [gPhone, setGPhone] = useState('')
  const [gRelationship, setGRelationship] = useState('father')
  const [gEmail, setGEmail] = useState('')
  const [gAddress, setGAddress] = useState('')
  const [gIsPrimary, setGIsPrimary] = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [gError, setGError] = useState<string | null>(null)

  const isAdminOrSuper = userRoles.includes('Super Admin') || userRoles.includes('Admin')

  async function handleStatusSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatusLoading(true)
    const res = await changeStudentStatus(student.id, {
      status: targetStatus as any,
      reason: statusReason,
    })
    setStatusLoading(false)
    if (res.success) {
      setShowStatusModal(false)
      router.refresh()
    }
  }

  async function handleLinkGuardian(e: React.FormEvent) {
    e.preventDefault()
    setGLoading(true)
    setGError(null)

    const res = await linkGuardianToStudent(student.id, {
      full_name: gFullName,
      phone: gPhone,
      relationship: gRelationship,
      email: gEmail,
      address: gAddress,
      is_primary: gIsPrimary,
    })

    setGLoading(false)
    if (!res.success) {
      setGError(res.error)
    } else {
      setShowGuardianModal(false)
      setGFullName('')
      setGPhone('')
      router.refresh()
    }
  }

  async function handleUnlinkGuardian(guardianId: string) {
    if (!confirm('Are you sure you want to unlink this guardian?')) return
    const res = await unlinkGuardianFromStudent(student.id, guardianId)
    if (res.success) {
      router.refresh()
    }
  }

  const activeAcademic = student.student_academic_history?.find((h) => h.status === 'active') || student.student_academic_history?.[0]

  const statusBadgeColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-amber-50 text-amber-700 border-amber-200',
    alumni: 'bg-blue-50 text-blue-700 border-blue-200',
    transferred: 'bg-purple-50 text-purple-700 border-purple-200',
    withdrawn: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xl text-slate-600 border border-slate-300">
            {student.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photo_url} alt="Student" className="w-full h-full rounded-full object-cover" />
            ) : (
              `${student.first_name[0]}${student.last_name[0]}`
            )}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded">
                {student.admission_number}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  statusBadgeColors[student.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {student.status.toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {[student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ')}
            </h2>
            <p className="text-sm text-slate-500">
              {activeAcademic
                ? `Class: ${activeAcademic.classes?.name || ''} - ${activeAcademic.sections?.name || ''} (Roll #${activeAcademic.roll_number || 'N/A'})`
                : 'No active academic assignment'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isAdminOrSuper && (
            <>
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition"
              >
                Change Status
              </button>
              <Link
                href={`/erp/admin/students/${student.id}/edit`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Edit Profile
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200 flex space-x-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview & Basic Details
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'academic'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Academic History ({student.student_academic_history?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('guardians')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'guardians'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Guardians ({student.student_guardians?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Documents ({student.student_documents?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400 text-xs block">Date of Birth</span>
                <span className="font-medium text-slate-800">
                  {student.date_of_birth
                    ? new Date(student.date_of_birth).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Gender</span>
                <span className="font-medium text-slate-800 capitalize">{student.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Phone</span>
                <span className="font-medium text-slate-800">{student.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Email</span>
                <span className="font-medium text-slate-800">{student.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-2">
              Address Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-400 text-xs block">Street Address</span>
                <span className="font-medium text-slate-800">{student.address || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-xs block">City / District</span>
                  <span className="font-medium text-slate-800">{student.city || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">State</span>
                  <span className="font-medium text-slate-800">{student.state || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-2">
            Academic History Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Session</th>
                  <th className="py-2.5 px-4">Class</th>
                  <th className="py-2.5 px-4">Section</th>
                  <th className="py-2.5 px-4">Roll #</th>
                  <th className="py-2.5 px-4">Academic Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {student.student_academic_history?.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {h.academic_sessions?.name} {h.academic_sessions?.is_current ? '(Current)' : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{h.classes?.name}</td>
                    <td className="py-3 px-4 text-slate-700">Section {h.sections?.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-800">{h.roll_number || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {h.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'guardians' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Associated Parents & Guardians</h3>
            {isAdminOrSuper && (
              <button
                onClick={() => setShowGuardianModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
              >
                + Add / Link Guardian
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.student_guardians?.map((sg) => (
              <div key={sg.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 relative">
                {sg.is_primary && (
                  <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    PRIMARY GUARDIAN
                  </span>
                )}
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {sg.relationship}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">{sg.guardians?.full_name}</h4>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-500">Phone:</span> {sg.guardians?.phone}
                  </div>
                  {sg.guardians?.email && (
                    <div>
                      <span className="font-semibold text-slate-500">Email:</span> {sg.guardians.email}
                    </div>
                  )}
                  {sg.guardians?.occupation && (
                    <div>
                      <span className="font-semibold text-slate-500">Occupation:</span> {sg.guardians.occupation}
                    </div>
                  )}
                  {sg.guardians?.address && (
                    <div>
                      <span className="font-semibold text-slate-500">Address:</span> {sg.guardians.address}
                    </div>
                  )}
                </div>

                {isAdminOrSuper && sg.guardians && (
                  <div className="pt-2 border-t flex justify-end">
                    <button
                      onClick={() => handleUnlinkGuardian(sg.guardians!.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                    >
                      Unlink Guardian
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-2">
            Student Documents & Records (Private Bucket Metadata)
          </h3>
          {(!student.student_documents || student.student_documents.length === 0) ? (
            <p className="text-sm text-slate-400 py-4">No documents uploaded for this student yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Document Type</th>
                    <th className="py-2.5 px-4">File Name</th>
                    <th className="py-2.5 px-4">Upload Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.student_documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">{doc.document_type}</td>
                      <td className="py-3 px-4 text-slate-700">{doc.file_name}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {new Date(doc.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Change Student Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="alumni">Alumni / Graduated</option>
                  <option value="transferred">Transferred</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Remarks</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Administrative reason..."
                  rows={2}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50"
                >
                  {statusLoading ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Link Guardian Modal */}
      {showGuardianModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Link / Create Guardian</h3>
              <button onClick={() => setShowGuardianModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            {gError && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {gError}
              </div>
            )}

            <form onSubmit={handleLinkGuardian} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guardian Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={gFullName}
                  onChange={(e) => setGFullName(e.target.value)}
                  required
                  placeholder="e.g. Sunita Devi"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gRelationship}
                    onChange={(e) => setGRelationship(e.target.value)}
                    required
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={gPhone}
                    onChange={(e) => setGPhone(e.target.value)}
                    required
                    placeholder="+91 9876543210"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={gEmail}
                  onChange={(e) => setGEmail(e.target.value)}
                  placeholder="guardian@example.com"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={gAddress}
                  onChange={(e) => setGAddress(e.target.value)}
                  placeholder="Street / Village details"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_primary_chk"
                  checked={gIsPrimary}
                  onChange={(e) => setGIsPrimary(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_primary_chk" className="text-xs font-medium text-slate-700">
                  Set as Primary Guardian
                </label>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowGuardianModal(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50"
                >
                  {gLoading ? 'Linking...' : 'Link Guardian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
