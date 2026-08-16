import { describe, it, expect } from 'vitest'
import {
  calculateStudentPerformanceAnalytics,
  compareExaminations,
  getSubjectPerformanceHistory,
  resolveGradeFromScale,
  DEFAULT_ACADEMIC_PERFORMANCE_CONFIG,
} from '@/lib/examinations/result-analytics'
import type { StudentResult, GradingScale, StudentMark, AcademicPerformanceConfig } from '@/types/result'

describe('Result Module Security & Data Integrity Audit Suite', () => {
  const sampleGradingScales: GradingScale[] = [
    { id: '1', schoolId: 'school-1', name: 'A1', minPercentage: 91, maxPercentage: 100, grade: 'A1', gradePoint: 10, description: 'Outstanding' },
    { id: '2', schoolId: 'school-1', name: 'A2', minPercentage: 81, maxPercentage: 90.99, grade: 'A2', gradePoint: 9, description: 'Excellent' },
    { id: '3', schoolId: 'school-1', name: 'B1', minPercentage: 71, maxPercentage: 80.99, grade: 'B1', gradePoint: 8, description: 'Very Good' },
    { id: '4', schoolId: 'school-1', name: 'B2', minPercentage: 61, maxPercentage: 70.99, grade: 'B2', gradePoint: 7, description: 'Good' },
    { id: '5', schoolId: 'school-1', name: 'C1', minPercentage: 51, maxPercentage: 60.99, grade: 'C1', gradePoint: 6, description: 'Above Average' },
    { id: '6', schoolId: 'school-1', name: 'C2', minPercentage: 41, maxPercentage: 50.99, grade: 'C2', gradePoint: 5, description: 'Average' },
    { id: '7', schoolId: 'school-1', name: 'D',  minPercentage: 33, maxPercentage: 40.99, grade: 'D',  gradePoint: 4, description: 'Pass' },
    { id: '8', schoolId: 'school-1', name: 'E',  minPercentage: 0,  maxPercentage: 32.99, grade: 'E',  gradePoint: 0, description: 'Essential Repeat' },
  ]

  const mockMarksA: StudentMark[] = [
    {
      schoolId: 'school-1', academicSessionId: 'sess-1', examinationId: 'exam-1', studentId: 'student-A',
      classId: 'c-10', subjectId: 'sub-math', subjectName: 'Mathematics', subjectCode: 'M101',
      attendanceStatus: 'present', theoryMarksObtained: 85, practicalMarksObtained: 0, internalMarksObtained: 0,
      totalMarksObtained: 85, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 'school-1', academicSessionId: 'sess-1', examinationId: 'exam-1', studentId: 'student-A',
      classId: 'c-10', subjectId: 'sub-sci', subjectName: 'Science', subjectCode: 'S101',
      attendanceStatus: 'present', theoryMarksObtained: 70, practicalMarksObtained: 20, internalMarksObtained: 0,
      totalMarksObtained: 90, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
  ]

  const mockResultA: StudentResult = {
    id: 'res-1',
    schoolId: 'school-1',
    academicSessionId: 'sess-1',
    academicSessionName: '2025–26',
    examinationId: 'exam-1',
    examinationName: 'Annual Examination',
    studentId: 'student-A',
    studentName: 'Aarav Sharma',
    admissionNumber: 'RPS-001',
    rollNumber: '101',
    className: 'Class 10',
    sectionName: 'A',
    classId: 'c-10',
    totalMarksObtained: 175,
    maximumMarks: 200,
    percentage: 87.5,
    resultStatus: 'PASS',
    grade: 'A2',
    status: 'published',
    financialClearanceStatus: 'CLEAR',
    financialOutstandingAmount: 0,
    financialOverride: false,
    version: 1,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    publishedAt: '2026-03-01T12:00:00Z',
    subjectMarks: mockMarksA,
  }

  it('1. Zero Maximum Marks Protection: should never produce NaN or Infinity', () => {
    const zeroMaxMark: StudentMark = {
      schoolId: 'school-1', academicSessionId: 'sess-1', examinationId: 'exam-0', studentId: 'student-A',
      classId: 'c-10', subjectId: 'sub-art', subjectName: 'Art & Craft',
      attendanceStatus: 'present', theoryMarksObtained: 0, practicalMarksObtained: 0, internalMarksObtained: 0,
      totalMarksObtained: 0, maximumMarks: 0, isPass: true, status: 'locked', createdBy: 't1'
    }

    const zeroMaxResult: StudentResult = {
      ...mockResultA,
      totalMarksObtained: 0,
      maximumMarks: 0,
      percentage: 0,
      subjectMarks: [zeroMaxMark],
    }

    const analytics = calculateStudentPerformanceAnalytics([zeroMaxResult], sampleGradingScales)
    expect(Number.isNaN(analytics.overallPercentage)).toBe(false)
    expect(Number.isFinite(analytics.overallPercentage)).toBe(true)
    expect(analytics.overallPercentage).toBe(0)
    expect(analytics.allSubjectScores[0].percentage).toBe(0)
  })

  it('2. Absent Handling: should record absent marks with pass = false without crashing', () => {
    const absentMark: StudentMark = {
      schoolId: 'school-1', academicSessionId: 'sess-1', examinationId: 'exam-abs', studentId: 'student-A',
      classId: 'c-10', subjectId: 'sub-eng', subjectName: 'English',
      attendanceStatus: 'absent', theoryMarksObtained: 0, practicalMarksObtained: 0, internalMarksObtained: 0,
      totalMarksObtained: 0, maximumMarks: 100, isPass: false, status: 'locked', createdBy: 't1'
    }

    const absentResult: StudentResult = {
      ...mockResultA,
      subjectMarks: [absentMark],
      resultStatus: 'FAIL',
    }

    const analytics = calculateStudentPerformanceAnalytics([absentResult], sampleGradingScales)
    expect(analytics.subjectsFailedCount).toBe(1)
    expect(analytics.subjectsPassedCount).toBe(0)
    expect(analytics.examSummaries[0].backPaperCount).toBe(1)
    expect(analytics.examSummaries[0].backPapers).toContain('English')
  })

  it('3. Consistency Analysis: requires at least 3 distinct evaluations before generating consistency insight', () => {
    // 2 exams: Consistency insight must NOT be generated
    const exam2: StudentResult = {
      ...mockResultA,
      id: 'res-2',
      examinationId: 'exam-2',
      examinationName: 'Half-Yearly',
      percentage: 86.0,
    }

    const analyticsTwoExams = calculateStudentPerformanceAnalytics([mockResultA, exam2], sampleGradingScales)
    const consistencyInsightTwo = analyticsTwoExams.dynamicInsights.find((i) => i.id === 'multi-exam-consistency')
    expect(consistencyInsightTwo).toBeUndefined()

    // 3 exams with close scores (87.5%, 86.0%, 88.0% -> range 2.0% <= 5%): Consistency insight MUST be generated
    const exam3: StudentResult = {
      ...mockResultA,
      id: 'res-3',
      examinationId: 'exam-3',
      examinationName: 'Quarterly',
      percentage: 88.0,
    }

    const analyticsThreeExams = calculateStudentPerformanceAnalytics([mockResultA, exam2, exam3], sampleGradingScales)
    const consistencyInsightThree = analyticsThreeExams.dynamicInsights.find((i) => i.id === 'multi-exam-consistency')
    expect(consistencyInsightThree).toBeDefined()
    expect(consistencyInsightThree?.description).toContain('range across the last 3 examinations')
  })

  it('4. Configurable Thresholds: should apply custom strong/practice thresholds and stable delta', () => {
    const customConfig: Partial<AcademicPerformanceConfig> = {
      strongSubjectThreshold: 92.0, // High benchmark: only >= 92% qualifies as strong
      practiceSubjectThreshold: 88.0, // Subjects < 88% need practice
      stableTrendThreshold: 1.0, // Stable delta range is ±1.0%
    }

    const analytics = calculateStudentPerformanceAnalytics([mockResultA], sampleGradingScales, customConfig)
    
    // Mathematics scored 85% (< 92%), Science scored 90% (< 92%)
    // With 92% threshold, neither is naturally strong (fallback top subject used)
    expect(analytics.config?.strongSubjectThreshold).toBe(92.0)
    expect(analytics.config?.practiceSubjectThreshold).toBe(88.0)
    expect(analytics.config?.stableTrendThreshold).toBe(1.0)
  })

  it('5. Same-Exam Comparison: comparing an examination with itself produces zero delta and stable status', () => {
    const comparison = compareExaminations(mockResultA, mockResultA, sampleGradingScales)
    expect(comparison.percentageDelta).toBe(0)
    expect(comparison.gpaDelta).toBe(0)
    expect(comparison.trendDirection).toBe('neutral')
    expect(comparison.trendStatusLabel).toBe('Stable')
    expect(comparison.subjectComparisons.every((s) => s.changeMarks === 0)).toBe(true)
    expect(comparison.subjectComparisons.every((s) => s.trend === 'neutral')).toBe(true)
  })

  it('6. Different Maximum Marks Comparison: compares percentage points accurately', () => {
    // Exam A: 45/50 (90%)
    const markExamA: StudentMark = {
      schoolId: 'school-1', academicSessionId: 'sess-1', examinationId: 'exam-a', studentId: 'student-A',
      classId: 'c-10', subjectId: 'sub-math', subjectName: 'Mathematics',
      attendanceStatus: 'present', theoryMarksObtained: 45, practicalMarksObtained: 0, internalMarksObtained: 0,
      totalMarksObtained: 45, maximumMarks: 50, isPass: true, status: 'locked', createdBy: 't1'
    }
    const resultExamA: StudentResult = {
      ...mockResultA,
      id: 'res-a',
      examinationId: 'exam-a',
      percentage: 90.0,
      subjectMarks: [markExamA],
    }

    // Exam B: 80/100 (80%)
    const markExamB: StudentMark = {
      schoolId: 'school-1', academicSessionId: 'sess-1', examinationId: 'exam-b', studentId: 'student-A',
      classId: 'c-10', subjectId: 'sub-math', subjectName: 'Mathematics',
      attendanceStatus: 'present', theoryMarksObtained: 80, practicalMarksObtained: 0, internalMarksObtained: 0,
      totalMarksObtained: 80, maximumMarks: 100, isPass: true, status: 'locked', createdBy: 't1'
    }
    const resultExamB: StudentResult = {
      ...mockResultA,
      id: 'res-b',
      examinationId: 'exam-b',
      percentage: 80.0,
      subjectMarks: [markExamB],
    }

    const comparison = compareExaminations(resultExamA, resultExamB, sampleGradingScales)
    const mathRow = comparison.subjectComparisons.find((s) => s.subjectName === 'Mathematics')
    
    expect(mathRow).toBeDefined()
    expect(mathRow?.examAMarks).toBe(45)
    expect(mathRow?.examAMax).toBe(50)
    expect(mathRow?.examAPercentage).toBe(90.0)
    expect(mathRow?.examBMarks).toBe(80)
    expect(mathRow?.examBMax).toBe(100)
    expect(mathRow?.examBPercentage).toBe(80.0)
    expect(mathRow?.changePercentage).toBe(10.0)
    expect(mathRow?.trend).toBe('up')
  })

  it('7. Default Centralized Configuration matches institutional standard values', () => {
    expect(DEFAULT_ACADEMIC_PERFORMANCE_CONFIG.strongSubjectThreshold).toBe(80.0)
    expect(DEFAULT_ACADEMIC_PERFORMANCE_CONFIG.practiceSubjectThreshold).toBe(70.0)
    expect(DEFAULT_ACADEMIC_PERFORMANCE_CONFIG.stableTrendThreshold).toBe(0.5)
    expect(DEFAULT_ACADEMIC_PERFORMANCE_CONFIG.passingPercentage).toBe(33.0)
    expect(DEFAULT_ACADEMIC_PERFORMANCE_CONFIG.enableGpaDisplay).toBe(true)
    expect(DEFAULT_ACADEMIC_PERFORMANCE_CONFIG.enableCgpaDisplay).toBe(true)
  })
})
