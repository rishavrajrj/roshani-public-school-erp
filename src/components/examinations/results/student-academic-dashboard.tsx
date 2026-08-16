'use client'

import { useState, useMemo } from 'react'
import type { StudentResult, GradingScale, StudentAcademicProfile } from '@/types/result'
import { calculateStudentPerformanceAnalytics } from '@/lib/examinations/result-analytics'
import { ResultDocument } from './result-document'
import { ResultComparisonView } from './result-comparison-view'
import { SubjectDetailDrawer } from './subject-detail-drawer'
import { AcademicJourneyTimeline } from './academic-journey-timeline'
import { Button } from '@/components/ui/button'

interface Props {
  initialResults: StudentResult[]
  gradingScales: GradingScale[]
  studentProfile?: StudentAcademicProfile | null
  title?: string
  subtitle?: string
}

export function StudentAcademicDashboard({
  initialResults,
  gradingScales,
  studentProfile,
  title = 'Academic Results & Performance Center',
  subtitle = 'Track subject-wise performance, examination trends, grade progression, and official marksheets.',
}: Props) {
  // Active detailed result selection
  const [selectedResultId, setSelectedResultId] = useState<string | null>(
    initialResults.length > 0 ? initialResults[0].id : null
  )

  // Modals & Drawers state
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [activeDrawerSubject, setActiveDrawerSubject] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'compare' | 'journey' | 'detailed_marksheet'>('overview')

  // Interactive Chart Tooltip State
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)

  // Filters state
  const [sessionFilter, setSessionFilter] = useState<string>('ALL')
  const [classFilter, setClassFilter] = useState<string>('ALL')
  const [examFilter, setExamFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Calculate master analytics based on published results
  const analytics = useMemo(() => {
    return calculateStudentPerformanceAnalytics(initialResults, gradingScales)
  }, [initialResults, gradingScales])

  // Extract unique filter options
  const sessions = useMemo(() => {
    const set = new Set<string>()
    initialResults.forEach((r) => {
      if (r.academicSessionName) set.add(r.academicSessionName)
    })
    return Array.from(set)
  }, [initialResults])

  const classes = useMemo(() => {
    const set = new Set<string>()
    initialResults.forEach((r) => {
      if (r.className) set.add(r.className)
    })
    return Array.from(set)
  }, [initialResults])

  // Filtered Exam Summaries
  const filteredExamSummaries = useMemo(() => {
    return analytics.examSummaries.filter((row) => {
      if (sessionFilter !== 'ALL' && row.academicSessionName !== sessionFilter) return false
      if (classFilter !== 'ALL' && row.className !== classFilter) return false
      if (examFilter !== 'ALL' && row.examinationName !== examFilter) return false
      if (statusFilter !== 'ALL' && row.resultStatus !== statusFilter) return false
      return true
    })
  }, [analytics.examSummaries, sessionFilter, classFilter, examFilter, statusFilter])

  // Active selected result object
  const activeResult = useMemo(() => {
    if (!selectedResultId) return initialResults[0] || null
    return initialResults.find((r) => r.id === selectedResultId) || initialResults[0] || null
  }, [initialResults, selectedResultId])

  // Chronological navigation in Marksheet view (initialResults is newest-first)
  const currentResultIndex = useMemo(() => {
    if (!activeResult) return 0
    return initialResults.findIndex((r) => r.id === activeResult.id)
  }, [initialResults, activeResult])

  const hasNewerResult = currentResultIndex > 0
  const hasOlderResult = currentResultIndex < initialResults.length - 1

  const handleGoToNewer = () => {
    if (hasNewerResult) {
      setSelectedResultId(initialResults[currentResultIndex - 1].id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleGoToOlder = () => {
    if (hasOlderResult) {
      setSelectedResultId(initialResults[currentResultIndex + 1].id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Reset all filters
  const resetFilters = () => {
    setSessionFilter('ALL')
    setClassFilter('ALL')
    setExamFilter('ALL')
    setStatusFilter('ALL')
  }

  // Handle open marksheet
  const handleOpenMarksheet = (resultId: string) => {
    setSelectedResultId(resultId)
    setViewMode('detailed_marksheet')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle open grade view
  const handleOpenGradeView = (resultId: string) => {
    setSelectedResultId(resultId)
    setIsGradeModalOpen(true)
  }

  // Empty state when no results are published yet
  if (!initialResults || initialResults.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto my-8 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto text-3xl">
          📊
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Examination Result Published Yet</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Your marks statements and performance reports will appear here as soon as examination evaluation is approved and published by the administration.
        </p>
      </div>
    )
  }

  const studentName = studentProfile?.fullName || activeResult?.studentName || 'Student'
  const admissionNo = studentProfile?.admissionNumber || activeResult?.admissionNumber || 'N/A'
  const rollNo = studentProfile?.rollNumber || activeResult?.rollNumber || 'N/A'
  const className = studentProfile?.className || activeResult?.className || 'Class 10'
  const sectionName = studentProfile?.sectionName || activeResult?.sectionName || 'A'
  const sessionName = studentProfile?.academicSessionName || activeResult?.academicSessionName || '2025–26'
  const overallStatus = analytics.overallResultStatus
  const isViewingLatestResult = activeResult ? activeResult.id === initialResults[0].id : true

  return (
    <div className="space-y-8 w-full print:space-y-0">
      {/* 1. Header Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Student Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-inner">
              {studentProfile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={studentProfile.avatarUrl} alt={studentName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                studentName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
              )}
            </div>

            {/* Student Bio */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{studentName}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  overallStatus === 'PASS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  Overall: {overallStatus}
                </span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{className} • Section {sectionName}</span>
                <span className="text-slate-500">•</span>
                <span>Roll No: <strong className="text-white font-mono">{rollNo}</strong></span>
                <span className="text-slate-500">•</span>
                <span>Adm No: <strong className="text-white font-mono">{admissionNo}</strong></span>
                <span className="text-slate-500">•</span>
                <span>Session: <strong className="text-indigo-200">{sessionName}</strong></span>
              </p>
            </div>
          </div>

          {/* V2 Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              📊 Performance
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === 'compare'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              ⚖️ Compare Results
            </button>
            <button
              onClick={() => setViewMode('journey')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === 'journey'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🗺️ Academic Journey
            </button>
            <button
              onClick={() => setViewMode('detailed_marksheet')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === 'detailed_marksheet'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              📄 Marksheet
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. COMPARE RESULTS VIEW MODE */}
      {/* ========================================================================= */}
      {viewMode === 'compare' && (
        <ResultComparisonView
          results={initialResults}
          gradingScales={gradingScales}
          onOpenSubjectDetail={(subject) => setActiveDrawerSubject(subject)}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. ACADEMIC JOURNEY VIEW MODE */}
      {/* ========================================================================= */}
      {viewMode === 'journey' && (
        <AcademicJourneyTimeline
          journeySteps={analytics.academicJourney}
          onSelectResult={(resultId) => handleOpenMarksheet(resultId)}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. DETAILED MARKSHEET VIEW MODE WITH CHRONOLOGICAL NAVIGATION */}
      {/* ========================================================================= */}
      {viewMode === 'detailed_marksheet' && activeResult && (
        <div className="space-y-6">
          {/* Marksheet Toolbar & Context Banner */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('overview')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    ← Back to Dashboard
                  </button>
                  <span className="text-slate-300">•</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isViewingLatestResult
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isViewingLatestResult ? 'CURRENT RESULT' : 'PREVIOUS RESULT (ARCHIVE)'}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  Provisional Marksheet: {activeResult.examinationName}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Academic Results → {activeResult.academicSessionName || '2025–26'} → {activeResult.className} → {activeResult.examinationName}
                </p>
              </div>

              {/* Navigation & Print Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Previous Examination Button */}
                <button
                  onClick={handleGoToOlder}
                  disabled={!hasOlderResult}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                    hasOlderResult
                      ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Navigate to earlier examination"
                >
                  <span>←</span>
                  <span>Previous Result</span>
                </button>

                {/* Next Examination Button */}
                <button
                  onClick={handleGoToNewer}
                  disabled={!hasNewerResult}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
                    hasNewerResult
                      ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Navigate to later examination"
                >
                  <span>Next Result</span>
                  <span>→</span>
                </button>

                {/* Exam Quick Select Dropdown */}
                <select
                  value={activeResult.id}
                  onChange={(e) => setSelectedResultId(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  {initialResults.map((r, i) => (
                    <option key={r.id} value={r.id}>
                      {i === 0 ? '★ Current: ' : ''}{r.examinationName} ({r.academicSessionName || 'Session'})
                    </option>
                  ))}
                </select>

                <Button
                  variant="primary"
                  onClick={() => window.print()}
                  className="shrink-0 flex items-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>Print / PDF</span>
                </Button>
              </div>
            </div>
          </div>

          <ResultDocument
            result={activeResult}
            historicalResults={initialResults}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. OVERVIEW DASHBOARD VIEW MODE */}
      {/* ========================================================================= */}
      {viewMode === 'overview' && (
        <>
          {/* Top Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            {/* Card 1: Overall Percentage */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Score</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  Grade {analytics.overallGrade}
                </span>
              </div>
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                  {analytics.overallPercentage}%
                </span>
                <span className="text-xs text-slate-500">aggregate</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, analytics.overallPercentage)}%` }}
                />
              </div>
            </div>

            {/* Card 2: GPA / CGPA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic Index</span>
                <span className="text-[10px] font-semibold text-slate-500">10-Pt Scale</span>
              </div>
              <div className="my-3 flex items-baseline gap-3">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {analytics.overallGpa.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-medium">Exam SGPA</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">
                    {analytics.overallCgpa.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-medium">Cumulative CGPA</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Total Assessed</span>
                <span className="font-bold text-slate-800">{analytics.totalSubjectsCount} Subjects</span>
              </div>
            </div>

            {/* Card 3: Marks & Subject Clearance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Marks Obtained</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  analytics.subjectsFailedCount === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {analytics.subjectsPassedCount}/{analytics.totalSubjectsCount} Passed
                </span>
              </div>
              <div className="my-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  {analytics.totalMarksObtained}
                </span>
                <span className="text-xs font-semibold text-slate-400 ml-1">/ {analytics.totalMaximumMarks}</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Back Papers</span>
                <span className={`font-bold ${analytics.subjectsFailedCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {analytics.subjectsFailedCount > 0 ? `${analytics.subjectsFailedCount} Subject(s)` : 'NIL (Clear)'}
                </span>
              </div>
            </div>

            {/* Card 4: Trend / Attendance (Neutral Representation) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic Standing</span>
                <span className="text-[10px] font-semibold text-slate-500 font-mono">
                  Attendance: {studentProfile?.attendancePercentage || 94.5}%
                </span>
              </div>
              <div className="my-3">
                {analytics.hasTrend && analytics.improvementDelta !== null ? (
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl sm:text-3xl font-black font-mono ${
                      analytics.improvementDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {analytics.improvementDelta >= 0 ? `+${analytics.improvementDelta.toFixed(2)}%` : `${analytics.improvementDelta.toFixed(2)}%`}
                    </span>
                    <span className="text-xl">
                      {analytics.improvementDelta >= 0 ? '📈' : '📉'}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-slate-700">Initial Evaluation Record</div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate" title={analytics.trendSummaryText}>
                {analytics.trendSummaryText}
              </p>
            </div>
          </div>

          {/* Performance Comparison Banner */}
          {analytics.hasTrend && (
            <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {analytics.trendDirection === 'up' ? '↗' : analytics.trendDirection === 'down' ? '↘' : '→'}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">Performance Comparison</h4>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                    {analytics.trendSummaryText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono self-end sm:self-center">
                <div className="bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
                  <span className="text-slate-400 block text-[9px] uppercase font-sans">Previous Exam</span>
                  <span className="font-bold text-slate-700">{analytics.previousPercentage}%</span>
                </div>
                <div className="text-slate-400 font-sans">→</div>
                <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl">
                  <span className="text-indigo-200 block text-[9px] uppercase font-sans">Current Exam</span>
                  <span className="font-bold">{analytics.currentPercentage}%</span>
                </div>
                <button
                  onClick={() => setViewMode('compare')}
                  className="ml-2 px-3 py-1.5 rounded-xl bg-indigo-100 text-indigo-900 font-bold hover:bg-indigo-200 transition-colors"
                >
                  Full Compare →
                </button>
              </div>
            </div>
          )}

          {/* Exam Summary Table (Matching Reference Mockup) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Exam Summary</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidated evaluation records across academic years and examination terms
                </p>
              </div>

              {/* Multi-Level Filters Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {sessions.length > 1 && (
                  <select
                    value={sessionFilter}
                    onChange={(e) => setSessionFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">Session: All</option>
                    {sessions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}

                {classes.length > 1 && (
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">Class: All</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Status: All</option>
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                  <option value="COMPARTMENT">COMPARTMENT</option>
                </select>

                {(sessionFilter !== 'ALL' || classFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline px-1"
                  >
                    All Results
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-4 w-12 text-center">No.</th>
                    <th className="p-4">Year / Class / Exam</th>
                    <th className="p-4 text-center">Percentage / SGPA</th>
                    <th className="p-4 text-center">Back Paper(s)</th>
                    <th className="p-4 text-center">Result Status</th>
                    <th className="p-4 text-center">Grade View</th>
                    <th className="p-4 text-center">Marksheet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredExamSummaries.length > 0 ? (
                    filteredExamSummaries.map((row) => (
                      <tr key={row.resultId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 text-center font-mono font-bold text-slate-400">{row.index}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-sm">{row.formattedYearClassExam}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Marks: {row.totalMarksObtained} / {row.maximumMarks}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono font-black text-sm text-slate-900">{row.percentage}%</span>
                          <span className="text-[11px] text-indigo-600 font-semibold block font-mono">
                            {row.sgpa.toFixed(2)} SGPA
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {row.backPaperCount === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              NIL
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={row.backPapers.join(', ')}>
                              {row.backPaperCount} Subject ({row.backPapers[0]})
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                            row.resultStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {row.resultStatus}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenGradeView(row.resultId)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
                          >
                            View Grade
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenMarksheet(row.resultId)}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No results match the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="block sm:hidden divide-y divide-slate-200 p-4 space-y-4">
              {filteredExamSummaries.map((row) => (
                <div key={row.resultId} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">#{row.index}</span>
                      <h4 className="font-bold text-sm text-slate-900">{row.formattedYearClassExam}</h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase ${
                      row.resultStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {row.resultStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Percentage</span>
                      <span className="font-bold text-slate-900">{row.percentage}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">SGPA</span>
                      <span className="font-bold text-indigo-700">{row.sgpa.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Total Marks</span>
                      <span className="font-bold text-slate-700">{row.totalMarksObtained} / {row.maximumMarks}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Back Papers</span>
                      <span className={`font-bold ${row.backPaperCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {row.backPaperCount > 0 ? `${row.backPaperCount}` : 'NIL'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenGradeView(row.resultId)}
                      className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
                    >
                      View Grade
                    </button>
                    <button
                      onClick={() => handleOpenMarksheet(row.resultId)}
                      className="flex-1 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Visualizations & SVG Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Performance Progression Trend Line Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Performance Trend Across Exams</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Chronological percentage progression with pass benchmark</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {analytics.trendPoints.length} Terms
                </span>
              </div>

              {analytics.trendPoints.length > 0 ? (
                <div className="pt-4">
                  <div className="relative h-56 w-full">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="0" y1="100" x2="400" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="0" y1="140" x2="400" y2="140" stroke="#cbd5e1" strokeWidth="1" />

                      {/* Pass Benchmark Line (33%) */}
                      <line x1="0" y1="120" x2="400" y2="120" stroke="#fecdd3" strokeWidth="1" strokeDasharray="2 2" />
                      <text x="395" y="117" textAnchor="end" fill="#f43f5e" fontSize="8" fontWeight="bold">Pass (33%)</text>

                      {/* Polyline */}
                      {analytics.trendPoints.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={analytics.trendPoints.map((pt, i) => {
                            const x = analytics.trendPoints.length === 1 ? 200 : (i / (analytics.trendPoints.length - 1)) * 360 + 20
                            const y = 140 - (pt.percentage / 100) * 120
                            return `${x},${y}`
                          }).join(' ')}
                        />
                      )}

                      {/* Points */}
                      {analytics.trendPoints.map((pt, i) => {
                        const x = analytics.trendPoints.length === 1 ? 200 : (i / (analytics.trendPoints.length - 1)) * 360 + 20
                        const y = 140 - (pt.percentage / 100) * 120
                        const isLatest = i === analytics.trendPoints.length - 1
                        const isHovered = hoveredPointIndex === i

                        return (
                          <g
                            key={i}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPointIndex(i)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                            onClick={() => handleOpenMarksheet(pt.examinationId)}
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r={isLatest || isHovered ? 7 : 5}
                              fill={isLatest ? '#4f46e5' : '#6366f1'}
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                            <text x={x} y={y - 10} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="monospace">
                              {pt.percentage}%
                            </text>
                            <text x={x} y={155} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">
                              {pt.examinationName?.substring(0, 10)}
                            </text>
                          </g>
                        )
                      })}
                    </svg>

                    {/* Hovered Point Tooltip */}
                    {hoveredPointIndex !== null && analytics.trendPoints[hoveredPointIndex] && (
                      <div className="absolute top-2 right-2 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl shadow-lg border border-slate-700 pointer-events-none font-mono">
                        <div className="font-bold text-indigo-300 font-sans">
                          {analytics.trendPoints[hoveredPointIndex].examinationName}
                        </div>
                        <div>Score: {analytics.trendPoints[hoveredPointIndex].percentage}% (Grade {analytics.trendPoints[hoveredPointIndex].grade})</div>
                        <div>Session: {analytics.trendPoints[hoveredPointIndex].academicSessionName}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                  Performance trend will appear after additional examinations are published.
                </div>
              )}
            </div>

            {/* Chart 2: Subject Performance Bar Chart (Clickable for Drawer) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Subject-Wise Performance</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click any subject to view its longitudinal history</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">Benchmark: ≥ 80%</span>
              </div>

              <div className="space-y-3 pt-2">
                {analytics.allSubjectScores.map((sub) => (
                  <div
                    key={sub.subjectId}
                    onClick={() => setActiveDrawerSubject(sub.subjectName)}
                    className="space-y-1 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    title="Click for historical subject trajectory"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                        {sub.subjectName} ↗
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900">{sub.obtainedMarks}/{sub.maximumMarks}</span>
                        <span className={`px-1.5 py-0.2 rounded font-black text-[10px] ${
                          sub.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : sub.percentage >= 60 ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.percentage}% ({sub.grade})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          sub.percentage >= 80 ? 'bg-emerald-500' : sub.percentage >= 60 ? 'bg-indigo-600' : sub.percentage >= 33 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, sub.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strong Subjects, Needs More Practice & Data-Driven Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strong Subjects Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="text-lg">🌟</span>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Strong Subjects</h4>
              </div>
              <div className="space-y-2.5">
                {analytics.strongSubjects.length > 0 ? (
                  analytics.strongSubjects.map((s) => (
                    <div
                      key={s.subjectId}
                      onClick={() => setActiveDrawerSubject(s.subjectName)}
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 cursor-pointer transition-colors"
                      title="Click for full subject history"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{s.subjectName} ↗</span>
                        <span className="text-[10px] text-emerald-800 font-semibold">Grade {s.grade} • {s.gradePoint} GP</span>
                      </div>
                      <span className="text-sm font-black font-mono text-emerald-700">{s.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No subject data available.</p>
                )}
              </div>
            </div>

            {/* Subjects Needing Practice Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <span className="text-lg">🎯</span>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Needs More Practice</h4>
              </div>
              <div className="space-y-2.5">
                {analytics.practiceSubjects.length > 0 ? (
                  analytics.practiceSubjects.map((s) => (
                    <div
                      key={s.subjectId}
                      onClick={() => setActiveDrawerSubject(s.subjectName)}
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-50 cursor-pointer transition-colors"
                      title="Click for full subject history"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{s.subjectName} ↗</span>
                        <span className="text-[10px] text-amber-800 font-semibold">Grade {s.grade} • Targeted Revision</span>
                      </div>
                      <span className="text-sm font-black font-mono text-amber-700">{s.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center">
                    All subjects performed exceptionally well!
                  </div>
                )}
              </div>
            </div>

            {/* Transparent Data-Driven Academic Insights */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <span className="text-lg">🧠</span>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Academic Insights</h4>
              </div>
              <div className="space-y-3">
                {analytics.dynamicInsights.map((insight) => (
                  <div key={insight.id} className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                      <span>{insight.icon || '📌'}</span>
                      <span>{insight.title}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-sans">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Academic Progression Matrix */}
          {analytics.academicProgression.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Academic Progression Matrix</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Historical scholastic advancement across academic classes</p>
                </div>
                <button
                  onClick={() => setViewMode('journey')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  View Full Timeline →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                      <th className="p-3">Class / Level</th>
                      <th className="p-3">Academic Session</th>
                      <th className="p-3 text-center">Average Score</th>
                      <th className="p-3 text-center">Grade Point Average</th>
                      <th className="p-3 text-center">Result Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {analytics.academicProgression.map((prog, idx) => (
                      <tr key={idx} className={prog.isCurrent ? 'bg-indigo-50/40 font-bold' : ''}>
                        <td className="p-3">
                          <span className="font-bold text-slate-900">{prog.classLevel}</span>
                          {prog.isCurrent && (
                            <span className="ml-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-black">
                              CURRENT
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 font-mono">{prog.academicSession}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">{prog.percentage}%</td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-700">{prog.gpa.toFixed(2)} GPA</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase ${
                            prog.resultStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {prog.resultStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. SUBJECT DETAIL DRAWER */}
      {/* ========================================================================= */}
      {activeDrawerSubject && (
        <SubjectDetailDrawer
          subjectNameOrId={activeDrawerSubject}
          results={initialResults}
          gradingScales={gradingScales}
          onClose={() => setActiveDrawerSubject(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. GRADE VIEW MODAL */}
      {/* ========================================================================= */}
      {isGradeModalOpen && activeResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                  {activeResult.examinationName}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">Grade Analysis &amp; Distribution</h3>
              </div>
              <button
                onClick={() => setIsGradeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Grade Frequency Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Subjects Achieved by Grade
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analytics.gradeDistribution.map((item) => (
                  <div key={item.grade} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                          {item.grade}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{item.count} Subject(s)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {item.subjects.join(', ')}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600">{item.percentageOfTotal}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* School Grading Scale Criteria Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Institutional Grading Scale Criteria
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold sticky top-0">
                    <tr>
                      <th className="p-2">Grade</th>
                      <th className="p-2">Marks Range (%)</th>
                      <th className="p-2">Grade Point</th>
                      <th className="p-2">Scholastic Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {gradingScales && gradingScales.length > 0 ? (
                      gradingScales.map((sc) => (
                        <tr key={sc.id} className="hover:bg-slate-50">
                          <td className="p-2 font-black text-indigo-900">{sc.grade}</td>
                          <td className="p-2 font-mono">{sc.minPercentage}% – {sc.maxPercentage}%</td>
                          <td className="p-2 font-mono font-bold">{sc.gradePoint.toFixed(1)}</td>
                          <td className="p-2 text-slate-500">{sc.description || 'Standard evaluation'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-slate-400">
                          CBSE standard 9-point scale configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsGradeModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
