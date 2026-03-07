import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getResponseHeaders, securityHeaders } from '../_shared/cors.ts'

const COMPLETION_THRESHOLD_DAYS = 7

interface DailyLog {
  date: string
  total: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getResponseHeaders(req) })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: getResponseHeaders(req) })
  }

  // Verify JWT from Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401, headers: getResponseHeaders(req) })
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  // Verify JWT and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    console.error('[check-recruit-completion] Auth error:', authError)
    return new Response('Unauthorized', { status: 401, headers: getResponseHeaders(req) })
  }

  try {
    // Get admin client for cross-user queries
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find pending referrals where this user is the referrer
    const { data: pendingReferrals, error: referralError } = await adminSupabase
      .from('referrals')
      .select('id, recruit_id, created_at')
      .eq('referrer_id', user.id)
      .eq('status', 'pending')

    if (referralError) {
      console.error('[check-recruit-completion] Referral query error:', referralError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!pendingReferrals || pendingReferrals.length === 0) {
      return new Response(JSON.stringify({ checked: 0, completed: [] }), {
        status: 200,
        headers: getResponseHeaders(req),
      })
    }

    const completedRecruits: string[] = []

    for (const referral of pendingReferrals) {
      // Check if recruit has been active for at least 7 days since signup
      const signupDate = new Date(referral.created_at)
      const daysSinceSignup = Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceSignup < COMPLETION_THRESHOLD_DAYS) {
        // Not enough time has passed yet
        continue
      }

      // Query recruit's daily_logs from user_xp table
      const { data: xpData, error: xpError } = await adminSupabase
        .from('user_xp')
        .select('daily_logs')
        .eq('id', referral.recruit_id)
        .single()

      if (xpError || !xpData?.daily_logs) {
        // No DP data yet, skip
        continue
      }

      // Check if recruit has 7 distinct days with DP activity
      const dailyLogs: DailyLog[] = xpData.daily_logs || []
      const activeDays = dailyLogs.filter(log => log.total > 0).length

      if (activeDays >= COMPLETION_THRESHOLD_DAYS) {
        // Recruit completed! Update referral status
        const { error: updateError } = await adminSupabase.rpc('complete_referral', {
          p_referral_id: referral.id,
          p_dp_awarded: 100,
        })

        if (updateError) {
          console.error('[check-recruit-completion] Update error:', updateError)
        } else {
          completedRecruits.push(referral.recruit_id)
          console.log('[check-recruit-completion] Recruit completed:', referral.recruit_id)
        }
      }
    }

    return new Response(JSON.stringify({
      checked: pendingReferrals.length,
      completed: completedRecruits
    }), {
      status: 200,
      headers: getResponseHeaders(req),
    })
  } catch (error) {
    console.error('[check-recruit-completion] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: getResponseHeaders(req),
    })
  }
})
