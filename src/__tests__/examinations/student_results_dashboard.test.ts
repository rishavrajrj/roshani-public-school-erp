import { describe, it, expect } from 'vitest'
import { calculateStudentPerformanceAnalytics } from '@/lib/examinations/result-analytics'
import type { StudentResult, GradingScale, StudentMark } from '@/types/result'

describe('Student Result & Academic Performance Analytics Engine', () => {
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

  const mockMarksExam1: StudentMark[] = [
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-1', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-math', subjectName: 'Mathematics', subjectCode: 'MATH101',
      attendanceStatus: 'present', theoryMarksObtained: 85, practicalMarksObtained: 0, internalMarksObtained: 10,
      totalMarksObtained: 95, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-1', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-sci', subjectName: 'Science', subjectCode: 'SCI101',
      attendanceStatus: 'present', theoryMarksObtained: 60, practicalMarksObtained: 28, internalMarksObtained: 0,
      totalMarksObtained: 88, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-1', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-eng', subjectName: 'English', subjectCode: 'ENG101',
      attendanceStatus: 'present', theoryMarksObtained: 75, practicalMarksObtained: 0, internalMarksObtained: 10,
      totalMarksObtained: 85, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-1', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-hin', subjectName: 'Hindi', subjectCode: 'HIN101',
      attendanceStatus: 'present', theoryMarksObtained: 55, practicalMarksObtained: 0, internalMarksObtained: 10,
      totalMarksObtained: 65, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-1', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-sst', subjectName: 'Social Science', subjectCode: 'SST101',
      attendanceStatus: 'present', theoryMarksObtained: 68, practicalMarksObtained: 0, internalMarksObtained: 12,
      totalMarksObtained: 80, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
  ]

  const mockMarksExam2: StudentMark[] = [
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-2', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-math', subjectName: 'Mathematics', subjectCode: 'MATH101',
      attendanceStatus: 'present', theoryMarksObtained: 70, practicalMarksObtained: 0, internalMarksObtained: 10,
      totalMarksObtained: 80, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-2', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-sci', subjectName: 'Science', subjectCode: 'SCI101',
      attendanceStatus: 'present', theoryMarksObtained: 50, practicalMarksObtained: 25, internalMarksObtained: 0,
      totalMarksObtained: 75, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-2', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-eng', subjectName: 'English', subjectCode: 'ENG101',
      attendanceStatus: 'present', theoryMarksObtained: 65, practicalMarksObtained: 0, internalMarksObtained: 10,
      totalMarksObtained: 75, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-2', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-hin', subjectName: 'Hindi', subjectCode: 'HIN101',
      attendanceStatus: 'present', theoryMarksObtained: 20, practicalMarksObtained: 0, internalMarksObtained: 5,
      totalMarksObtained: 25, maximumMarks: 100, passingMarks: 33, isPass: false, status: 'locked', createdBy: 't1' // FAILED (Back paper)
    },
    {
      schoolId: 's1', academicSessionId: 'sess-1', examinationId: 'exam-2', studentId: 'stud-1',
      classId: 'c-10', subjectId: 'sub-sst', subjectName: 'Social Science', subjectCode: 'SST101',
      attendanceStatus: 'present', theoryMarksObtained: 60, practicalMarksObtained: 0, internalMarksObtained: 10,
      totalMarksObtained: 70, maximumMarks: 100, passingMarks: 33, isPass: true, status: 'locked', createdBy: 't1'
    },
  ]

  const mockResults: StudentResult[] = [
    {
      id: 'res-1',
      schoolId: 's1',
      academicSessionId: 'sess-1',
      academicSessionName: '2025–26',
      examinationId: 'exam-1',
      examinationName: 'Annual Examination',
      examinationCode: 'ANNUAL-2026',
      studentId: 'stud-1',
      studentName: 'Rishav Raj',
      admissionNumber: 'RPS-2024-001',
      rollNumber: '1001',
      className: 'Class 10',
      sectionName: 'A',
      fatherName: 'Shourav Raj',
      classId: 'c-10',
      totalMarksObtained: 413,
      maximumMarks: 500,
      percentage: 82.6,
      resultStatus: 'PASS',
      grade: 'A2',
      status: 'published',
      financialClearanceStatus: 'CLEAR',
      financialOutstandingAmount: 0,
      financialOverride: false,
      version: 1,
      createdAt: '2026-03-20T10:00:00Z',
      updatedAt: '2026-03-20T10:00:00Z',
      publishedAt: '2026-03-20T12:00:00Z',
      subjectMarks: mockMarksExam1,
    },
    {
      id: 'res-2',
      schoolId: 's1',
      academicSessionId: 'sess-1',
      academicSessionName: '2025–26',
      examinationId: 'exam-2',
      examinationName: 'Half-Yearly Examination',
      examinationCode: 'HY-2025',
      studentId: 'stud-1',
      studentName: 'Rishav Raj',
      admissionNumber: 'RPS-2024-001',
      rollNumber: '1001',
      className: 'Class 10',
      sectionName: 'A',
      fatherName: 'Shourav Raj',
      classId: 'c-10',
      totalMarksObtained: 320,
      maximumMarks: 500,
      percentage: 64.0,
      resultStatus: 'COMPARTMENT',
      grade: 'B2',
      status: 'published',
      financialClearanceStatus: 'CLEAR',
      financialOutstandingAmount: 0,
      financialOverride: false,
      version: 1,
      createdAt: '2025-10-15T10:00:00Z',
      updatedAt: '2025-10-15T10:00:00Z',
      publishedAt: '2025-10-15T12:00:00Z',
      subjectMarks: mockMarksExam2,
    },
  ]

  it('1. should compute overall score and subject pass metrics correctly', () => {
    const analytics = calculateStudentPerformanceAnalytics(mockResults, mockGradingScales)
    expect(analytics.overallPercentage).toBe(82.6)
    expect(analytics.totalMarksObtained).toBe(413)
    expect(analytics.totalMaximumMarks).toBe(500)
    expect(analytics.subjectsPassedCount).toBe(5)
    expect(analytics.subjectsFailedCount).toBe(0)
    expect(analytics.overallResultStatus).toBe('PASS')
  })

  it('2. should correctly identify strong subjects and subjects needing practice', () => {
    const analytics = calculateStudentPerformanceAnalytics(mockResults, mockGradingScales)
    // Strong subjects (>= 80%)
    const strongSubjectNames = analytics.strongSubjects.map((s: { subjectName: string }) => s.subjectName)
    expect(strongSubjectNames).toContain('Mathematics')
    expect(strongSubjectNames).toContain('Science')
    expect(strongSubjectNames).toContain('English')
    expect(strongSubjectNames).toContain('Social Science')

    // Practice subjects (< 70%)
    const practiceSubjectNames = analytics.practiceSubjects.map((s: { subjectName: string }) => s.subjectName)
    expect(practiceSubjectNames).toContain('Hindi')
  })

  it('3. should calculate positive performance trend (+18.6%) between consecutive exams', () => {
    const analytics = calculateStudentPerformanceAnalytics(mockResults, mockGradingScales)
    expect(analytics.hasTrend).toBe(true)
    expect(analytics.trendDirection).toBe('up')
    expect(analytics.trendPercentageDelta).toBeCloseTo(18.6, 1)
    expect(analytics.trendSummaryText).toContain('18.60 percentage points')
  })

  it('4. should identify back papers correctly in historical examination rows', () => {
    const analytics = calculateStudentPerformanceAnalytics(mockResults, mockGradingScales)
    expect(analytics.examSummaries.length).toBe(2)
    
    // Latest Annual Exam (0 back papers)
    expect(analytics.examSummaries[0].backPaperCount).toBe(0)
    expect(analytics.examSummaries[0].backPapers).toEqual([])
    
    // Half-Yearly Exam (1 back paper in Hindi)
    expect(analytics.examSummaries[1].backPaperCount).toBe(1)
    expect(analytics.examSummaries[1].backPapers).toContain('Hindi')
  })

  it('5. should compute grade distribution accurately', () => {
    const analytics = calculateStudentPerformanceAnalytics(mockResults, mockGradingScales)
    const a1Item = analytics.gradeDistribution.find((g: { grade: string }) => g.grade === 'A1')
    const a2Item = analytics.gradeDistribution.find((g: { grade: string }) => g.grade === 'A2')
    
    expect(a1Item).toBeDefined()
    expect(a1Item?.count).toBe(1) // Mathematics 95% -> A1
    expect(a1Item?.subjects).toContain('Mathematics')

    expect(a2Item).toBeDefined()
    expect(a2Item?.count).toBe(2) // Science 88%, English 85% -> A2
  })

  it('6. should generate data-driven dynamic insights', () => {
    const analytics = calculateStudentPerformanceAnalytics(mockResults, mockGradingScales)
    expect(analytics.dynamicInsights.length).toBeGreaterThan(0)
    
    const topSubjectInsight = analytics.dynamicInsights.find((i: { id: string }) => i.id === 'top-subject')
    expect(topSubjectInsight).toBeDefined()
    expect(topSubjectInsight?.description).toContain('Mathematics')
    expect(topSubjectInsight?.description).toContain('95%')

    const growthInsight = analytics.dynamicInsights.find((i: { id: string }) => i.id === 'trend-positive')
    expect(growthInsight).toBeDefined()
    expect(growthInsight?.description).toContain('18.60 percentage points')
  })

  it('7. should handle edge case of single exam without breaking trend logic', () => {
    const singleResult = [mockResults[0]]
    const analytics = calculateStudentPerformanceAnalytics(singleResult, mockGradingScales)
    expect(analytics.hasTrend).toBe(false)
    expect(analytics.previousPercentage).toBeNull()
    expect(analytics.trendSummaryText).toBe('Performance trend will appear after the next examination.')
  })

  it('8. should handle empty results gracefully without throwing errors', () => {
    const analytics = calculateStudentPerformanceAnalytics([], mockGradingScales)
    expect(analytics.overallPercentage).toBe(0)
    expect(analytics.examSummaries).toEqual([])
    expect(analytics.trendPoints).toEqual([])
    expect(analytics.dynamicInsights).toEqual([])
    expect(analytics.trendSummaryText).toBe('No examination result is available yet.')
  })
})
