import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * RFC 5322 compliant email validation regex
 * More robust than simple patterns, catches most edge cases
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/**
 * Validate email address using RFC 5322 compliant regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const normalized = email.trim().toLowerCase()
  if (normalized.length > 254) return false // RFC 5321 limit
  return EMAIL_REGEX.test(normalized)
}

/**
 * Sanitize error message for client response.
 * Only return safe, generic messages to prevent information leakage.
 */
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  'Missing authorization header': 'Authentication required',
  'Not authenticated': 'Authentication required',
  'Only coaches can send invites': 'Permission denied',
  'Invalid email address': 'Invalid email address',
  'You cannot invite yourself': 'Cannot invite yourself',
  'This user is already your client': 'User is already your client',
  'Macro targets not set': 'Please set your macro targets first',
  'Rate limit exceeded': 'Too many requests. Please try again later.',
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Return safe message if we have one, otherwise generic
    return SAFE_ERROR_MESSAGES[error.message] || 'An error occurred. Please try again.'
  }
  return 'An error occurred. Please try again.'
}

/**
 * Log error details server-side without exposing to client
 */
export function logError(context: string, error: unknown, metadata?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(`[${context}] Error:`, message, { ...metadata, stack })
}

/**
 * Rate limiting using Supabase table.
 * Tracks requests per user per action within a time window.
 */
interface RateLimitConfig {
  action: string
  userId: string
  maxRequests: number
  windowMinutes: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { action, userId, maxRequests, windowMinutes } = config
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)

  // Count requests in window
  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart.toISOString())

  if (error) {
    console.error('Rate limit check failed:', error)
    // Fail open - allow request but log error
    return { allowed: true, remaining: maxRequests, resetAt: new Date(Date.now() + windowMinutes * 60 * 1000) }
  }

  const currentCount = count || 0
  const allowed = currentCount < maxRequests

  if (allowed) {
    // Record this request
    await supabase.from('rate_limits').insert({
      user_id: userId,
      action: action,
    })
  }

  return {
    allowed,
    remaining: Math.max(0, maxRequests - currentCount - 1),
    resetAt: new Date(Date.now() + windowMinutes * 60 * 1000),
  }
}

/**
 * Simple in-memory rate limiting (fallback if table doesn't exist)
 * Note: This resets on function cold start, so it's not as reliable
 */
const memoryRateLimits = new Map<string, { count: number; resetAt: number }>()

export function checkMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = memoryRateLimits.get(key)

  if (!record || record.resetAt < now) {
    // Start new window
    memoryRateLimits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count }
}

/**
 * Verify RevenueCat webhook signature (HMAC-SHA256)
 */
export async function verifyRevenueCatSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== computedSignature.length) return false
    let result = 0
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ computedSignature.charCodeAt(i)
    }
    return result === 0
  } catch {
    return false
  }
}

/**
 * Check webhook timestamp to prevent replay attacks
 */
export function isWebhookTimestampValid(
  timestamp: string | null,
  maxAgeMs: number = 5 * 60 * 1000 // 5 minutes
): boolean {
  if (!timestamp) return false

  try {
    const webhookTime = parseInt(timestamp, 10) * 1000 // Convert seconds to ms
    const age = Date.now() - webhookTime
    return age >= 0 && age <= maxAgeMs
  } catch {
    return false
  }
}
