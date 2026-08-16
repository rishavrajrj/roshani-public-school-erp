'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { linkGuardianToStudent, unlinkGuardianFromStudent, changeStudentStatus } from '@/lib/students/actions'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { User, Phone, Mail, MapPin, Calendar, Users, FileText, GraduationCap, ShieldCheck, Edit, UserCheck } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      {/* Header Profile Dossier Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-7 flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center space-x-4 sm:space-x-5">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center font-black text-xl sm:text-2xl text-[#1554C0] shrink-0 shadow-xs">
            {student.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photo_url} alt="Student" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              `${student.first_name[0]}${student.last_name[0]}`
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="font-mono text-xs font-extrabold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-200">
                ID: {student.admission_number?.startsWith('ADM-') ? student.admission_number.replace('ADM-', 'STU-') : `STU-${student.admission_number}`}
              </span>
              <span className="font-mono text-xs font-extrabold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200">
                ADM: {student.admission_number}
              </span>
              <StatusBadge status={student.status} size="sm" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 font-sans">
              {[student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {activeAcademic
                ? `Class: ${activeAcademic.classes?.name || ''} - ${activeAcademic.sections?.name || ''} (Roll #${activeAcademic.roll_number || 'N/A'})`
                : 'No active academic assignment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdminOrSuper && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusModal(true)}
              >
                Change Status
              </Button>
              <Link href={`/erp/admin/students/${student.id}/edit`}>
                <Button size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                  Edit Profile
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200 flex space-x-6 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#1554C0] text-[#1554C0]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Overview &amp; Profile Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('academic')}
          className={`pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'academic'
              ? 'border-[#1554C0] text-[#1554C0]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Academic History ({student.student_academic_history?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guardians')}
          className={`pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'guardians'
              ? 'border-[#1554C0] text-[#1554C0]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Guardians ({student.student_guardians?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'documents'
              ? 'border-[#1554C0] text-[#1554C0]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Documents ({student.student_documents?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2.5 font-mono">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-600 text-xs block font-semibold">Date of Birth</span>
                <span className="font-bold text-slate-900">
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
                <span className="text-slate-600 text-xs block font-semibold">Gender</span>
                <span className="font-bold text-slate-900 capitalize">{student.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-600 text-xs block font-semibold">Phone</span>
                <span className="font-bold text-slate-900 font-mono">{student.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-600 text-xs block font-semibold">Email</span>
                <span className="font-bold text-slate-900">{student.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2.5 font-mono">
              Address Information
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-600 text-xs block font-semibold">Street Address</span>
                <span className="font-bold text-slate-900">{student.address || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-600 text-xs block font-semibold">City / District</span>
                  <span className="font-bold text-slate-900">{student.city || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-600 text-xs block font-semibold">State</span>
                  <span className="font-bold text-slate-900">{student.state || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2.5 font-mono">
            Academic History Log
          </h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200 text-[11px] uppercase font-mono">
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Roll #</th>
                  <th className="py-3 px-4">Academic Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900 font-medium">
                {student.student_academic_history?.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {h.academic_sessions?.name} {h.academic_sessions?.is_current ? '(Current)' : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-800">{h.classes?.name}</td>
                    <td className="py-3 px-4 text-slate-800">Section {h.sections?.name}</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900">{h.roll_number || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={h.status} size="sm" />
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
            <h3 className="text-sm font-bold text-slate-800">Associated Parents &amp; Guardians</h3>
            {isAdminOrSuper && (
              <Button
                size="sm"
                onClick={() => setShowGuardianModal(true)}
              >
                + Add / Link Guardian
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.student_guardians?.map((sg) => (
              <div key={sg.id} className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 space-y-3 relative">
                {sg.is_primary && (
                  <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                    PRIMARY GUARDIAN
                  </span>
                )}
                <div>
                  <span className="text-[10px] font-extrabold text-[#1554C0] uppercase tracking-wider font-mono">
                    {sg.relationship}
                  </span>
                  <h4 className="text-base font-bold text-slate-900">{sg.guardians?.full_name}</h4>
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
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleUnlinkGuardian(sg.guardians!.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
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
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6 space-y-4">
          <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2.5 font-mono">
            Student Documents &amp; Records
          </h3>
          {(!student.student_documents || student.student_documents.length === 0) ? (
            <p className="text-xs text-slate-400 py-6 text-center font-medium">No documents uploaded for this student yet.</p>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10.5px] uppercase font-mono">
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Upload Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {student.student_documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{doc.document_type}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono">{doc.file_name}</td>
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
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Student Status"
        description="Update administrative enrollment status for this student profile."
        size="md"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Target Status</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full h-10 text-xs sm:text-sm px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1554C0] font-medium"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="alumni">Alumni / Graduated</option>
              <option value="transferred">Transferred</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Reason / Remarks</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Administrative reason..."
              rows={3}
              className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1554C0] font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowStatusModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={statusLoading}
              loadingText="Updating..."
            >
              Save Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Link Guardian Modal */}
      <Modal
        isOpen={showGuardianModal}
        onClose={() => setShowGuardianModal(false)}
        title="Link / Create Guardian"
        description="Associate an official parent or guardian record with this student."
        size="md"
      >
        {gError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-4">
            {gError}
          </div>
        )}

        <form onSubmit={handleLinkGuardian} className="space-y-3.5 text-left">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Guardian Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={gFullName}
              onChange={(e) => setGFullName(e.target.value)}
              required
              placeholder="e.g. Sunita Devi"
              className="w-full h-10 text-xs sm:text-sm px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1554C0] font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Relationship <span className="text-rose-500">*</span>
              </label>
              <select
                value={gRelationship}
                onChange={(e) => setGRelationship(e.target.value)}
                required
                className="w-full h-10 text-xs sm:text-sm px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1554C0] font-medium"
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={gPhone}
                onChange={(e) => setGPhone(e.target.value)}
                required
                placeholder="+91 9876543210"
                className="w-full h-10 text-xs sm:text-sm px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1554C0] font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={gEmail}
              onChange={(e) => setGEmail(e.target.value)}
              placeholder="guardian@example.com"
              className="w-full h-10 text-xs sm:text-sm px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1554C0] font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Address</label>
            <input
              type="text"
              value={gAddress}
              onChange={(e) => setGAddress(e.target.value)}
              placeholder="Street / Village details"
              className="w-full h-10 text-xs sm:text-sm px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1554C0] font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="is_primary_chk"
              checked={gIsPrimary}
              onChange={(e) => setGIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded text-[#1554C0] focus:ring-[#1554C0]"
            />
            <label htmlFor="is_primary_chk" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Set as Primary Guardian
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGuardianModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={gLoading}
              loadingText="Linking..."
            >
              Link Guardian
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
