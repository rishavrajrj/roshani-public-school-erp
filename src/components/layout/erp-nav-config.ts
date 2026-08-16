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
  Settings,
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

export interface NavSection {
  sectionTitle?: string
  items: NavItem[]
}

import {
  ROLE_PORTAL_MAP,
  type RolePortalMeta,
  getRoleBranding,
  normalizeRoleName,
  getPortalName,
  getRoleBadge,
} from '@/lib/auth/portal-mapping'

export type RoleBranding = RolePortalMeta
export const ROLE_BRANDING_MAP = ROLE_PORTAL_MAP
export { getRoleBranding, normalizeRoleName, getPortalName, getRoleBadge }


export const ROLE_SECTION_NAV_CONFIG: Record<string, NavSection[]> = {
  Student: [
    {
      sectionTitle: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/erp/student', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      sectionTitle: 'ACADEMICS',
      items: [
        { name: 'My Attendance', href: '/erp/student/attendance', icon: CalendarCheck },
        { name: 'My Results', href: '/erp/student/results', icon: FileCheck },
        { name: 'Promotion Status', href: '/erp/student/promotion', icon: TrendingUp },
      ],
    },
    {
      sectionTitle: 'EXAMINATION',
      items: [
        { name: 'Admit Card', href: '/erp/student/admit-cards', icon: Award },
      ],
    },
    {
      sectionTitle: 'FINANCE',
      items: [
        { name: 'Fee Dues & Receipts', href: '/erp/student/fees', icon: CreditCard },
      ],
    },
    {
      sectionTitle: 'SERVICES',
      items: [
        { name: 'Apply Leave', href: '/erp/student/leave', icon: CalendarOff },
        { name: 'Certificates', href: '/erp/student/documents', icon: FileText },
      ],
    },
  ],
  Parent: [
    {
      sectionTitle: 'OVERVIEW',
      items: [
        { name: 'Parent Portal', href: '/erp/parent', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      sectionTitle: 'ACADEMICS',
      items: [
        { name: 'Child Attendance', href: '/erp/parent/attendance', icon: CalendarCheck },
        { name: 'Report Cards', href: '/erp/parent/results', icon: FileCheck },
        { name: 'Promotion Info', href: '/erp/parent/promotion', icon: TrendingUp },
      ],
    },
    {
      sectionTitle: 'EXAMINATION',
      items: [
        { name: 'Admit Cards', href: '/erp/parent/admit-cards', icon: Award },
      ],
    },
    {
      sectionTitle: 'FINANCE',
      items: [
        { name: 'Fees & Pay', href: '/erp/parent/fees', icon: CreditCard },
      ],
    },
    {
      sectionTitle: 'SERVICES',
      items: [
        { name: 'Leave Application', href: '/erp/parent/leave', icon: CalendarOff },
        { name: 'Documents', href: '/erp/parent/documents', icon: FileText },
      ],
    },
  ],
  Teacher: [
    {
      sectionTitle: 'OVERVIEW',
      items: [
        { name: 'Teacher Cockpit', href: '/erp/teacher', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      sectionTitle: 'ACADEMICS',
      items: [
        { name: 'Mark Attendance', href: '/erp/teacher/attendance', icon: CalendarCheck },
        { name: 'Enter Marks', href: '/erp/teacher/marks', icon: ClipboardList },
        { name: 'Exam Schedule', href: '/erp/teacher/examinations', icon: GraduationCap },
      ],
    },
    {
      sectionTitle: 'SERVICES',
      items: [
        { name: 'Leave Portal', href: '/erp/teacher/leave', icon: CalendarOff },
      ],
    },
  ],
  Accountant: [
    {
      sectionTitle: 'OVERVIEW',
      items: [
        { name: 'Finance Dashboard', href: '/erp/accountant', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      sectionTitle: 'FINANCE',
      items: [
        { name: 'Fee Ledger', href: '/erp/accountant/fees', icon: CreditCard },
        { name: 'Fee Counter', href: '/erp/accountant/collections', icon: Receipt },
      ],
    },
  ],
  Principal: [
    {
      sectionTitle: 'EXECUTIVE',
      items: [
        { name: 'Executive Overview', href: '/erp/principal', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      sectionTitle: 'ACADEMICS & STUDENTS',
      items: [
        { name: 'Admissions', href: '/erp/principal/admissions', icon: UserPlus },
        { name: 'Students', href: '/erp/principal/students', icon: Users },
        { name: 'Attendance', href: '/erp/principal/attendance', icon: CalendarCheck },
      ],
    },
    {
      sectionTitle: 'EXAMINATIONS & EVALUATION',
      items: [
        { name: 'Examinations', href: '/erp/principal/examinations', icon: GraduationCap },
        { name: 'Admit Cards', href: '/erp/principal/admit-cards', icon: Award },
        { name: 'Results', href: '/erp/principal/results', icon: FileCheck },
        { name: 'Promotion', href: '/erp/principal/promotion', icon: TrendingUp },
      ],
    },
    {
      sectionTitle: 'ADMINISTRATIVE',
      items: [
        { name: 'Leave Approvals', href: '/erp/principal/leave', icon: CalendarOff },
        { name: 'Documents', href: '/erp/principal/documents', icon: FileText },
      ],
    },
  ],
  Admin: [
    {
      sectionTitle: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/erp/admin', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      sectionTitle: 'STUDENT MANAGEMENT',
      items: [
        { name: 'Admissions', href: '/erp/admin/admissions', icon: UserPlus, description: 'Applications & Enquiries' },
        { name: 'Students', href: '/erp/admin/students', icon: Users, description: 'Student Directory & Profiles' },
        { name: 'Attendance', href: '/erp/admin/attendance', icon: CalendarCheck, description: 'Class Attendance Tracking' },
      ],
    },
    {
      sectionTitle: 'FEE & FINANCE',
      items: [
        { name: 'Fees Structure', href: '/erp/admin/fees', icon: CreditCard, description: 'Fee Heads & Structures' },
        { name: 'Collections', href: '/erp/admin/collections', icon: Receipt, description: 'Daily Fee Receipts' },
      ],
    },
    {
      sectionTitle: 'EXAMINATIONS & MARKS',
      items: [
        { name: 'Examinations', href: '/erp/admin/examinations', icon: GraduationCap, description: 'Exam Terms & Schedules' },
        { name: 'Admit Cards', href: '/erp/admin/admit-cards', icon: Award, description: 'Admit Card Generation' },
        { name: 'Results & Marks', href: '/erp/admin/results', icon: FileCheck, description: 'Tabulation & Report Cards' },
        { name: 'Promotion', href: '/erp/admin/promotion', icon: TrendingUp, description: 'Session Class Progression' },
      ],
    },
    {
      sectionTitle: 'OPERATIONS & STAFF',
      items: [
        { name: 'Teacher Assign', href: '/erp/admin/teacher-assignments', icon: UserCheck, description: 'Class Teacher & Subject' },
        { name: 'Leave & Approvals', href: '/erp/admin/leave', icon: CalendarOff, description: 'Staff & Student Leaves' },
        { name: 'Documents', href: '/erp/admin/documents', icon: FileText, description: 'TC, Character, Bonafide' },
      ],
    },
    {
      sectionTitle: 'SETTINGS & GOVERNANCE',
      items: [
        { name: 'School Settings', href: '/erp/admin/settings', icon: Settings, description: 'UDISE, Modules, Fields' },
      ],
    },
  ],
  'Super Admin': [
    {
      sectionTitle: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/erp/admin', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      sectionTitle: 'STUDENT MANAGEMENT',
      items: [
        { name: 'Admissions', href: '/erp/admin/admissions', icon: UserPlus },
        { name: 'Students', href: '/erp/admin/students', icon: Users },
        { name: 'Attendance', href: '/erp/admin/attendance', icon: CalendarCheck },
      ],
    },
    {
      sectionTitle: 'FEE & FINANCE',
      items: [
        { name: 'Fees Structure', href: '/erp/admin/fees', icon: CreditCard },
        { name: 'Collections', href: '/erp/admin/collections', icon: Receipt },
      ],
    },
    {
      sectionTitle: 'EXAMINATIONS & MARKS',
      items: [
        { name: 'Examinations', href: '/erp/admin/examinations', icon: GraduationCap },
        { name: 'Admit Cards', href: '/erp/admin/admit-cards', icon: Award },
        { name: 'Results & Marks', href: '/erp/admin/results', icon: FileCheck },
        { name: 'Promotion', href: '/erp/admin/promotion', icon: TrendingUp },
      ],
    },
    {
      sectionTitle: 'OPERATIONS & STAFF',
      items: [
        { name: 'Teacher Assign', href: '/erp/admin/teacher-assignments', icon: UserCheck },
        { name: 'Leave & Approvals', href: '/erp/admin/leave', icon: CalendarOff },
        { name: 'Documents', href: '/erp/admin/documents', icon: FileText },
      ],
    },
    {
      sectionTitle: 'SETTINGS & GOVERNANCE',
      items: [
        { name: 'School Settings', href: '/erp/admin/settings', icon: Settings },
      ],
    },
  ],
}

// Flat list helper for backward compatibility
export const ROLE_NAV_CONFIG: Record<string, NavItem[]> = Object.fromEntries(
  Object.entries(ROLE_SECTION_NAV_CONFIG).map(([role, sections]) => [
    role,
    sections.flatMap((s) => s.items),
  ])
)

