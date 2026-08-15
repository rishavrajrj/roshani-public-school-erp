import {
  LayoutDashboard,
  UserPlus,
  Users,
  CalendarCheck,
  CreditCard,
  Receipt,
  GraduationCap,
  Award,
  FileCheck,
  CalendarOff,
  UserCheck,
  TrendingUp,
  FileText,
  ClipboardList,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
  description?: string
  exact?: boolean
}

export const ROLE_NAV_CONFIG: Record<string, NavItem[]> = {
  Admin: [
    { name: 'Dashboard', href: '/erp/admin', icon: LayoutDashboard, exact: true },
    { name: 'Admissions', href: '/erp/admin/admissions', icon: UserPlus, description: 'Applications & Enquiries' },
    { name: 'Students', href: '/erp/admin/students', icon: Users, description: 'Student Directory & Profiles' },
    { name: 'Attendance', href: '/erp/admin/attendance', icon: CalendarCheck, description: 'Class Attendance Tracking' },
    { name: 'Fees Structure', href: '/erp/admin/fees', icon: CreditCard, description: 'Fee Heads & Structures' },
    { name: 'Collections', href: '/erp/admin/collections', icon: Receipt, description: 'Daily Fee Receipts' },
    { name: 'Examinations', href: '/erp/admin/examinations', icon: GraduationCap, description: 'Exam Terms & Schedules' },
    { name: 'Admit Cards', href: '/erp/admin/admit-cards', icon: Award, description: 'Admit Card Generation' },
    { name: 'Results & Marks', href: '/erp/admin/results', icon: FileCheck, description: 'Tabulation & Report Cards' },
    { name: 'Leave & Approvals', href: '/erp/admin/leave', icon: CalendarOff, description: 'Staff & Student Leaves' },
    { name: 'Promotion', href: '/erp/admin/promotion', icon: TrendingUp, description: 'Session Class Progression' },
    { name: 'Teacher Assign', href: '/erp/admin/teacher-assignments', icon: UserCheck, description: 'Class Teacher & Subject' },
    { name: 'Documents', href: '/erp/admin/documents', icon: FileText, description: 'TC, Character, Bonafide' },
  ],
  'Super Admin': [
    { name: 'Dashboard', href: '/erp/admin', icon: LayoutDashboard, exact: true },
    { name: 'Admissions', href: '/erp/admin/admissions', icon: UserPlus },
    { name: 'Students', href: '/erp/admin/students', icon: Users },
    { name: 'Attendance', href: '/erp/admin/attendance', icon: CalendarCheck },
    { name: 'Fees Structure', href: '/erp/admin/fees', icon: CreditCard },
    { name: 'Collections', href: '/erp/admin/collections', icon: Receipt },
    { name: 'Examinations', href: '/erp/admin/examinations', icon: GraduationCap },
    { name: 'Admit Cards', href: '/erp/admin/admit-cards', icon: Award },
    { name: 'Results & Marks', href: '/erp/admin/results', icon: FileCheck },
    { name: 'Leave & Approvals', href: '/erp/admin/leave', icon: CalendarOff },
    { name: 'Promotion', href: '/erp/admin/promotion', icon: TrendingUp },
    { name: 'Teacher Assign', href: '/erp/admin/teacher-assignments', icon: UserCheck },
    { name: 'Documents', href: '/erp/admin/documents', icon: FileText },
  ],
  Principal: [
    { name: 'Executive Overview', href: '/erp/principal', icon: LayoutDashboard, exact: true },
    { name: 'Admissions', href: '/erp/principal/admissions', icon: UserPlus },
    { name: 'Students', href: '/erp/principal/students', icon: Users },
    { name: 'Attendance', href: '/erp/principal/attendance', icon: CalendarCheck },
    { name: 'Examinations', href: '/erp/principal/examinations', icon: GraduationCap },
    { name: 'Admit Cards', href: '/erp/principal/admit-cards', icon: Award },
    { name: 'Results', href: '/erp/principal/results', icon: FileCheck },
    { name: 'Leave Approvals', href: '/erp/principal/leave', icon: CalendarOff },
    { name: 'Promotion', href: '/erp/principal/promotion', icon: TrendingUp },
    { name: 'Documents', href: '/erp/principal/documents', icon: FileText },
  ],
  Teacher: [
    { name: 'Teacher Cockpit', href: '/erp/teacher', icon: LayoutDashboard, exact: true },
    { name: 'Mark Attendance', href: '/erp/teacher/attendance', icon: CalendarCheck },
    { name: 'Enter Marks', href: '/erp/teacher/marks', icon: ClipboardList },
    { name: 'Exam Schedule', href: '/erp/teacher/examinations', icon: GraduationCap },
    { name: 'Leave Portal', href: '/erp/teacher/leave', icon: CalendarOff },
  ],
  Accountant: [
    { name: 'Finance Dashboard', href: '/erp/accountant', icon: LayoutDashboard, exact: true },
    { name: 'Fee Ledger', href: '/erp/accountant/fees', icon: CreditCard },
    { name: 'Fee Counter', href: '/erp/accountant/collections', icon: Receipt },
  ],
  Student: [
    { name: 'Student Home', href: '/erp/student', icon: LayoutDashboard, exact: true },
    { name: 'My Attendance', href: '/erp/student/attendance', icon: CalendarCheck },
    { name: 'Fee Dues & Receipts', href: '/erp/student/fees', icon: CreditCard },
    { name: 'Admit Card', href: '/erp/student/admit-cards', icon: Award },
    { name: 'My Results', href: '/erp/student/results', icon: FileCheck },
    { name: 'Apply Leave', href: '/erp/student/leave', icon: CalendarOff },
    { name: 'Certificates', href: '/erp/student/documents', icon: FileText },
    { name: 'Promotion Status', href: '/erp/student/promotion', icon: TrendingUp },
  ],
  Parent: [
    { name: 'Parent Portal', href: '/erp/parent', icon: LayoutDashboard, exact: true },
    { name: 'Child Attendance', href: '/erp/parent/attendance', icon: CalendarCheck },
    { name: 'Fees & Pay', href: '/erp/parent/fees', icon: CreditCard },
    { name: 'Admit Cards', href: '/erp/parent/admit-cards', icon: Award },
    { name: 'Report Cards', href: '/erp/parent/results', icon: FileCheck },
    { name: 'Leave Application', href: '/erp/parent/leave', icon: CalendarOff },
    { name: 'Documents', href: '/erp/parent/documents', icon: FileText },
    { name: 'Promotion Info', href: '/erp/parent/promotion', icon: TrendingUp },
  ],
}
