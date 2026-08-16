import { describe, it, expect } from 'vitest'
import {
  compareExaminations,
  getSubjectPerformanceHistory,
  calculateStudentPerformanceAnalytics,
  resolveGradeFromScale,
} from '@/lib/examinations/result-analytics'
import type { StudentResult, GradingScale, StudentMark } from '@/types/result'

describe('Result & Academic Performance Center — V2 Features Test Suite', () => {
  const mockGradingScales: GradingScale[] = [
    { id: '1', schoolId: 's1', name: 'A1', minPercentage: 91, maxPercentage: 100, grade: 'A1', gradePoint: 10, description: 'Outstanding' },
    { id: '2', schoolId: 's1', name: 'A2', minPercentage: 81, maxPercentage: 90.99, grade: 'A2', gradePoint: 9, description: 'Excellent' },
    { id: '3', schoolId: 's1', name: 'B1', minPercentage: 71, maxPercentage: 80.99, grade: 'B1', gradePoint: 8, description: 'Very Good' },
    { id: '4', schoolId: 's1', name: 'B2', minPercentage: 61, maxPercentage: 70.99, grade: 'B2', gradePoint: 7, description: 'Good' },
    { id: '5', schoolId: 's1', name: 'C1', minPercentage: 51, maxPercentage: 60.99, grade: 'C1', gradePoint: 6, description: 'Above Average' },
    { id: '6', schoolId: 's1', name: 'C2', minPercentage: 41, maxPercentage: 50.99, grade: 'C2', gradePoint: 5, description: 'Average' },
    { id: '7', schoolId: 's1', name: 'D',  minPercentage: 33, maxPercentage: 40.99, grade: 'D',  gradePoint: 4, description: 'Pass' },
    { id: '8', schoolId: 's1', name: 'E',  minPercentage: 0,  maxPercentage: 32.99, grade: 'E',  gradePoint: 0, description: 'Essential Repeat' },
  ]

  const mockMarksAnnual: StudentMark[] = [
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-annual', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-math', subjectName: 'Mathematics', subjectCode: 'MATH101',
      attendanceStatus: 'present', theoryMarksObtained: 80, practicalMarksObtained: 0, internalMarksObtained: 8,
      totalMarksObtained: 88, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-annual', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-sci', subjectName: 'Science', subjectCode: 'SCI101',
      attendanceStatus: 'present', theoryMarksObtained: 60, practicalMarksObtained: 25, internalMarksObtained: 0,
      totalMarksObtained: 85, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-annual', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-eng', subjectName: 'English', subjectCode: 'ENG101',
      attendanceStatus: 'present', theoryMarksObtained: 74, practicalMarksObtained: 0, internalMarksObtained: 10,
      totalMarksObtained: 84, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
  ]

  const mockMarksHalfYearly: StudentMark[] = [
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-hy', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-math', subjectName: 'Mathematics', subjectCode: 'MATH101',
      attendanceStatus: 'present', theoryMarksObtained: 70, practicalMarksObtained: 0, internalMarksObtained: 8,
      totalMarksObtained: 78, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-hy', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-sci', subjectName: 'Science', subjectCode: 'SCI101',
      attendanceStatus: 'present', theoryMarksObtained: 58, practicalMarksObtained: 24, internalMarksObtained: 0,
      totalMarksObtained: 82, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-hy', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-eng', subjectName: 'English', subjectCode: 'ENG101',
      attendanceStatus: 'present', theoryMarksObtained: 76, practicalMarksObtained: 0, internalMarksObtained: 10,
      totalMarksObtained: 86, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
  ]

  const mockResultAnnual: StudentResult = {
    id: 'res-annual',
    schoolId: 's1',
    academicSessionId: 'sess-1',
    academicSessionName: '2025–26',
    examinationId: 'exam-annual',
    examinationName: 'Annual Examination',
    studentId: 'stud-1',
    studentName: 'Rishav Raj',
    admissionNumber: 'RPS-1024',
    rollNumber: '1024',
    className: 'Class 10',
    sectionName: 'A',
    classId: 'c-10',
    totalMarksObtained: 257,
    maximumMarks: 300,
    percentage: 85.67,
    resultStatus: 'PASS',
    grade: 'A2',
    status: 'published',
    financialClearanceStatus: 'CLEAR',
    financialOutstandingAmount: 0,
    financialOverride: false,
    version: 1,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    publishedAt: '2026-03-15T12:00:00Z',
    subjectMarks: mockMarksAnnual,
  }

  const mockResultHalfYearly: StudentResult = {
    id: 'res-hy',
    schoolId: 's1',
    academicSessionId: 'sess-1',
    academicSessionName: '2025–26',
    examinationId: 'exam-hy',
    examinationName: 'Half-Yearly Examination',
    studentId: 'stud-1',
    studentName: 'Rishav Raj',
    admissionNumber: 'RPS-1024',
    rollNumber: '1024',
    className: 'Class 10',
    sectionName: 'A',
    classId: 'c-10',
    totalMarksObtained: 246,
    maximumMarks: 300,
    percentage: 82.0,
    resultStatus: 'PASS',
    grade: 'A2',
    status: 'published',
    financialClearanceStatus: 'CLEAR',
    financialOutstandingAmount: 0,
    financialOverride: false,
    version: 1,
    createdAt: '2025-10-15T10:00:00Z',
    updatedAt: '2025-10-15T10:00:00Z',
    publishedAt: '2025-10-15T12:00:00Z',
    subjectMarks: mockMarksHalfYearly,
  }

  it('1. should perform subject-level comparison correctly between Exam A and Exam B', () => {
    const comparison = compareExaminations(mockResultAnnual, mockResultHalfYearly, mockGradingScales)
    
    // Mathematics: 78 (Exam B) -> 88 (Exam A) = +10, up
    const mathRow = comparison.subjectComparisons.find((s) => s.subjectName === 'Mathematics')
    expect(mathRow).toBeDefined()
    expect(mathRow?.examBMarks).toBe(78)
    expect(mathRow?.examAMarks).toBe(88)
    expect(mathRow?.changeMarks).toBe(10)
    expect(mathRow?.trend).toBe('up')

    // Science: 82 (Exam B) -> 85 (Exam A) = +3, up
    const sciRow = comparison.subjectComparisons.find((s) => s.subjectName === 'Science')
    expect(sciRow).toBeDefined()
    expect(sciRow?.examBMarks).toBe(82)
    expect(sciRow?.examAMarks).toBe(85)
    expect(sciRow?.changeMarks).toBe(3)
    expect(sciRow?.trend).toBe('up')

    // English: 86 (Exam B) -> 84 (Exam A) = -2, down
    const engRow = comparison.subjectComparisons.find((s) => s.subjectName === 'English')
    expect(engRow).toBeDefined()
    expect(engRow?.examBMarks).toBe(86)
    expect(engRow?.examAMarks).toBe(84)
    expect(engRow?.changeMarks).toBe(-2)
    expect(engRow?.trend).toBe('down')
  })

  it('2. should calculate overall comparison delta and trajectory status', () => {
    const comparison = compareExaminations(mockResultAnnual, mockResultHalfYearly, mockGradingScales)
    expect(comparison.percentageDelta).toBeCloseTo(3.67, 2)
    expect(comparison.trendDirection).toBe('up')
    expect(comparison.trendStatusLabel).toBe('Improving')
    expect(comparison.summaryNarrative).toContain('Overall percentage increased from 82.00%')
    expect(comparison.summaryNarrative).toContain('an improvement of 3.67 percentage points')
  })

  it('3. should generate multi-term historical trajectory for selected subject', () => {
    const history = getSubjectPerformanceHistory('Mathematics', [mockResultAnnual, mockResultHalfYearly], mockGradingScales)
    expect(history).not.toBeNull()
    expect(history?.subjectName).toBe('Mathematics')
    expect(history?.currentMarks).toBe(88)
    expect(history?.previousMarks).toBe(78)
    expect(history?.changeMarks).toBe(10)
    expect(history?.trend).toBe('up')
    expect(history?.historicalPoints.length).toBe(2)
    expect(history?.trendNarrative).toContain('Mathematics improved by 10 percentage points')
  })

  it('4. should construct complete chronological Academic Journey steps', () => {
    const analytics = calculateStudentPerformanceAnalytics([mockResultAnnual, mockResultHalfYearly], mockGradingScales)
    expect(analytics.academicJourney.length).toBe(2)
    
    // First step in journey should be the earlier Half-Yearly Exam
    expect(analytics.academicJourney[0].examinationName).toBe('Half-Yearly Examination')
    expect(analytics.academicJourney[0].isCurrent).toBe(false)
    
    // Second step should be the latest Annual Exam
    expect(analytics.academicJourney[1].examinationName).toBe('Annual Examination')
    expect(analytics.academicJourney[1].isCurrent).toBe(true)
  })

  it('5. should generate transparent data-driven insights with exact numbers', () => {
    const analytics = calculateStudentPerformanceAnalytics([mockResultAnnual, mockResultHalfYearly], mockGradingScales)
    
    const growthInsight = analytics.dynamicInsights.find((i) => i.id === 'trend-positive')
    expect(growthInsight).toBeDefined()
    expect(growthInsight?.description).toContain('Overall percentage increased from 82.00% to 85.67%')
    expect(growthInsight?.description).toContain('3.67 percentage points')

    const topInsight = analytics.dynamicInsights.find((i) => i.id === 'top-subject')
    expect(topInsight).toBeDefined()
    expect(topInsight?.description).toContain('Mathematics is the highest-scoring subject with 88%')
  })

  it('6. should resolve custom grading scales accurately', () => {
    const { grade: grade95 } = resolveGradeFromScale(95, mockGradingScales)
    expect(grade95).toBe('A1')

    const { grade: grade85 } = resolveGradeFromScale(85, mockGradingScales)
    expect(grade85).toBe('A2')

    const { grade: grade25 } = resolveGradeFromScale(25, mockGradingScales)
    expect(grade25).toBe('E')
  })
})
