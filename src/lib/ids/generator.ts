/**
 * Centralized Safe Business ID Generators & Validators for MySchool-ERP
 */

import { ID_PREFIXES, ID_PATTERNS } from './constants'

/**
 * Normalizes school code removing any existing prefix
 */
export function normalizeSchoolCode(schoolCode: string): string {
  if (!schoolCode) return '10022702717'
  const cleaned = schoolCode.trim().toUpperCase()
  if (cleaned.startsWith('SCH-')) {
    return cleaned.slice(4)
  }
  return cleaned
}

/**
 * Pads a sequence number to standard length (default 6 digits)
 */
export function padSequence(seq: number | string, length: number = 6): string {
  return String(seq).padStart(length, '0')
}

/**
 * Generates human-readable Student ID (e.g. STU-RPS-NOIDA-2026-000001)
 */
export function generateStudentId(schoolCode: string, year: number | string, sequence: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.STUDENT}-${normSchool}-${year}-${padSequence(sequence, 6)}`
}

/**
 * Generates human-readable Admission Number (e.g. ADM-RPS-NOIDA-2026-000001)
 */
export function generateAdmissionNumber(schoolCode: string, year: number | string, sequence: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.ADMISSION}-${normSchool}-${year}-${padSequence(sequence, 6)}`
}

/**
 * Generates human-readable Guardian ID (e.g. GDN-RPS-NOIDA-000001)
 */
export function generateGuardianId(schoolCode: string, sequence: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.GUARDIAN}-${normSchool}-${padSequence(sequence, 6)}`
}

/**
 * Generates human-readable Employee ID (e.g. EMP-RPS-NOIDA-2026-000001)
 */
export function generateEmployeeId(schoolCode: string, year: number | string, sequence: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.EMPLOYEE}-${normSchool}-${year}-${padSequence(sequence, 6)}`
}

/**
 * Generates human-readable Academic Session Code (e.g. SES-RPS-NOIDA-2026)
 */
export function generateSessionCode(schoolCode: string, year: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.SESSION}-${normSchool}-${year}`
}

/**
 * Generates human-readable Class Code (e.g. CLS-RPS-NOIDA-10, CLS-RPS-NOIDA-NUR)
 */
export function generateClassCode(schoolCode: string, classCode: string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  const normClass = classCode.replace(/\s+/g, '').toUpperCase()
  return `${ID_PREFIXES.CLASS}-${normSchool}-${normClass}`
}

/**
 * Generates human-readable Section Code (e.g. SEC-RPS-NOIDA-10-A)
 */
export function generateSectionCode(schoolCode: string, classCode: string, sectionName: string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  const normClass = classCode.replace(/\s+/g, '').toUpperCase()
  const normSec = sectionName.trim().toUpperCase()
  return `${ID_PREFIXES.SECTION}-${normSchool}-${normClass}-${normSec}`
}

/**
 * Generates human-readable Invoice Number (e.g. INV-RPS-NOIDA-2026-000001)
 */
export function generateInvoiceNumber(schoolCode: string, year: number | string, sequence: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.INVOICE}-${normSchool}-${year}-${padSequence(sequence, 6)}`
}

/**
 * Generates human-readable Receipt Number (e.g. RCT-RPS-NOIDA-2026-000125)
 */
export function generateReceiptNumber(schoolCode: string, year: number | string, sequence: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.RECEIPT}-${normSchool}-${year}-${padSequence(sequence, 6)}`
}

/**
 * Generates human-readable Payment Number (e.g. PAY-RPS-NOIDA-2026-000001)
 */
export function generatePaymentNumber(schoolCode: string, year: number | string, sequence: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.PAYMENT}-${normSchool}-${year}-${padSequence(sequence, 6)}`
}

/**
 * Generates human-readable Examination Number (e.g. EXM-RPS-NOIDA-2026-000001)
 */
export function generateExaminationNumber(schoolCode: string, year: number | string, sequence: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.EXAMINATION}-${normSchool}-${year}-${padSequence(sequence, 6)}`
}

/**
 * Generates human-readable Admit Card Number (e.g. ADMTC-RPS-NOIDA-2026-000125)
 */
export function generateAdmitCardNumber(schoolCode: string, year: number | string, sequence: number | string): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  return `${ID_PREFIXES.ADMIT_CARD}-${normSchool}-${year}-${padSequence(sequence, 6)}`
}

/**
 * Generates human-readable Certificate Number (e.g. CERT-RPS-NOIDA-2026-TC-000001)
 */
export function generateCertificateNumber(
  schoolCode: string,
  year: number | string,
  type: string,
  sequence: number | string
): string {
  const normSchool = normalizeSchoolCode(schoolCode)
  const normType = type.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  return `${ID_PREFIXES.CERTIFICATE}-${normSchool}-${year}-${normType}-${padSequence(sequence, 6)}`
}

/**
 * Validates whether an ID matches the standard pattern for its entity type
 */
export function validateBusinessId(id: string, type: keyof typeof ID_PATTERNS): boolean {
  if (!id) return false
  const pattern = ID_PATTERNS[type]
  return pattern ? pattern.test(id) : false
}
