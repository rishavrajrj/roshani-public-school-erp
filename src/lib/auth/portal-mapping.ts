// ============================================================
// Centralized Role to Portal Mapping — Roshani Public School ERP
// ============================================================

export interface RolePortalMeta {
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

/**
 * Standard Canonical Role-to-Portal Mapping
 * Ensures 100% consistent terminology throughout the entire application.
 */
export const ROLE_PORTAL_MAP: Record<string, RolePortalMeta> = {
  'Super Admin': {
    role: 'Super Admin',
    badge: 'SUPER ADMIN',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Super Admin Portal',
    accentColor: 'rose',
    pillClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    activeNavClass: 'bg-rose-600 text-white font-semibold shadow-xs shadow-rose-900/30',
    indicatorClass: 'bg-rose-400',
    badgeColorClass: 'text-rose-400',
    breadcrumbPrefix: 'Super Admin Portal',
  },
  'Admin': {
    role: 'Admin',
    badge: 'ADMIN',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Admin Portal',
    accentColor: 'cyan',
    pillClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    activeNavClass: 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900/30',
    indicatorClass: 'bg-cyan-400',
    badgeColorClass: 'text-cyan-400',
    breadcrumbPrefix: 'Admin Portal',
  },
  'Principal': {
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
  'Vice Principal': {
    role: 'Vice Principal',
    badge: 'VICE PRINCIPAL',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Vice Principal Portal',
    accentColor: 'violet',
    pillClass: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    activeNavClass: 'bg-violet-600 text-white font-semibold shadow-xs shadow-violet-900/30',
    indicatorClass: 'bg-violet-400',
    badgeColorClass: 'text-violet-400',
    breadcrumbPrefix: 'Vice Principal Portal',
  },
  'Teacher': {
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
  'Class Teacher': {
    role: 'Class Teacher',
    badge: 'CLASS TEACHER',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Class Teacher Portal',
    accentColor: 'teal',
    pillClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    activeNavClass: 'bg-teal-600 text-white font-semibold shadow-xs shadow-teal-900/30',
    indicatorClass: 'bg-teal-400',
    badgeColorClass: 'text-teal-400',
    breadcrumbPrefix: 'Class Teacher Portal',
  },
  'Accountant': {
    role: 'Accountant',
    badge: 'ACCOUNTS',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Accounts Portal',
    accentColor: 'amber',
    pillClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    activeNavClass: 'bg-amber-600 text-white font-semibold shadow-xs shadow-amber-900/30',
    indicatorClass: 'bg-amber-400',
    badgeColorClass: 'text-amber-400',
    breadcrumbPrefix: 'Accounts Portal',
  },
  'Librarian': {
    role: 'Librarian',
    badge: 'LIBRARIAN',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Library Portal',
    accentColor: 'emerald',
    pillClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    activeNavClass: 'bg-emerald-600 text-white font-semibold shadow-xs shadow-emerald-900/30',
    indicatorClass: 'bg-emerald-400',
    badgeColorClass: 'text-emerald-400',
    breadcrumbPrefix: 'Library Portal',
  },
  'Receptionist': {
    role: 'Receptionist',
    badge: 'RECEPTIONIST',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Reception Portal',
    accentColor: 'fuchsia',
    pillClass: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
    activeNavClass: 'bg-fuchsia-600 text-white font-semibold shadow-xs shadow-fuchsia-900/30',
    indicatorClass: 'bg-fuchsia-400',
    badgeColorClass: 'text-fuchsia-400',
    breadcrumbPrefix: 'Reception Portal',
  },
  'Exam In-charge': {
    role: 'Exam In-charge',
    badge: 'EXAM IN-CHARGE',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Examination Portal',
    accentColor: 'orange',
    pillClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    activeNavClass: 'bg-orange-600 text-white font-semibold shadow-xs shadow-orange-900/30',
    indicatorClass: 'bg-orange-400',
    badgeColorClass: 'text-orange-400',
    breadcrumbPrefix: 'Examination Portal',
  },
  'Admission Staff': {
    role: 'Admission Staff',
    badge: 'ADMISSION STAFF',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Admission Portal',
    accentColor: 'blue',
    pillClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    activeNavClass: 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900/30',
    indicatorClass: 'bg-blue-400',
    badgeColorClass: 'text-blue-400',
    breadcrumbPrefix: 'Admission Portal',
  },
  'HR': {
    role: 'HR',
    badge: 'HR',
    portalTitle: 'Roshani Public School',
    portalLabel: 'HR Portal',
    accentColor: 'pink',
    pillClass: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    activeNavClass: 'bg-pink-600 text-white font-semibold shadow-xs shadow-pink-900/30',
    indicatorClass: 'bg-pink-400',
    badgeColorClass: 'text-pink-400',
    breadcrumbPrefix: 'HR Portal',
  },
  'Transport In-charge': {
    role: 'Transport In-charge',
    badge: 'TRANSPORT',
    portalTitle: 'Roshani Public School',
    portalLabel: 'Transport Portal',
    accentColor: 'yellow',
    pillClass: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    activeNavClass: 'bg-yellow-600 text-white font-semibold shadow-xs shadow-yellow-900/30',
    indicatorClass: 'bg-yellow-400',
    badgeColorClass: 'text-yellow-400',
    breadcrumbPrefix: 'Transport Portal',
  },
  'Student': {
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
  'Parent': {
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
}

/**
 * Normalizes any role input string regardless of casing, hyphens, or spacing.
 */
export function normalizeRoleName(rawRole?: string | null): string {
  if (!rawRole || typeof rawRole !== 'string') return 'Admin'

  const cleaned = rawRole.trim().toLowerCase().replace(/[_-]/g, ' ')

  switch (cleaned) {
    case 'super admin':
    case 'superadmin':
    case 'super_admin':
      return 'Super Admin'
    case 'admin':
    case 'administrator':
    case 'school admin':
      return 'Admin'
    case 'principal':
    case 'headmaster':
    case 'director':
      return 'Principal'
    case 'vice principal':
    case 'viceprincipal':
    case 'vp':
      return 'Vice Principal'
    case 'teacher':
    case 'faculty':
    case 'staff':
      return 'Teacher'
    case 'class teacher':
    case 'classteacher':
      return 'Class Teacher'
    case 'accountant':
    case 'accounts':
    case 'finance':
    case 'bursar':
      return 'Accountant'
    case 'librarian':
    case 'library':
      return 'Librarian'
    case 'receptionist':
    case 'reception':
    case 'front desk':
      return 'Receptionist'
    case 'exam in-charge':
    case 'exam in charge':
    case 'exam incharge':
    case 'examinations':
    case 'exam officer':
      return 'Exam In-charge'
    case 'admission staff':
    case 'admission':
    case 'admissions':
    case 'admission officer':
      return 'Admission Staff'
    case 'hr':
    case 'human resources':
      return 'HR'
    case 'transport in-charge':
    case 'transport in charge':
    case 'transport incharge':
    case 'transport':
    case 'transport manager':
      return 'Transport In-charge'
    case 'student':
    case 'pupil':
    case 'scholar':
      return 'Student'
    case 'parent':
    case 'guardian':
    case 'mother':
    case 'father':
      return 'Parent'
    default: {
      // Look for case-insensitive match in standard map
      const match = Object.keys(ROLE_PORTAL_MAP).find(
        (key) => key.toLowerCase() === cleaned
      )
      if (match) return match

      // If unmatched, capitalize words
      return rawRole
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    }
  }
}

/**
 * Retrieves full branding configuration for a given role.
 * Guaranteed to return a valid RolePortalMeta object.
 */
export function getRoleBranding(rawRole?: string | null): RolePortalMeta {
  const normalized = normalizeRoleName(rawRole)

  if (ROLE_PORTAL_MAP[normalized]) {
    return ROLE_PORTAL_MAP[normalized]
  }

  // Dynamic fallback for any custom role not in preconfigured table
  const formattedRole = normalized || 'User'
  return {
    role: formattedRole,
    badge: formattedRole.toUpperCase(),
    portalTitle: 'Roshani Public School',
    portalLabel: `${formattedRole} Portal`,
    accentColor: 'blue',
    pillClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    activeNavClass: 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900/30',
    indicatorClass: 'bg-blue-400',
    badgeColorClass: 'text-blue-400',
    breadcrumbPrefix: `${formattedRole} Portal`,
  }
}

/**
 * Returns the dynamic portal label for a role.
 * Example: 'Student' -> 'Student Portal'
 */
export function getPortalName(rawRole?: string | null): string {
  return getRoleBranding(rawRole).portalLabel
}

/**
 * Returns the uppercase badge string for a role.
 * Example: 'Student' -> 'STUDENT'
 */
export function getRoleBadge(rawRole?: string | null): string {
  return getRoleBranding(rawRole).badge
}
