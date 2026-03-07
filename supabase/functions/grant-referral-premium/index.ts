import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { securityHeaders } from '../_shared/cors.ts'
import { grantPromotionalEntitlement } from '../_shared/revenuecat.ts'

interface RequestBody {
  userId: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: securityHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: securityHeaders })
  }

  // Verify JWT from Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401, headers: securityHeaders })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  // Verify JWT and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    console.error('[grant-referral-premium] Auth error:', authError)
    return new Response('Unauthorized', { status: 401, headers: securityHeaders })
  }

  try {
    const body: RequestBody = await req.json()

    // Security: Only allow granting to the authenticated user
    if (body.userId !== user.id) {
      console.error('[grant-referral-premium] User ID mismatch')
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user was actually referred (has a referral record as recruit)
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: referral, error: referralError } = await adminSupabase
      .from('referrals')
      .select('id')
      .eq('recruit_id', user.id)
      .single()

    if (referralError || !referral) {
      console.log('[grant-referral-premium] User not referred, skipping:', user.id)
      return new Response(JSON.stringify({ skipped: 'not_referred' }), {
        status: 200,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Grant 7-day (weekly) promotional entitlement
    const result = await grantPromotionalEntitlement(user.id, 'premium', 'weekly')

    if (!result.success) {
      console.error('[grant-referral-premium] Grant failed:', result.error)
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[grant-referral-premium] Granted 7-day premium to:', user.id)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[grant-referral-premium] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    })
  }
})
