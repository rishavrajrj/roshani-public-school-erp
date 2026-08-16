// ============================================================
// Roshani Public School ERP - School Validation Helpers
// ============================================================

/**
 * Validates and normalizes official school UDISE code.
 * UDISE code in India is an 11-digit unique textual code:
 * - 2 digits: State
 * - 2 digits: District
 * - 2 digits: Block/Mandal
 * - 3 digits: Village/Town
 * - 2 digits: School Number
 * Must be treated strictly as textual identifier, NOT numeric arithmetic value.
 */
export function normalizeUdiseCode(udise: string | null | undefined): {
  valid: boolean
  normalized: string | null
  error?: string
} {
  if (!udise || udise.trim() === '') {
    return { valid: true, normalized: null }
  }

  const cleaned = udise.trim()

  // 11 digits numeric string
  if (!/^\d{11}$/.test(cleaned)) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'UDISE Code must be exactly 11 numeric digits (e.g. 10123456789).',
    }
  }

  return { valid: true, normalized: cleaned }
}
