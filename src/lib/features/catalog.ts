// ============================================================
// Roshani Public School ERP - Canonical Feature Registry & Catalog
// ============================================================

import type { FeatureDefinition, FeatureKey } from '@/types/features'

export const FEATURE_CATALOG: Record<FeatureKey, FeatureDefinition> = {
  // ==========================================================
  // CORE / MANDATORY MODULES
  // ==========================================================
  school_profile: {
    key: 'school_profile',
    name: 'School Profile & Identity',
    description: 'Institutional identity, official UDISE registration, affiliation, and campus branding.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: [],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'Building2',
  },
  academic: {
    key: 'academic',
    name: 'Academic Foundation',
    description: 'Academic sessions, class levels, section assignments, and core subjects curriculum.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['school_profile'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'GraduationCap',
  },
  students: {
    key: 'students',
    name: 'Student Information System',
    description: 'Central student directory, admission numbering, academic enrollment, and demographics.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['academic'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal', 'Teacher'],
    iconName: 'Users',
  },
  guardians: {
    key: 'guardians',
    name: 'Guardian & Parent Management',
    description: 'Normalized guardian profiles, custody relationships, and emergency contact registry.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'HeartHandshake',
  },
  staff: {
    key: 'staff',
    name: 'Staff & Faculty Management',
    description: 'Teacher assignments, employee directory, designations, and departmental duties.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['school_profile'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'UserCheck',
  },
  users_roles: {
    key: 'users_roles',
    name: 'Security & Access Control (RBAC)',
    description: 'Multi-role authentication, user provisioning, permissions, and school-isolated boundaries.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['school_profile'],
    requiredRoles: ['Super Admin', 'Admin'],
    iconName: 'Shield',
  },
  admissions: {
    key: 'admissions',
    name: 'Admissions & Enquiries',
    description: 'Application intake workflow, document verification, review approval, and atomic conversion.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['academic', 'students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'UserPlus',
  },
  attendance: {
    key: 'attendance',
    name: 'Student Attendance Tracking',
    description: 'Daily session roll-call, class/section tracking, attendance correction audit logging.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['academic', 'students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal', 'Teacher'],
    iconName: 'CalendarCheck',
  },
  examinations: {
    key: 'examinations',
    name: 'Examinations & Scheduling',
    description: 'UT, PT, Half-Yearly, Pre-Annual, Annual, Practical, and Internal Assessment schedules.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['academic', 'students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal', 'Teacher'],
    iconName: 'ClipboardList',
  },
  results: {
    key: 'results',
    name: 'Marks, Results & Grading',
    description: 'Grading scale computation, tabulation sheets, publication lifecycle, and locked immutable records.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['examinations', 'students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal', 'Teacher'],
    iconName: 'FileCheck',
  },
  documents: {
    key: 'documents',
    name: 'Certificates & Report Cards',
    description: 'Transfer, Bonafide, Character certificates with school-scoped numbering and Report Cards.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'FileText',
  },
  fees: {
    key: 'fees',
    name: 'Fee Structure & Financial Ledger',
    description: 'Fee structures, student fee assignments, invoices, collections, receipts, and refund protections.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['academic', 'students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal', 'Accountant'],
    iconName: 'CreditCard',
  },
  audit: {
    key: 'audit',
    name: 'Security & Audit Logging',
    description: 'Immutable system audit trail for administrative actions, admissions, marks, and financials.',
    category: 'core',
    isDefaultEnabled: true,
    dependencies: ['school_profile'],
    requiredRoles: ['Super Admin', 'Admin'],
    iconName: 'Lock',
  },

  // ==========================================================
  // OPTIONAL SCHOOL MODULES
  // ==========================================================
  transport: {
    key: 'transport',
    name: 'School Transport Management',
    description: 'Bus routes, pickup/drop stops, vehicle management, and student transport allocations.',
    category: 'optional',
    isDefaultEnabled: false,
    dependencies: ['students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'Bus',
  },
  hostel: {
    key: 'hostel',
    name: 'Hostel & Residential Life',
    description: 'Hostel buildings, room allocations, bed management, and warden oversight.',
    category: 'optional',
    isDefaultEnabled: false,
    dependencies: ['students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'Home',
  },
  library: {
    key: 'library',
    name: 'Library Management System',
    description: 'Book cataloging, barcode accession numbers, student/staff memberships, and issue/return ledger.',
    category: 'optional',
    isDefaultEnabled: false,
    dependencies: ['students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'BookOpen',
  },
  inventory: {
    key: 'inventory',
    name: 'Asset & Inventory Control',
    description: 'Stock tracking, purchase logging, vendor records, equipment asset management, and replenishment.',
    category: 'optional',
    isDefaultEnabled: false,
    dependencies: ['school_profile'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'Package',
  },
  payroll: {
    key: 'payroll',
    name: 'HR & Staff Payroll',
    description: 'Salary structures, monthly payroll processing, payslip generation, and allowances/deductions.',
    category: 'optional',
    isDefaultEnabled: false,
    dependencies: ['staff'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal', 'Accountant'],
    iconName: 'DollarSign',
  },
  activities: {
    key: 'activities',
    name: 'Co-Curricular & Sports',
    description: 'Inter-school competitions, sports achievements, club events, and activity tracking.',
    category: 'optional',
    isDefaultEnabled: false,
    dependencies: ['students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal', 'Teacher'],
    iconName: 'Trophy',
  },
  house_system: {
    key: 'house_system',
    name: 'School House System',
    description: 'House allocation, inter-house points, leadership appointments, and cultural events.',
    category: 'optional',
    isDefaultEnabled: false,
    dependencies: ['students'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'Flag',
  },
  clubs: {
    key: 'clubs',
    name: 'Student Clubs & Societies',
    description: 'Special interest clubs (Robotics, Debate, Drama, Eco), memberships, and faculty coordination.',
    category: 'optional',
    isDefaultEnabled: false,
    dependencies: ['students', 'staff'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'Sparkles',
  },
  advanced_communication: {
    key: 'advanced_communication',
    name: 'SMS & Multi-Channel Broadcasts',
    description: 'Automated parent SMS notifications, gateway integration, and broadcast communication.',
    category: 'optional',
    isDefaultEnabled: false,
    dependencies: ['school_profile'],
    requiredRoles: ['Super Admin', 'Admin', 'Principal'],
    iconName: 'Send',
  },
}

export const CORE_FEATURES = Object.values(FEATURE_CATALOG).filter(
  (f) => f.category === 'core'
)

export const OPTIONAL_FEATURES = Object.values(FEATURE_CATALOG).filter(
  (f) => f.category === 'optional'
)

/**
 * Validates dependencies for activating or deactivating a module.
 * If enabling: verifies all prerequisites in `dependencies` are enabled.
 * If disabling: warns and lists active modules that depend on this feature.
 */
export function evaluateFeatureDependencies(
  featureKey: FeatureKey,
  targetState: boolean,
  activeFeatureKeys: Set<FeatureKey>
): {
  valid: boolean
  missingDependencies: string[]
  dependentActiveModules: string[]
  reason?: string
} {
  const definition = FEATURE_CATALOG[featureKey]
  if (!definition) {
    return {
      valid: false,
      missingDependencies: [],
      dependentActiveModules: [],
      reason: `Unknown feature key: '${featureKey}'`,
    }
  }

  // If enabling, ensure all dependencies are currently active
  if (targetState) {
    const missing: string[] = []
    for (const depKey of definition.dependencies) {
      if (!activeFeatureKeys.has(depKey)) {
        const depDef = FEATURE_CATALOG[depKey]
        missing.push(depDef ? depDef.name : depKey)
      }
    }

    if (missing.length > 0) {
      return {
        valid: false,
        missingDependencies: missing,
        dependentActiveModules: [],
        reason: `${definition.name} cannot be enabled until [${missing.join(', ')}] is active.`,
      }
    }
  }

  // If disabling, find all currently active modules that depend on this feature
  if (!targetState) {
    const dependents: string[] = []
    for (const [key, item] of Object.entries(FEATURE_CATALOG)) {
      if (item.dependencies.includes(featureKey) && activeFeatureKeys.has(key as FeatureKey)) {
        dependents.push(item.name)
      }
    }

    // Core features cannot be disabled
    if (definition.category === 'core') {
      return {
        valid: false,
        missingDependencies: [],
        dependentActiveModules: dependents,
        reason: `Core module '${definition.name}' is mandatory for school operation and cannot be disabled.`,
      }
    }

    if (dependents.length > 0) {
      return {
        valid: false,
        missingDependencies: [],
        dependentActiveModules: dependents,
        reason: `Disabling ${definition.name} will affect active dependent modules: [${dependents.join(', ')}].`,
      }
    }
  }

  return {
    valid: true,
    missingDependencies: [],
    dependentActiveModules: [],
  }
}
