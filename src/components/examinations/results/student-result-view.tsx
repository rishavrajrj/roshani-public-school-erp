'use client'

import type { StudentResult, GradingScale, StudentAcademicProfile } from '@/types/result'
import { StudentAcademicDashboard } from './student-academic-dashboard'

interface Props {
  result?: StudentResult | null
  allResults?: StudentResult[]
  gradingScales?: GradingScale[]
  studentProfile?: StudentAcademicProfile | null
}

export function StudentResultView({
  result,
  allResults = [],
  gradingScales = [],
  studentProfile,
}: Props) {
  // Consolidate results: prefer allResults, or wrap single result in array if provided
  const combinedResults: StudentResult[] = allResults.length > 0
    ? allResults
    : result && result.status === 'published'
    ? [result]
    : []

  return (
    <StudentAcademicDashboard
      initialResults={combinedResults}
      gradingScales={gradingScales}
      studentProfile={studentProfile}
      title="Student Academic Results &amp; Performance"
      subtitle="Complete record of subject evaluations, GPA index, progression trends, and certified marksheets."
    />
  )
}

