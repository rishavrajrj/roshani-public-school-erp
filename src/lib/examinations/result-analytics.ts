import type {
  StudentResult,
  GradingScale,
  StudentPerformanceAnalytics,
  ExamSummaryRow,
  SubjectPerformanceAnalysis,
  PerformanceTrendPoint,
  GradeDistributionItem,
  StudentAcademicProgression,
  DynamicInsight,
  ExamComparisonResult,
  SubjectComparisonRow,
  SubjectPerformanceHistory,
  SubjectHistoricalPoint,
  AcademicJourneyStep,
  AcademicPerformanceConfig,
} from '@/types/result'

/**
 * Default centralized configuration for Academic Performance Center.
 */
export const DEFAULT_ACADEMIC_PERFORMANCE_CONFIG: AcademicPerformanceConfig = {
  strongSubjectThreshold: 80.0,
  practiceSubjectThreshold: 70.0,
  stableTrendThreshold: 0.5,
  passingPercentage: 33.0,
  enableGpaDisplay: true,
  enableCgpaDisplay: true,
}

// Backward-compatible exports
export const STRONG_SUBJECT_PERCENTAGE_THRESHOLD = DEFAULT_ACADEMIC_PERFORMANCE_CONFIG.strongSubjectThreshold
export const PRACTICE_SUBJECT_PERCENTAGE_THRESHOLD = DEFAULT_ACADEMIC_PERFORMANCE_CONFIG.practiceSubjectThreshold
export const COMPARISON_STABLE_DELTA_THRESHOLD = DEFAULT_ACADEMIC_PERFORMANCE_CONFIG.stableTrendThreshold

/**
 * Helper to resolve letter grade and grade point from school grading scales or CBSE fallback.
 */
export function resolveGradeFromScale(
  percentage: number,
  gradingScales: GradingScale[] = []
): { grade: string; gradePoint: number } {
  if (gradingScales && gradingScales.length > 0) {
    for (const sc of gradingScales) {
      if (percentage >= sc.minPercentage && percentage <= sc.maxPercentage) {
        return { grade: sc.grade, gradePoint: sc.gradePoint }
      }
    }
  }
  // Standard CBSE 9-point scale fallback
  if (percentage >= 91) return { grade: 'A1', gradePoint: 10.0 }
  if (percentage >= 81) return { grade: 'A2', gradePoint: 9.0 }
  if (percentage >= 71) return { grade: 'B1', gradePoint: 8.0 }
  if (percentage >= 61) return { grade: 'B2', gradePoint: 7.0 }
  if (percentage >= 51) return { grade: 'C1', gradePoint: 6.0 }
  if (percentage >= 41) return { grade: 'C2', gradePoint: 5.0 }
  if (percentage >= 33) return { grade: 'D', gradePoint: 4.0 }
  return { grade: 'E', gradePoint: 0.0 }
}

/**
 * Compare two examinations (Exam A vs Exam B) with subject-by-subject delta
 * and overall summary metrics.
 */
