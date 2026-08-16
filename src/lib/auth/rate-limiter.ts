// ============================================================
// In-Memory Login Rate Limiter & Throttling
// Roshani Public School ERP
// ============================================================

interface RateLimitRecord {
  failures: number
  firstFailureTimestamp: number
  lastFailureTimestamp: number
  lockedUntil?: number
}

const RATE_LIMIT_MAP = new Map<string, RateLimitRecord>()

// Configuration
const WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const MAX_FAILURES_BEFORE_LOCKOUT = 5
const LOCKOUT_DURATION_MS = 60 * 1000 // 60 seconds temporary throttle
const PROGRESSIVE_DELAY_THRESHOLD = 3
const PROGRESSIVE_DELAY_MS = 800
const MAX_MAP_SIZE = 5000 // Memory boundary limit

/**
 * Normalizes an identifier (e.g. lowercase email / IP).
 * Trims whitespace, removes non-printable chars, clamps length, and lowercases.
 */
export function normalizeIdentifier(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return 'anonymous_client'
  return raw
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .toLowerCase()
    .slice(0, 255)
}

/**
 * Prunes expired records when map exceeds safety bounds.
 */
function pruneExpiredEntries(now: number): void {
  if (RATE_LIMIT_MAP.size < MAX_MAP_SIZE) return

  for (const [key, record] of RATE_LIMIT_MAP.entries()) {
    const isExpired = now - record.firstFailureTimestamp > WINDOW_MS
    const isLockoutExpired = !record.lockedUntil || record.lockedUntil <= now
    if (isExpired && isLockoutExpired) {
      RATE_LIMIT_MAP.delete(key)
    }
  }
}

/**
 * Checks whether an attempt is currently permitted for the given identifier.
 */
export function checkLoginRateLimit(identifier: string): {
  allowed: boolean
  retryAfterSeconds?: number
  delayMs?: number
  message?: string
} {
  const key = normalizeIdentifier(identifier)
  const now = Date.now()
  const record = RATE_LIMIT_MAP.get(key)

  if (!record) {
    return { allowed: true, delayMs: 0 }
  }

  // If window expired and not locked, reset
  if (!record.lockedUntil && now - record.firstFailureTimestamp > WINDOW_MS) {
    RATE_LIMIT_MAP.delete(key)
    return { allowed: true, delayMs: 0 }
  }

  // Check active lockout
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000)
    return {
      allowed: false,
      retryAfterSeconds: remainingSeconds,
      message: `Too many failed login attempts. Please wait ${remainingSeconds} second(s) before trying again.`,
    }
  }

  // If lockout expired, reset lockout state
  if (record.lockedUntil && record.lockedUntil <= now) {
    RATE_LIMIT_MAP.delete(key)
    return { allowed: true, delayMs: 0 }
  }

  // Check progressive delay threshold
  if (record.failures >= PROGRESSIVE_DELAY_THRESHOLD) {
    return { allowed: true, delayMs: PROGRESSIVE_DELAY_MS }
  }

  return { allowed: true, delayMs: 0 }
}

/**
 * Records a failed attempt for the identifier and calculates lockout if threshold reached.
 */
export function recordFailedAttempt(identifier: string): { locked: boolean; retryAfterSeconds?: number } {
  const key = normalizeIdentifier(identifier)
  const now = Date.now()

  pruneExpiredEntries(now)

  const record = RATE_LIMIT_MAP.get(key)

  if (!record || now - record.firstFailureTimestamp > WINDOW_MS) {
    RATE_LIMIT_MAP.set(key, {
      failures: 1,
      firstFailureTimestamp: now,
      lastFailureTimestamp: now,
    })
    return { locked: false }
  }

  record.failures += 1
  record.lastFailureTimestamp = now

  if (record.failures >= MAX_FAILURES_BEFORE_LOCKOUT) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS
    const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000)
    return { locked: true, retryAfterSeconds }
  }

  return { locked: false }
}

/**
 * Resets rate limit tracking upon successful authentication.
 */
export function recordSuccessfulAttempt(identifier: string): void {
  const key = normalizeIdentifier(identifier)
  RATE_LIMIT_MAP.delete(key)
}

/**
 * Test helper to clear state.
 */
export function resetRateLimits(): void {
  RATE_LIMIT_MAP.clear()
}

/**
 * Observability helper returning current tracked records count.
 */
export function getActiveRateLimitCount(): number {
  return RATE_LIMIT_MAP.size
}

