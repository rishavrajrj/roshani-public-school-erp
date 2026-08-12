// ============================================================
// Auth Constants — Roshani Public School ERP
// ============================================================
import type { RoleName } from '@/types/auth'

/**
 * Maps each role to its default portal route.
 *
 * IMPORTANT: This mapping is used ONLY for navigation/redirect decisions.
 * It is NOT a security boundary. Every portal page performs its own
 * server-side authorization check against trusted database data.
 */
export const ROLE_ROUTES: Record<RoleName, string> = {
  'Super Admin': '/erp/admin',
  'Admin': '/erp/admin',
  'Principal': '/erp/principal',
  'Teacher': '/erp/teacher',
  'Accountant': '/erp/accountant',
  'Parent': '/erp/parent',
  'Student': '/erp/student',
}

/**
 * Maps each portal route to the roles that are allowed to access it.
 * Used by server-side authorization checks in each portal layout/page.
 */
export const ROUTE_ALLOWED_ROLES: Record<string, RoleName[]> = {
  '/erp/admin': ['Super Admin', 'Admin'],
  '/erp/admin/admissions': ['Super Admin', 'Admin'],
  '/erp/admin/admissions/new': ['Super Admin', 'Admin'],
  '/erp/admin/students': ['Super Admin', 'Admin'],
  '/erp/admin/students/new': ['Super Admin', 'Admin'],
  '/erp/principal': ['Principal'],
  '/erp/principal/admissions': ['Principal'],
  '/erp/principal/students': ['Principal'],
  '/erp/teacher': ['Teacher'],
  '/erp/accountant': ['Accountant'],
  '/erp/parent': ['Parent'],
  '/erp/student': ['Student'],
}

/** Routes that don't require authentication */
export const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/',
]

/** Routes within the ERP protected area */
export const ERP_ROUTE_PREFIX = '/erp'

/**
 * Role priority for display ordering and default selection.
 * Lower number = higher priority. This does NOT grant additional permissions.
 */
export const ROLE_PRIORITY: Record<RoleName, number> = {
  'Super Admin': 1,
  'Admin': 2,
  'Principal': 3,
  'Accountant': 4,
  'Teacher': 5,
  'Parent': 6,
  'Student': 7,
}