export function compareExaminations(
  examA: StudentResult, // Base / Primary (e.g. Annual)
  examB: StudentResult, // Comparison Target / Baseline (e.g. Half-Yearly)
  gradingScales: GradingScale[] = [],
  config: AcademicPerformanceConfig = DEFAULT_ACADEMIC_PERFORMANCE_CONFIG
): ExamComparisonResult {
  const isSameExam = examA.id === examB.id || (examA.examinationId === examB.examinationId && examA.academicSessionId === examB.academicSessionId)
  const marksA = examA.subjectMarks || []
  const marksB = examB.subjectMarks || []

  // Create lookup map for Exam B by subject name / code
  const mapB = new Map<string, any>()
  marksB.forEach((sm) => {
    const key = (sm.subjectName || sm.subjectCode || '').toLowerCase().trim()
    if (key) mapB.set(key, sm)
  })

  const subjectComparisons: SubjectComparisonRow[] = []

  // Iterate over subjects in Exam A
  marksA.forEach((smA) => {
    const key = (smA.subjectName || smA.subjectCode || '').toLowerCase().trim()
    const maxA = smA.maximumMarks && smA.maximumMarks > 0 ? smA.maximumMarks : 100
    const obtA = Number(smA.totalMarksObtained || 0)
    const pctA = maxA > 0 ? Number(((obtA / maxA) * 100).toFixed(2)) : 0
    const gradeA = resolveGradeFromScale(pctA, gradingScales).grade

    const smB = mapB.get(key)
    const maxB = smB && smB.maximumMarks && smB.maximumMarks > 0 ? smB.maximumMarks : 100
    const obtB = smB ? Number(smB.totalMarksObtained || 0) : 0
    const pctB = smB ? (maxB > 0 ? Number(((obtB / maxB) * 100).toFixed(2)) : 0) : 0
    const gradeB = smB ? resolveGradeFromScale(pctB, gradingScales).grade : '—'

    const changeMarks = smB ? Number((obtA - obtB).toFixed(1)) : 0
    const changePercentage = smB ? Number((pctA - pctB).toFixed(2)) : 0

    let trend: 'up' | 'down' | 'neutral' = 'neutral'
    if (!isSameExam) {
      if (changePercentage > config.stableTrendThreshold) trend = 'up'
      else if (changePercentage < -config.stableTrendThreshold) trend = 'down'
    }

    subjectComparisons.push({
      subjectName: smA.subjectName || 'Subject',
      subjectCode: smA.subjectCode || '',
      examAMarks: obtA,
      examAMax: maxA,
      examAPercentage: pctA,
      examAGrade: gradeA,
      examBMarks: isSameExam ? obtA : obtB,
      examBMax: isSameExam ? maxA : maxB,
      examBPercentage: isSameExam ? pctA : pctB,
      examBGrade: isSameExam ? gradeA : gradeB,
      changeMarks: isSameExam ? 0 : changeMarks,
      changePercentage: isSameExam ? 0 : changePercentage,
      trend: isSameExam ? 'neutral' : trend,
    })
  })

  // Include subjects in Exam B but not in Exam A (only when different exams)
  if (!isSameExam) {
    marksB.forEach((smB) => {
      const key = (smB.subjectName || smB.subjectCode || '').toLowerCase().trim()
      const exists = marksA.some((smA) => (smA.subjectName || smA.subjectCode || '').toLowerCase().trim() === key)
      if (!exists) {
        const maxB = smB.maximumMarks && smB.maximumMarks > 0 ? smB.maximumMarks : 100
        const obtB = Number(smB.totalMarksObtained || 0)
        const pctB = maxB > 0 ? Number(((obtB / maxB) * 100).toFixed(2)) : 0
        const gradeB = resolveGradeFromScale(pctB, gradingScales).grade
        subjectComparisons.push({
          subjectName: smB.subjectName || 'Subject',
          subjectCode: smB.subjectCode || '',
          examAMarks: 0,
          examAMax: maxB,
          examAPercentage: 0,
          examAGrade: '—',
          examBMarks: obtB,
          examBMax: maxB,
          examBPercentage: pctB,
          examBGrade: gradeB,
          changeMarks: -obtB,
          changePercentage: -pctB,
          trend: 'down',
        })
      }
    })
  }

  const pctA = Number((examA.percentage || 0).toFixed(2))
  const pctB = isSameExam ? pctA : Number((examB.percentage || 0).toFixed(2))
  const percentageDelta = isSameExam ? 0 : Number((pctA - pctB).toFixed(2))

  const gpaA = Number((pctA / 10).toFixed(2))
  const gpaB = isSameExam ? gpaA : Number((pctB / 10).toFixed(2))
  const gpaDelta = isSameExam ? 0 : Number((gpaA - gpaB).toFixed(2))

  let trendDirection: 'up' | 'down' | 'neutral' = 'neutral'
  let trendStatusLabel = 'Stable'
  let summaryNarrative = ''

  if (isSameExam) {
    trendDirection = 'neutral'
    trendStatusLabel = 'Stable'
    summaryNarrative = `Baseline and comparison target are the same examination (${examA.examinationName}). Score is steady at ${pctA.toFixed(2)}%.`
  } else if (percentageDelta > config.stableTrendThreshold) {
    trendDirection = 'up'
    trendStatusLabel = 'Improving'
    summaryNarrative = `Overall percentage increased from ${pctB.toFixed(2)}% (${examB.examinationName}) to ${pctA.toFixed(2)}% (${examA.examinationName}), an improvement of ${Math.abs(percentageDelta).toFixed(2)} percentage points.`
  } else if (percentageDelta < -config.stableTrendThreshold) {
    trendDirection = 'down'
    trendStatusLabel = 'Declining'
    summaryNarrative = `Overall percentage decreased from ${pctB.toFixed(2)}% (${examB.examinationName}) to ${pctA.toFixed(2)}% (${examA.examinationName}), a change of ${percentageDelta.toFixed(2)} percentage points.`
  } else {
    trendDirection = 'neutral'
    trendStatusLabel = 'Stable'
    summaryNarrative = `Performance remained steady at ${pctA.toFixed(2)}% (within ±${config.stableTrendThreshold}% range) compared to ${examB.examinationName}.`
  }

  return {
    examAId: examA.examinationId,
    examAName: examA.examinationName || 'Primary Exam',
    examASession: examA.academicSessionName || '',
    examAClass: examA.className || '',
    examAPercentage: pctA,
    examAGrade: examA.grade || resolveGradeFromScale(pctA, gradingScales).grade,
    examAGpa: gpaA,
    examAResultStatus: examA.resultStatus,

    examBId: examB.examinationId,
    examBName: examB.examinationName || 'Comparison Exam',
    examBSession: examB.academicSessionName || '',
    examBClass: examB.className || '',
    examBPercentage: pctB,
    examBGrade: examB.grade || resolveGradeFromScale(pctB, gradingScales).grade,
    examBGpa: gpaB,
    examBResultStatus: examB.resultStatus,

    percentageDelta,
    gpaDelta,
    trendDirection,
    trendStatusLabel,
    summaryNarrative,
    subjectComparisons,
  }
}

