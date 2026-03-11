// Allowed origins for CORS
// Note: localhost ports are always included because:
// 1. Edge functions are protected by JWT auth (Authorization header)
// 2. CORS is not a security boundary for authenticated APIs
// 3. Development testing requires localhost access even against prod functions
const ALLOWED_ORIGINS = [
  'https://app.welltrained.fitness',
  'https://welltrained.fitness',
  'capacitor://localhost', // iOS app
  'http://localhost', // iOS app fallback
  'http://localhost:5173', // Vite dev server
  'http://localhost:4173', // Vite preview
  'http://127.0.0.1:5173', // Vite alternative
]

/**
 * Get CORS headers for a request.
 * Validates the Origin header against allowed origins.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

/**
 * Security headers to include in all responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'no-store',
}

/**
 * Get all response headers (CORS + security)
 */
export function getResponseHeaders(req: Request): Record<string, string> {
  return {
    ...getCorsHeaders(req),
    ...securityHeaders,
    'Content-Type': 'application/json',
  }
}

// Legacy export for backwards compatibility during migration
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
