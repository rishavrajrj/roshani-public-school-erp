export type MarkAttendanceStatus = 'present' | 'absent' | 'excused' | 'not_appeared'
export type MarkWorkflowStatus = 'draft' | 'submitted' | 'verified' | 'locked'
export type ResultStatus = 'PASS' | 'FAIL' | 'COMPARTMENT' | 'WITHHELD'
export type ResultLifecycleStatus =
  | 'draft'
  | 'calculated'
  | 'pending_approval'
  | 'approved'
  | 'blocked'
  | 'override_released'
  | 'published'
  | 'withheld'
  | 'revoked'

export interface GradingScale {
  id: string
  schoolId: string
  name: string
  minPercentage: number
  maxPercentage: number
  grade: string
  gradePoint: number
  description?: string | null
}

export interface StudentMark {
  id?: string
  schoolId: string
  academicSessionId: string
  examinationId: string
  studentId: string
  studentName?: string
  admissionNumber?: string
  studentAcademicHistoryId?: string | null
  classId: string
  sectionId?: string | null
  subjectId: string
  subjectName?: string
  subjectCode?: string
  examinationSubjectConfigId?: string | null
  attendanceStatus: MarkAttendanceStatus
  theoryMarksObtained: number
  practicalMarksObtained: number
  internalMarksObtained: number
  totalMarksObtained: number
  maximumMarks?: number
  passingMarks?: number
  isPass: boolean
  status: MarkWorkflowStatus
  correctionReason?: string | null
  createdBy: string
  updatedBy?: string | null
  submittedBy?: string | null
  submittedAt?: string | null
  verifiedBy?: string | null
  verifiedAt?: string | null
  lockedBy?: string | null
  lockedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface StudentResult {
  id: string
  schoolId: string
  academicSessionId: string
  academicSessionName?: string
  examinationId: string
  examinationName?: string
  examinationCode?: string
  studentId: string
  studentName?: string
  admissionNumber?: string
  rollNumber?: string
  className?: string
  sectionName?: string
  fatherName?: string
  studentAcademicHistoryId?: string | null
  classId: string
  sectionId?: string | null
  totalMarksObtained: number
  maximumMarks: number
  percentage: number
  resultStatus: ResultStatus
  grade?: string | null
  status: ResultLifecycleStatus
  financialClearanceStatus: 'CLEAR' | 'PARTIAL' | 'OUTSTANDING' | 'WAIVED' | 'ON_HOLD'
  financialOutstandingAmount: number
  financialOverride: boolean
  overrideReason?: string | null
  overrideBy?: string | null
  overrideAt?: string | null
  version: number
  previousResultId?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  publishedBy?: string | null
  publishedAt?: string | null
  revokedBy?: string | null
  revocationReason?: string | null
  createdAt: string
  updatedAt: string
  subjectMarks?: StudentMark[]
}

export interface ResultCalculationSummary {
  totalStudents: number
  calculatedCount: number
  passedCount: number
  failedCount: number
  blockedCount: number
  results: StudentResult[]
}

export interface StudentAcademicProfile {
  id: string
  firstName: string
  lastName: string
  fullName: string
  admissionNumber: string
  rollNumber?: string | null
  className?: string | null
  sectionName?: string | null
  academicSessionName?: string | null
  fatherName?: string | null
  motherName?: string | null
  dateOfBirth?: string | null
  avatarUrl?: string | null
  attendancePercentage?: number | null
}

export interface ExamSummaryRow {
  index: number
  resultId: string
  examinationId: string
  examinationName: string
  examinationCode?: string
  academicSessionName: string
  className: string
  sectionName?: string
  formattedYearClassExam: string
  percentage: number
  sgpa: number
  totalMarksObtained: number
  maximumMarks: number
  backPaperCount: number
  backPapers: string[] // Subject names of failed subjects
  resultStatus: ResultStatus
  grade: string
  publishedAt?: string | null
}

export interface SubjectPerformanceAnalysis {
  subjectId: string
  subjectName: string
  subjectCode: string
  obtainedMarks: number
  maximumMarks: number
  percentage: number
  grade: string
  gradePoint: number
  isPass: boolean
  attendanceStatus: MarkAttendanceStatus
  theoryMarks: number
  practicalMarks: number
  internalMarks: number
}

export interface PerformanceTrendPoint {
  examinationId: string
  examinationName: string
  academicSessionName: string
  className: string
  percentage: number
  grade: string
  sgpa: number
  publishedAt?: string | null
}

export interface GradeDistributionItem {
  grade: string
  count: number
  percentageOfTotal: number
  subjects: string[]
  gradePoint: number
  description?: string | null
}

export interface StudentAcademicProgression {
  classLevel: string // e.g. "Class 8", "Class 9", "Class 10"
  academicSession: string
  percentage: number
  gpa: number
  creditsRegistered?: number
  creditsEarned?: number
  resultStatus: string
  isCurrent: boolean
}

export interface DynamicInsight {
  id: string
  type: 'positive' | 'improvement' | 'attention' | 'consistency'
  title: string
  description: string
  icon?: string
}

export interface SubjectComparisonRow {
  subjectName: string
  subjectCode: string
  examAMarks: number
  examAMax: number
  examAPercentage: number
  examAGrade: string
  examBMarks: number
  examBMax: number
  examBPercentage: number
  examBGrade: string
  changeMarks: number
  changePercentage: number
  trend: 'up' | 'down' | 'neutral'
}

export interface ExamComparisonResult {
  examAId: string
  examAName: string
  examASession: string
  examAClass: string
  examAPercentage: number
  examAGrade: string
  examAGpa: number
  examAResultStatus: ResultStatus
  