/**
 * Extract multi-term historical performance trajectory for a specific subject.
 */
export function getSubjectPerformanceHistory(
  subjectNameOrId: string,
  results: StudentResult[],
  gradingScales: GradingScale[] = [],
  config: AcademicPerformanceConfig = DEFAULT_ACADEMIC_PERFORMANCE_CONFIG
): SubjectPerformanceHistory | null {
  if (!results || results.length === 0 || !subjectNameOrId) return null

  // Chronological order (oldest to newest)
  const chronological = [...results].reverse()
  const cleanTarget = subjectNameOrId.toLowerCase().trim()

  const historicalPoints: SubjectHistoricalPoint[] = []
  let subjectName = ''
  let subjectCode = ''
  let subjectId = ''

  chronological.forEach((res) => {
    const marks = res.subjectMarks || []
    const match = marks.find(
      (m) =>
        m.subjectId?.toLowerCase() === cleanTarget ||
        m.subjectName?.toLowerCase().trim() === cleanTarget ||
        m.subjectCode?.toLowerCase().trim() === cleanTarget
    )

    if (match) {
      subjectName = match.subjectName || subjectName
      subjectCode = match.subjectCode || subjectCode
      subjectId = match.subjectId || subjectId

      const maxM = match.maximumMarks && match.maximumMarks > 0 ? match.maximumMarks : 100
      const obtM = Number(match.totalMarksObtained || 0)
      const pct = maxM > 0 ? Number(((obtM / maxM) * 100).toFixed(1)) : 0
      const { grade, gradePoint } = resolveGradeFromScale(pct, gradingScales)

      historicalPoints.push({
        examinationId: res.examinationId,
        examinationName: res.examinationName || 'Exam',
        academicSessionName: res.academicSessionName || '',
        className: res.className || '',
        marksObtained: obtM,
        maximumMarks: maxM,
        percentage: pct,
        grade,
        gradePoint,
        isPass: match.isPass && match.attendanceStatus === 'present',
        publishedAt: res.publishedAt,
      })
    }
  })

  if (historicalPoints.length === 0) return null

  const latestPoint = historicalPoints[historicalPoints.length - 1]
  const previousPoint = historicalPoints.length > 1 ? historicalPoints[historicalPoints.length - 2] : null
  const oldestPoint = historicalPoints[0]

  const previousMarks = previousPoint ? previousPoint.marksObtained : null
  const previousPercentage = previousPoint ? previousPoint.percentage : null
  const changeMarks = previousPoint ? Number((latestPoint.marksObtained - previousPoint.marksObtained).toFixed(1)) : null
  const changePercentage = previousPoint ? Number((latestPoint.percentage - previousPoint.percentage).toFixed(1)) : null

  let trend: 'up' | 'down' | 'neutral' = 'neutral'
  if (changePercentage !== null) {
    if (changePercentage > config.stableTrendThreshold) trend = 'up'
    else if (changePercentage < -config.stableTrendThreshold) trend = 'down'
  }

  // Multi-period narrative
  let trendNarrative = ''
  if (historicalPoints.length > 1) {
    const netChange = Number((latestPoint.percentage - oldestPoint.percentage).toFixed(1))
    if (netChange > 0) {
      trendNarrative = `${subjectName} improved by ${netChange} percentage points (${oldestPoint.percentage}% → ${latestPoint.percentage}%) across ${historicalPoints.length} recorded evaluations.`
    } else if (netChange < 0) {
      trendNarrative = `${subjectName} changed by ${netChange} percentage points (${oldestPoint.percentage}% → ${latestPoint.percentage}%) across ${historicalPoints.length} recorded evaluations.`
    } else {
      trendNarrative = `${subjectName} maintained a steady score of ${latestPoint.percentage}% across ${historicalPoints.length} recorded evaluations.`
    }
  } else {
    trendNarrative = `First recorded evaluation for ${subjectName} with ${latestPoint.marksObtained}/${latestPoint.maximumMarks} marks (${latestPoint.percentage}%).`
  }

  return {
    subjectId: subjectId || cleanTarget,
    subjectName: subjectName || 'Subject',
    subjectCode,
    currentMarks: latestPoint.marksObtained,
    maximumMarks: latestPoint.maximumMarks,
    percentage: latestPoint.percentage,
    grade: latestPoint.grade,
    gradePoint: latestPoint.gradePoint,
    previousMarks,
    previousPercentage,
    changeMarks,
    changePercentage,
    trend,
    historicalPoints,
    trendNarrative,
  }
}

