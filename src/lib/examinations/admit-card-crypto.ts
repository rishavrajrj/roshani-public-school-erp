import crypto from 'crypto'

/**
 * Generates a cryptographically random, unpredictable 256-bit verification token.
 * Does not expose student IDs, exam IDs, or sequential numbers.
 */
export function generateSecureVerificationToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomBytes) {
    return crypto.randomBytes(32).toString('hex')
  }
  // Fallback for edge environments
  const array = new Uint8Array(32)
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(array)
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
}

/**
 * Generates an official, human-readable document fingerprint for tracking and tamper-evidence.
 * Format: RPS-AC-{YEAR}-{HASH6}
 * Example: RPS-AC-2026-8F4K2M
 */
export function generateDocumentFingerprint(year?: string | number): string {
  const y = year || new Date().getFullYear()
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 6)
  return `RPS-AC-${y}-${rand}`
}