  examBId: string
  examBName: string
  examBSession: string
  examBClass: string
  examBPercentage: number
  examBGrade: string
  examBGpa: number
  examBResultStatus: ResultStatus
  
  percentageDelta: number
  gpaDelta: number
  trendDirection: 'up' | 'down' | 'neutral'
  trendStatusLabel: string
  summaryNarrative: string
  subjectComparisons: SubjectComparisonRow[]
}

export interface SubjectHistoricalPoint {
  examinationId: string
  examinationName: string
  academicSessionName: string
  className: string
  marksObtained: number
  maximumMarks: number
  percentage: number
  grade: string
  gradePoint: number
  isPass: boolean
  publishedAt?: string | null
}

export interface SubjectPerformanceHistory {
  subjectId: string
  subjectName: string
  subjectCode: string
  currentMarks: number
  maximumMarks: number
  percentage: number
  grade: string
  gradePoint: number
  previousMarks: number | null
  previousPercentage: number | null
  changeMarks: number | null
  changePercentage: number | null
  trend: 'up' | 'down' | 'neutral'
  historicalPoints: SubjectHistoricalPoint[]
  trendNarrative: string
}

export interface AcademicJourneyStep {
  index: number
  resultId: string
  examinationId: string
  examinationName: string
  academicSession: string
  classLevel: string
  sectionName?: string
  percentage: number
  grade: string
  sgpa: number
  resultStatus: ResultStatus
  isCurrent: boolean
  publishedAt?: string | null
}

export interface AcademicPerformanceConfig {
  strongSubjectThreshold: number // Default 80%
  practiceSubjectThreshold: number // Default 70%
  stableTrendThreshold: number // Default 0.5%
  passingPercentage: number // Default 33%
  enableGpaDisplay: boolean // Default true (for senior secondary/GPA enabled classes)
  enableCgpaDisplay: boolean // Default true
}

export interface StudentPerformanceAnalytics {
  overallPercentage: number
  overallGrade: string
  overallGpa: number
  overallCgpa: number
  totalMarksObtained: number
  totalMaximumMarks: number
  totalSubjectsCount: number
  subjectsPassedCount: number
  subjectsFailedCount: number
  overallResultStatus: ResultStatus
  
  // Trend
  hasTrend: boolean
  trendPercentageDelta: number
  trendDirection: 'up' | 'down' | 'neutral'
  trendSummaryText: string
  
  // Comparison
  currentPercentage: number
  previousPercentage: number | null
  improvementDelta: number | null
  
  // Subject Analysis
  strongSubjects: SubjectPerformanceAnalysis[]
  practiceSubjects: SubjectPerformanceAnalysis[]
  allSubjectScores: SubjectPerformanceAnalysis[]
  
  // Progression & Distribution
  trendPoints: PerformanceTrendPoint[]
  gradeDistribution: GradeDistributionItem[]
  academicProgression: StudentAcademicProgression[]
  academicJourney: AcademicJourneyStep[]
  dynamicInsights: DynamicInsight[]
  examSummaries: ExamSummaryRow[]
  config?: AcademicPerformanceConfig
}



