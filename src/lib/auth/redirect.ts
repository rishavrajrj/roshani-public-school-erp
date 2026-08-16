// ============================================================
// Secure Redirect Path Sanitizer & Open-Redirect Prevention
// Roshani Public School ERP
// ============================================================

/**
 * Validates and sanitizes redirect destination paths to prevent Open Redirect attacks.
 * Rejects external URLs, protocol-relative paths (//), encoded bypasses (%2F, %5C),
 * path traversals, control characters, and unsafe schemes.
 *
 * @param path - The candidate redirect path
 * @param fallback - Safe default fallback path (default: '/erp')
 * @returns Sanitized safe internal path
 */
export function sanitizeRedirectPath(path: string | null | undefined, fallback = '/erp'): string {
  if (!path || typeof path !== 'string') return fallback

  const trimmed = path.trim()

  // 1. Must begin with a single forward slash
  if (!trimmed.startsWith('/')) return fallback

  // 2. Reject double slashes anywhere in raw path (e.g. //attacker.com, /erp/..//evil.com)
  if (trimmed.includes('//')) return fallback

  // 3. Reject path traversal sequences
  if (trimmed.includes('/..') || trimmed.includes('../') || trimmed.includes('..\\') || trimmed.includes('\\..')) {
    return fallback
  }

  // 4. Reject backslashes anywhere in raw path
  if (trimmed.includes('\\')) return fallback

  // 5. Reject non-printable ASCII and Unicode control characters
  if (/[\u0000-\u001F\u007F-\u009F]/.test(trimmed)) {
    return fallback
  }

  // 6. Multi-stage iterative percent-decoding check (defend against nested/double-encoded bypasses)
  let decoded = trimmed
  try {
    for (let i = 0; i < 3; i++) {
      const nextDecoded = decodeURIComponent(decoded)
      if (nextDecoded === decoded) break
      decoded = nextDecoded
    }
  } catch {
    // Malformed URI encoding (e.g. %E0%A4) -> reject safely
    return fallback
  }

  // Verify the fully decoded string conforms to safety invariants
  if (!decoded.startsWith('/')) return fallback
  if (decoded.includes('//') || decoded.includes('\\')) return fallback
  if (decoded.includes('/..') || decoded.includes('../')) return fallback
  if (/[\u0000-\u001F\u007F-\u009F]/.test(decoded)) return fallback

  // 7. Ensure no protocol schemes are present before the query string (e.g. /http:attacker.com, /javascript:)
  const pathWithoutQuery = decoded.split('?')[0]
  if (pathWithoutQuery.includes(':')) {
    return fallback
  }

  return trimmed
}
