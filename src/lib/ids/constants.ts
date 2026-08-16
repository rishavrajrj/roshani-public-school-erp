/**
 * Centralized Business ID Constants & Patterns for MySchool-ERP
 * Enforces human-readable, multi-tenant safe business identifiers.
 */

export const ID_PREFIXES = {
  SCHOOL: 'SCH',
  STUDENT: 'STU',
  GUARDIAN: 'GDN',
  EMPLOYEE: 'EMP',
  SESSION: 'SES',
  CLASS: 'CLS',
  SECTION: 'SEC',
  SUBJECT: 'SUB',
  ADMISSION: 'ADM',
  FEE_STRUCTURE: 'FST',
  INVOICE: 'INV',
  PAYMENT: 'PAY',
  RECEIPT: 'RCT',
  REFUND: 'REF',
  ADJUSTMENT: 'ADJ',
  CREDIT: 'CRD',
  EXAMINATION: 'EXM',
  EXAM_SCHEDULE: 'SCHD',
  ADMIT_CARD: 'ADMTC',
  RESULT: 'RES',
  REPORT_CARD: 'RPT',
  CERTIFICATE: 'CERT',
  // Optional Modules
  ROUTE: 'ROUTE',
  STOP: 'STOP',
  TRANSPORT_ALLOC: 'TRN',
  HOSTEL: 'HST',
  HOSTEL_ROOM: 'ROOM',
  HOSTEL_ALLOC: 'HSTAL',
  BOOK: 'BOOK',
  LIBRARY_MEMBER: 'LIBMEM',
  LIBRARY_ISSUE: 'LIBISS',
  INVENTORY_ITEM: 'INVITEM',
  INVENTORY_PURCHASE: 'PUR',
  PAYROLL_PERIOD: 'PAYROLL',
  PAYSLIP: 'SLIP',
  HOUSE: 'HOUSE',
  CLUB: 'CLUB',
  ACTIVITY_MEMBER: 'ACT',
} as const

export type EntityIdType = keyof typeof ID_PREFIXES

/**
 * Standard Regex Patterns for Business ID Validation
 */
export const ID_PATTERNS = {
  STUDENT: /^STU-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-\d{6}$/,
  ADMISSION: /^ADM-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-\d{6}$/,
  GUARDIAN: /^GDN-[A-Z0-9]+(-[A-Z0-9]+)*-\d{6}$/,
  EMPLOYEE: /^EMP-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-\d{6}$/,
  SESSION: /^SES-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}$/,
  CLASS: /^CLS-[A-Z0-9]+(-[A-Z0-9]+)*-[A-Z0-9]+$/,
  SECTION: /^SEC-[A-Z0-9]+(-[A-Z0-9]+)*-[A-Z0-9]+-[A-Z0-9]+$/,
  INVOICE: /^INV-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-\d{6}$/,
  RECEIPT: /^RCT-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-\d{6}$/,
  PAYMENT: /^PAY-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-\d{6}$/,
  EXAMINATION: /^EXM-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-\d{6}$/,
  ADMIT_CARD: /^ADMTC-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-\d{6}$/,
  RESULT: /^RES-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-\d{6}$/,
  CERTIFICATE: /^CERT-[A-Z0-9]+(-[A-Z0-9]+)*-\d{4}-[A-Z0-9]+-\d{6}$/,
} as const
