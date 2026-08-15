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

export interface NavSection {
  sectionTitle?: string
  items: NavItem[]
}

export interface RoleBranding {
  role: string
  badge: string
  portalTitle: string
  portalLabel: string
  accentColor: string
  pillClass: string
  activeNavClass: string
  indicatorClass: string
  badgeColorClass: string
  breadcrumbPrefix: string
}

export const ROLE_BRANDING_MAP: Record<string, RoleBranding> = {
  Student: {
    role: 'Student',
    badge: 'STUDENT',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Student Portal',
    accentColor: 'emerald',
    pillClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    activeNavClass: 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900/30',
    indicatorClass: 'bg-emerald-400',
    badgeColorClass: 'text-emerald-400',
    breadcrumbPrefix: 'Student Portal',
  },
  Parent: {
    role: 'Parent',
    badge: 'PARENT',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Parent Portal',
    accentColor: 'indigo',
    pillClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    activeNavClass: 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-900/30',
    indicatorClass: 'bg-indigo-400',
    badgeColorClass: 'text-indigo-400',
    breadcrumbPrefix: 'Parent Portal',
  },
  Teacher: {
    role: 'Teacher',
    badge: 'TEACHER',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Teacher Portal',
    accentColor: 'sky',
    pillClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    activeNavClass: 'bg-sky-600 text-white font-semibold shadow-xs shadow-sky-900/30',
    indicatorClass: 'bg-sky-400',
    badgeColorClass: 'text-sky-400',
    breadcrumbPrefix: 'Teacher Portal',
  },
  Accountant: {
    role: 'Accountant',
    badge: 'ACCOUNTS',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Finance & Accounts',
    accentColor: 'amber',
    pillClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    activeNavClass: 'bg-amber-600 text-white font-semibold shadow-xs shadow-amber-900/30',
    indicatorClass: 'bg-amber-400',
    badgeColorClass: 'text-amber-400',
    breadcrumbPrefix: 'Finance & Accounts',
  },
  Principal: {
    role: 'Principal',
    badge: 'PRINCIPAL',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Principal Portal',
    accentColor: 'purple',
    pillClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    activeNavClass: 'bg-purple-600 text-white font-semibold shadow-xs shadow-purple-900/30',
    indicatorClass: 'bg-purple-400',
    badgeColorClass: 'text-purple-400',
    breadcrumbPrefix: 'Principal Portal',
  },
  Admin: {
    role: 'Admin',
    badge: 'ADMIN',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Admin Console',
    accentColor: 'cyan',
    pillClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    activeNavClass: 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900/30',
    indicatorClass: 'bg-cyan-400',
    badgeColorClass: 'text-cyan-400',
    breadcrumbPrefix: 'Admin Console',
  },
  'Super Admin': {
    role: 'Super Admin',
    badge: 'SUPER ADMIN',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Master Console',
    accentColor: 'rose',
    pillClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    activeNavClass: 'bg-rose-600 text-white font-semibold shadow-xs shadow-rose-900/30',
    indicatorClass: 'bg-rose-400',
    badgeColorClass: 'text-rose-400',
    breadcrumbPrefix: 'Master Console',
  },
}

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
  ],
}

// Flat list helper for backward compatibility
export const ROLE_NAV_CONFIG: Record<string, NavItem[]> = Object.fromEntries(
  Object.entries(ROLE_SECTION_NAV_CONFIG).map(([role, sections]) => [
    role,
    sections.flatMap((s) => s.items),
  ])
)