/**
 * Pure deterministic performance analytics computation engine.
 */
export function calculateStudentPerformanceAnalytics(
  results: StudentResult[],
  gradingScales: GradingScale[] = [],
  customConfig?: Partial<AcademicPerformanceConfig>
): StudentPerformanceAnalytics {
  const config: AcademicPerformanceConfig = {
    ...DEFAULT_ACADEMIC_PERFORMANCE_CONFIG,
    ...(customConfig || {}),
  }

  if (!results || results.length === 0) {
    return {
      overallPercentage: 0,
      overallGrade: '—',
      overallGpa: 0,
      overallCgpa: 0,
      totalMarksObtained: 0,
      totalMaximumMarks: 0,
      totalSubjectsCount: 0,
      subjectsPassedCount: 0,
      subjectsFailedCount: 0,
      overallResultStatus: 'PASS',
      hasTrend: false,
      trendPercentageDelta: 0,
      trendDirection: 'neutral',
      trendSummaryText: 'No examination result is available yet.',
      currentPercentage: 0,
      previousPercentage: null,
      improvementDelta: null,
      strongSubjects: [],
      practiceSubjects: [],
      allSubjectScores: [],
      trendPoints: [],
      gradeDistribution: [],
      academicProgression: [],
      academicJourney: [],
      dynamicInsights: [],
      examSummaries: [],
      config,
    }
  }

  // Sort chronological (oldest to newest) for trend progression, and newest first for latest overview
  const chronological = [...results].reverse()
  const latestResult = results[0]
  const previousResult = results.length > 1 ? results[1] : null

  // 1. Build Exam Summary Rows & Academic Journey
  const examSummaries: ExamSummaryRow[] = results.map((r, idx) => {
    const marks = r.subjectMarks || []
    const failedSubjects: string[] = []
    let totalGradePoints = 0

    marks.forEach((sm) => {
      const maxM = sm.maximumMarks && sm.maximumMarks > 0 ? sm.maximumMarks : 100
      const obtM = Number(sm.totalMarksObtained || 0)
      const sPct = maxM > 0 ? (obtM / maxM) * 100 : 0
      const { gradePoint } = resolveGradeFromScale(sPct, gradingScales)
      totalGradePoints += gradePoint
      if (!sm.isPass || sm.attendanceStatus === 'absent') {
        failedSubjects.push(sm.subjectName || sm.subjectCode || 'Subject')
      }
    })

    const sgpa = marks.length > 0
      ? Number((totalGradePoints / marks.length).toFixed(2))
      : Number(((r.percentage || 0) / 10).toFixed(2))

    const sessionStr = r.academicSessionName || '2025–26'
    const classStr = r.className || 'Class 10'
    const examStr = r.examinationName || 'Examination'

    return {
      index: idx + 1,
      resultId: r.id,
      examinationId: r.examinationId,
      examinationName: examStr,
      examinationCode: r.examinationCode,
      academicSessionName: sessionStr,
      className: classStr,
      sectionName: r.sectionName,
      formattedYearClassExam: `${sessionStr} | ${classStr} | ${examStr}`,
      percentage: Number((r.percentage || 0).toFixed(2)),
      sgpa,
      totalMarksObtained: Number(r.totalMarksObtained || 0),
      maximumMarks: Number(r.maximumMarks || 0),
      backPaperCount: failedSubjects.length,
      backPapers: failedSubjects,
      resultStatus: r.resultStatus,
      grade: r.grade || resolveGradeFromScale(r.percentage || 0, gradingScales).grade,
      publishedAt: r.publishedAt,
    }
  })

  // Build Academic Journey Steps (chronological order)
  const academicJourney: AcademicJourneyStep[] = chronological.map((r, idx) => {
    const sgpa = Number(((r.percentage || 0) / 10).toFixed(2))
    return {
      index: idx + 1,
      resultId: r.id,
      examinationId: r.examinationId,
      examinationName: r.examinationName || 'Exam',
      academicSession: r.academicSessionName || '2025–26',
      classLevel: r.className || 'Class',
      sectionName: r.sectionName,
      percentage: Number((r.percentage || 0).toFixed(2)),
      grade: r.grade || resolveGradeFromScale(r.percentage || 0, gradingScales).grade,
      sgpa,
      resultStatus: r.resultStatus,
      isCurrent: r.id === latestResult.id,
      publishedAt: r.publishedAt,
    }
  })

  // 2. Subject Evaluation Breakdown for Latest Exam
  const latestMarks = latestResult.subjectMarks || []
  let totalPassed = 0
  let totalFailed = 0

  const allSubjectScores: SubjectPerformanceAnalysis[] = latestMarks.map((sm) => {
    const maxM = sm.maximumMarks && sm.maximumMarks > 0 ? sm.maximumMarks : 100
    const obtM = Number(sm.totalMarksObtained || 0)
    const pct = maxM > 0 ? Number(((obtM / maxM) * 100).toFixed(1)) : 0
    const { grade, gradePoint } = resolveGradeFromScale(pct, gradingScales)
    const isPass = sm.isPass && sm.attendanceStatus === 'present'
    if (isPass) totalPassed++
    else totalFailed++

    return {
      subjectId: sm.subjectId,
      subjectName: sm.subjectName || 'Subject',
      subjectCode: sm.subjectCode || '',
      obtainedMarks: obtM,
      maximumMarks: maxM,
      percentage: pct,
      grade,
      gradePoint,
      isPass,
      attendanceStatus: sm.attendanceStatus,
      theoryMarks: Number(sm.theoryMarksObtained || 0),
      practicalMarks: Number(sm.practicalMarksObtained || 0),
      internalMarks: Number(sm.internalMarksObtained || 0),
    }
  })

  // Sort subjects by percentage descending
  const sortedSubjects = [...allSubjectScores].sort((a, b) => b.percentage - a.percentage)

  // Identify Strong Subjects (>= Configured Strong Threshold)
  const strongSubjects = sortedSubjects.filter((s) => s.percentage >= config.strongSubjectThreshold && s.isPass)
  const effectiveStrongSubjects = strongSubjects.length > 0
    ? strongSubjects
    : sortedSubjects.slice(0, Math.min(2, sortedSubjects.length))

  // Identify Practice Subjects (Respectfully: "Needs More Practice" e.g. < Practice Threshold or failed)
  const practiceSubjects = sortedSubjects.filter((s) => !s.isPass || s.percentage < config.practiceSubjectThreshold)
  const effectivePracticeSubjects = practiceSubjects.length > 0
    ? practiceSubjects
    : sortedSubjects.slice(-Math.min(2, sortedSubjects.length)).filter((s) => s.percentage < 85)

  // 3. Trend Progression Points across Historical Examinations
  const trendPoints: PerformanceTrendPoint[] = chronological.map((r) => {
    const sgpa = Number(((r.percentage || 0) / 10).toFixed(2))
    return {
      examinationId: r.examinationId,
      examinationName: r.examinationName || 'Exam',
      academicSessionName: r.academicSessionName || '',
      className: r.className || '',
      percentage: Number((r.percentage || 0).toFixed(1)),
      grade: r.grade || resolveGradeFromScale(r.percentage || 0, gradingScales).grade,
      sgpa,
      publishedAt: r.publishedAt,
    }
  })

  // 4. Trend Calculation (Latest vs Previous)
  let hasTrend = false
  let trendPercentageDelta = 0
  let trendDirection: 'up' | 'down' | 'neutral' = 'neutral'
  let trendSummaryText = 'Performance trend will appear after the next examination.'
  let previousPercentage: number | null = null
  let improvementDelta: number | null = null

  if (previousResult) {
    hasTrend = true
    previousPercentage = Number((previousResult.percentage || 0).toFixed(2))
    improvementDelta = Number(((latestResult.percentage || 0) - previousPercentage).toFixed(2))
    trendPercentageDelta = Math.abs(improvementDelta)

    if (improvementDelta > config.stableTrendThreshold) {
      trendDirection = 'up'
      trendSummaryText = `📈 Overall percentage increased from ${previousPercentage.toFixed(2)}% to ${(latestResult.percentage || 0).toFixed(2)}%, an improvement of ${trendPercentageDelta.toFixed(2)} percentage points.`
    } else if (improvementDelta < -config.stableTrendThreshold) {
      trendDirection = 'down'
      trendSummaryText = `📉 Overall percentage decreased from ${previousPercentage.toFixed(2)}% to ${(latestResult.percentage || 0).toFixed(2)}%, a change of -${trendPercentageDelta.toFixed(2)} percentage points.`
    } else {
      trendDirection = 'neutral'
      trendSummaryText = `⚖️ Performance remained steady (within ±${config.stableTrendThreshold}%) compared with the previous examination.`
    }
  }

  // 5. Grade Distribution (across latest marks)
  const gradeCountMap = new Map<string, { count: number; subjects: string[]; gradePoint: number; desc?: string | null }>()
  for (const s of allSubjectScores) {
    const existing = gradeCountMap.get(s.grade) || { count: 0, subjects: [], gradePoint: s.gradePoint, desc: null }
    existing.count += 1
    existing.subjects.push(s.subjectName)
    gradeCountMap.set(s.grade, existing)
  }

  const gradeDistribution: GradeDistributionItem[] = []
  const totalSub = allSubjectScores.length || 1
  gradeCountMap.forEach((val, key) => {
    gradeDistribution.push({
      grade: key,
      count: val.count,
      percentageOfTotal: Number(((val.count / totalSub) * 100).toFixed(1)),
      subjects: val.subjects,
      gradePoint: val.gradePoint,
      description: val.desc,
    })
  })
  gradeDistribution.sort((a, b) => b.gradePoint - a.gradePoint)

  // 6. Academic Progression (grouped by Class)
  const classProgressionMap = new Map<string, { session: string; totalPct: number; count: number; status: string; isCurrent: boolean }>()
  for (const r of chronological) {
    const cls = r.className || 'Class'
    const currentEntry = classProgressionMap.get(cls) || {
      session: r.academicSessionName || '2025–26',
      totalPct: 0,
      count: 0,
      status: r.resultStatus,
      isCurrent: r.id === latestResult.id,
    }
    currentEntry.totalPct += r.percentage || 0
    currentEntry.count += 1
    if (r.resultStatus === 'FAIL') currentEntry.status = 'FAIL'
    if (r.id === latestResult.id) currentEntry.isCurrent = true
    classProgressionMap.set(cls, currentEntry)
  }

  const academicProgression: StudentAcademicProgression[] = []
  classProgressionMap.forEach((val, key) => {
    const avgPct = Number((val.totalPct / val.count).toFixed(2))
    academicProgression.push({
      classLevel: key,
      academicSession: val.session,
      percentage: avgPct,
      gpa: Number((avgPct / 10).toFixed(2)),
      creditsRegistered: 20,
      creditsEarned: val.status === 'PASS' ? 20 : 16,
      resultStatus: val.status,
      isCurrent: val.isCurrent,
    })
  })

  // 7. Transparent, Data-Driven Insights Generation
  const dynamicInsights: DynamicInsight[] = []

  // Top Subject Insight (Strict Data Values)
  if (sortedSubjects.length > 0) {
    const topSub = sortedSubjects[0]
    dynamicInsights.push({
      id: 'top-subject',
      type: 'positive',
      title: 'Strongest Performing Subject',
      description: `${topSub.subjectName} is the highest-scoring subject with ${topSub.percentage}% (${topSub.obtainedMarks}/${topSub.maximumMarks} marks, Grade ${topSub.grade}).`,
      icon: '🏆',
    })
  }

  // Trend Insight (Exact Percentages & Delta)
  if (hasTrend && improvementDelta !== null && previousPercentage !== null) {
    if (improvementDelta > config.stableTrendThreshold) {
      dynamicInsights.push({
        id: 'trend-positive',
        type: 'positive',
        title: 'Measurable Academic Growth',
        description: `Overall percentage increased from ${previousPercentage.toFixed(2)}% to ${(latestResult.percentage || 0).toFixed(2)}%, an improvement of ${improvementDelta.toFixed(2)} percentage points.`,
        icon: '📈',
      })
    } else if (improvementDelta < -config.stableTrendThreshold) {
      dynamicInsights.push({
        id: 'trend-focus',
        type: 'attention',
        title: 'Targeted Review Needed',
        description: `Overall score decreased from ${previousPercentage.toFixed(2)}% to ${(latestResult.percentage || 0).toFixed(2)}% (${improvementDelta.toFixed(2)} percentage points). Targeted revision is recommended.`,
        icon: '🎯',
      })
    } else {
      dynamicInsights.push({
        id: 'trend-steady',
        type: 'consistency',
        title: 'Stable Academic Trajectory',
        description: `Performance remained steady at ${(latestResult.percentage || 0).toFixed(2)}% (within a ${Math.abs(improvementDelta).toFixed(2)}% variation) compared to the previous examination.`,
        icon: '⚖️',
      })
    }
  }

  // Consistency Insight: Enforce minimum 3 distinct evaluations requirement
  if (chronological.length >= 3) {
    const last3Pcts = chronological.slice(-3).map((r) => r.percentage || 0)
    const maxVal = Math.max(...last3Pcts)
    const minVal = Math.min(...last3Pcts)
    const range = Number((maxVal - minVal).toFixed(1))
    if (range <= 5) {
      dynamicInsights.push({
        id: 'multi-exam-consistency',
        type: 'consistency',
        title: 'High Record Consistency',
        description: `Performance remained within a ${range}-percentage-point range across the last 3 examinations.`,
        icon: '📊',
      })
    }
  }

  // Subject-specific improvement/practice insight
  if (previousResult && latestMarks.length > 0) {
    const prevMarksMap = new Map<string, number>()
    ;(previousResult.subjectMarks || []).forEach((m) => {
      const k = (m.subjectName || m.subjectCode || '').toLowerCase().trim()
      const maxM = m.maximumMarks && m.maximumMarks > 0 ? m.maximumMarks : 100
      const obtM = Number(m.totalMarksObtained || 0)
      const pct = maxM > 0 ? (obtM / maxM) * 100 : 0
      prevMarksMap.set(k, pct)
    })

    let biggestGain = { subject: '', delta: 0, from: 0, to: 0 }
    let biggestDrop = { subject: '', delta: 0, from: 0, to: 0 }

    latestMarks.forEach((m) => {
      const k = (m.subjectName || m.subjectCode || '').toLowerCase().trim()
      const prevPct = prevMarksMap.get(k)
      if (prevPct !== undefined) {
        const maxM = m.maximumMarks && m.maximumMarks > 0 ? m.maximumMarks : 100
        const obtM = Number(m.totalMarksObtained || 0)
        const currPct = maxM > 0 ? (obtM / maxM) * 100 : 0
        const delta = currPct - prevPct
        if (delta > biggestGain.delta) {
          biggestGain = { subject: m.subjectName || 'Subject', delta, from: prevPct, to: currPct }
        }
        if (delta < biggestDrop.delta) {
          biggestDrop = { subject: m.subjectName || 'Subject', delta, from: prevPct, to: currPct }
        }
      }
    })

    if (biggestGain.delta >= 3) {
      dynamicInsights.push({
        id: 'subject-gain',
        type: 'positive',
        title: 'Subject Improvement',
        description: `${biggestGain.subject} improved from ${biggestGain.from.toFixed(1)}% to ${biggestGain.to.toFixed(1)}% (+${biggestGain.delta.toFixed(1)}%) compared with the previous examination.`,
        icon: '✨',
      })
    }

    if (biggestDrop.delta <= -3) {
      dynamicInsights.push({
        id: 'subject-drop',
        type: 'attention',
        title: 'Subject Attention Area',
        description: `${biggestDrop.subject} decreased from ${biggestDrop.from.toFixed(1)}% to ${biggestDrop.to.toFixed(1)}% (${biggestDrop.delta.toFixed(1)}%) compared with the previous examination.`,
        icon: '📌',
      })
    }
  }

  // 100% Subject Clearance Insight
  if (totalFailed === 0 && latestMarks.length > 0) {
    dynamicInsights.push({
      id: 'all-clear',
      type: 'positive',
      title: 'Full Subject Clearance',
      description: `Cleared all ${latestMarks.length} assessed subjects with zero back papers.`,
      icon: '✅',
    })
  }

  // Overall GPA & CGPA calculation
  const overallGpa = examSummaries.length > 0 ? examSummaries[0].sgpa : Number(((latestResult.percentage || 0) / 10).toFixed(2))
  const sumSgpa = examSummaries.reduce((acc, curr) => acc + curr.sgpa, 0)
  const overallCgpa = examSummaries.length > 0 ? Number((sumSgpa / examSummaries.length).toFixed(2)) : overallGpa

  return {
    overallPercentage: Number((latestResult.percentage || 0).toFixed(2)),
    overallGrade: latestResult.grade || resolveGradeFromScale(latestResult.percentage || 0, gradingScales).grade,
    overallGpa,
    overallCgpa,
    totalMarksObtained: Number(latestResult.totalMarksObtained || 0),
    totalMaximumMarks: Number(latestResult.maximumMarks || 0),
    totalSubjectsCount: latestMarks.length,
    subjectsPassedCount: totalPassed,
    subjectsFailedCount: totalFailed,
    overallResultStatus: latestResult.resultStatus,
    hasTrend,
    trendPercentageDelta,
    trendDirection,
    trendSummaryText,
    currentPercentage: Number((latestResult.percentage || 0).toFixed(2)),
    previousPercentage,
    improvementDelta,
    strongSubjects: effectiveStrongSubjects,
    practiceSubjects: effectivePracticeSubjects,
    allSubjectScores,
    trendPoints,
    gradeDistribution,
    academicProgression,
    academicJourney,
    dynamicInsights,
    examSummaries,
    config,
  }
}
