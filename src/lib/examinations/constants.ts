/**
 * Roshani Public School ERP — Canonical Examination Terminology Constants
 * Defines standardized examination types, codes, and human-readable names.
 */

export const CANONICAL_EXAM_TYPES = {
  UT: 'Unit Test',
  PT: 'Periodic Test',
  HY: 'Half-Yearly Examination',
  PA: 'Pre-Annual Examination',
  ANNUAL: 'Annual Examination',
  PRAC: 'Practical Examination',
  IA: 'Internal Assessment',
} as const

export type CanonicalExamCode = keyof typeof CANONICAL_EXAM_TYPES

export const DEFAULT_EXAMINATION_FALLBACK = 'Half-Yearly Examination 2024–25'

/**
 * Resolves a canonical examination display name from a code or fallback.
 */
export function getCanonicalExamName(code?: string | null, fallbackName?: string | null): string {
  if (!code && !fallbackName) return CANONICAL_EXAM_TYPES.HY
  if (code && code.toUpperCase() in CANONICAL_EXAM_TYPES) {
    return CANONICAL_EXAM_TYPES[code.toUpperCase() as CanonicalExamCode]
  }
  return fallbackName || CANONICAL_EXAM_TYPES.HY
}
