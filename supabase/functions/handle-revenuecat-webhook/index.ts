import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')!

// RevenueCat webhook event types that indicate active subscription
const ACTIVE_EVENTS = [
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
]

// Event types that indicate inactive/cancelled subscription
const INACTIVE_EVENTS = [
  'CANCELLATION',
  'EXPIRATION',
  'BILLING_ISSUE',
]

interface RevenueCatEvent {
  event: {
    type: string
    app_user_id: string
    entitlement_ids: string[]
    product_id: string
    expiration_at_ms: number | null
    environment: 'SANDBOX' | 'PRODUCTION'
  }
}

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Verify authorization header (Bearer token)
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
    console.error('Unauthorized webhook request')
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const payload: RevenueCatEvent = await req.json()
    const { type, app_user_id, entitlement_ids, product_id, expiration_at_ms, environment } = payload.event

    console.log(`RevenueCat webhook: ${type} for user ${app_user_id}`)

    // Skip $RCAnonymousID users (SDK not configured with real user ID)
    if (app_user_id.startsWith('$RCAnonymousID')) {
      console.warn('Skipping anonymous user webhook')
      return new Response(JSON.stringify({ skipped: 'anonymous_user' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Skip sandbox events in production deployment (optional - can be configured)
    const isProduction = !!Deno.env.get('DENO_DEPLOYMENT_ID')
    if (environment === 'SANDBOX' && isProduction) {
      console.log('Skipping sandbox event in production')
      return new Response(JSON.stringify({ skipped: 'sandbox' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Determine if subscription is active based on event type
    const isActive = ACTIVE_EVENTS.includes(type) && !INACTIVE_EVENTS.includes(type)

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Upsert subscription record (user_id is unique constraint)
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: app_user_id,
      event_type: type,
      entitlements: entitlement_ids || [],
      product_id: product_id || null,
      expires_at: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
      is_active: isActive,
      environment: environment,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Subscription updated: user=${app_user_id}, active=${isActive}`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
