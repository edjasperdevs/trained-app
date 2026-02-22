import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendAPNs } from '../_shared/apns.ts'

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: Record<string, unknown>
  old_record: Record<string, unknown> | null
}

/**
 * Map webhook table + record to notification details for the target client.
 * Returns null if the action should not trigger a notification (e.g., self-set macros).
 */
function getNotificationDetails(payload: WebhookPayload): {
  clientId: string
  title: string
  body: string
  route: string
} | null {
  const { table, record, old_record } = payload

  switch (table) {
    case 'assigned_workouts':
      return {
        clientId: record.client_id as string,
        title: 'New Workout Assigned',
        body: 'Your coach assigned a new workout',
        route: '/workouts',
      }

    case 'macro_targets':
      // Only notify on coach-set changes, not self-edits
      if (record.set_by !== 'coach') return null
      return {
        clientId: record.user_id as string,
        title: 'Macros Updated',
        body: 'Your coach updated your macro targets',
        route: '/macros',
      }

    case 'weekly_checkins':
      // Only notify when coach_response is newly added (not edited)
      if (!record.coach_response || old_record?.coach_response) return null
      return {
        clientId: record.client_id as string,
        title: 'Check-in Reviewed',
        body: 'Your coach responded to your weekly check-in',
        route: '/',
      }

    default:
      return null
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: WebhookPayload = await req.json()
    const details = getNotificationDetails(payload)

    if (!details) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client to read device tokens (bypasses RLS)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: tokens } = await admin
      .from('device_tokens')
      .select('token')
      .eq('user_id', details.clientId)

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sent = 0
    for (const device of tokens) {
      const result = await sendAPNs(device.token, {
        title: details.title,
        body: details.body,
        data: { route: details.route },
      })
      if (result.success) sent++
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
