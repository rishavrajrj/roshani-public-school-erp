export type ExamStatus = 'draft' | 'scheduled' | 'published' | 'in_progress' | 'completed' | 'cancelled'
export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled'

export interface ExamType {
  id: string
  schoolId: string
  name: string
  code: string
  description?: string | null
  status: 'active' | 'inactive'
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface ExaminationClass {
  id: string
  schoolId: string
  examinationId: string
  classId: string
  className?: string
  createdAt: string
}

export interface ExamSubjectConfig {
  id: string
  schoolId: string
  examinationId: string
  classId: string
  className?: string
  subjectId: string
  subjectName?: string
  subjectCode?: string
  maximumMarks: number
  passingMarks: number
  theoryMarks: number
  practicalMarks: number
  internalMarks: number
  createdAt: string
  updatedAt: string
}

export interface ExamInvigilator {
  id: string
  schoolId: string
  examScheduleId: string
  profileId: string
  invigilatorName?: string
  invigilatorEmail?: string
  assignedBy: string
  assignedAt: string
}

export interface ExamSchedule {
  id: string
  schoolId: string
  examinationId: string
  examinationName?: string
  classId: string
  className?: string
  sectionId?: string | null
  sectionName?: string | null
  subjectId: string
  subjectName?: string
  subjectCode?: string
  examDate: string
  startTime: string
  endTime: string
  durationMinutes: number
  venue?: string | null
  room?: string | null
  maximumMarks: number
  passingMarks: number
  status: ScheduleStatus
  createdBy: string
  updatedBy?: string | null
  changeReason?: string | null
  createdAt: string
  updatedAt: string
  invigilators?: ExamInvigilator[]
}

export interface Examination {
  id: string
  schoolId: string
  academicSessionId: string
  academicSessionName?: string
  examTypeId: string
  examTypeName?: string
  examTypeCode?: string
  name: string
  code: string
  description?: string | null
  startDate: string
  endDate: string
  status: ExamStatus
  cancellationReason?: string | null
  createdBy: string
  createdByName?: string
  publishedBy?: string | null
  publishedByName?: string | null
  publishedAt?: string | null
  cancelledBy?: string | null
  cancelledAt?: string | null
  createdAt: string
  updatedAt: string
  classes?: ExaminationClass[]
  subjectConfigs?: ExamSubjectConfig[]
  schedules?: ExamSchedule[]
}

export interface ScheduleConflict {
  type: 'CLASS_TIME_OVERLAP' | 'ROOM_OVERLAP' | 'INVIGILATOR_OVERLAP' | 'SUBJECT_DUPLICATION'
  message: string
  schedule_id?: string
  profile_id?: string
}
