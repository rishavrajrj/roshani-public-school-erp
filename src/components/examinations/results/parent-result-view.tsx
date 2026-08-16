'use client'

import type { StudentResult, GradingScale, StudentAcademicProfile } from '@/types/result'
import { StudentAcademicDashboard } from './student-academic-dashboard'

interface Props {
  result?: StudentResult | null
  allResults?: StudentResult[]
  gradingScales?: GradingScale[]
  studentProfile?: StudentAcademicProfile | null
  childName?: string
}

export function ParentResultView({
  result,
  allResults = [],
  gradingScales = [],
  studentProfile,
  childName = 'Ward',
}: Props) {
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
      title={`Academic Grade &amp; Report Card — ${childName}`}
      subtitle={`Official examination records, scholastic performance, and grade progression for ${childName}.`}
    />
  )
}

