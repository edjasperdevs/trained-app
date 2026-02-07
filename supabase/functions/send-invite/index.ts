import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Not authenticated')

    // 2. Admin client (bypasses RLS)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Verify coach role and get coach email
    const { data: profile } = await admin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'coach') {
      throw new Error('Only coaches can send invites')
    }

    // 4. Parse and validate email
    const { email } = await req.json()
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Invalid email address')
    }

    // 5. Prevent self-invite
    if (normalizedEmail === profile.email?.toLowerCase()) {
      throw new Error('You cannot invite yourself')
    }

    // 6. Check if user already exists
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existingProfile) {
      // User exists -- check if already a client
      const { data: existingRelation } = await admin
        .from('coach_clients')
        .select('id')
        .eq('coach_id', user.id)
        .eq('client_id', existingProfile.id)
        .single()

      if (existingRelation) {
        throw new Error('This user is already your client')
      }

      // User exists but not a client -- add directly (no email needed)
      const { error: insertError } = await admin.from('coach_clients').insert({
        coach_id: user.id,
        client_id: existingProfile.id,
        status: 'active',
      })

      if (insertError) throw new Error('Failed to add client')

      return new Response(
        JSON.stringify({ success: true, action: 'added_directly' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. User does not exist -- create/update invite (upsert)
    const { data: invite, error: upsertError } = await admin
      .from('invites')
      .upsert(
        {
          coach_id: user.id,
          email: normalizedEmail,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'coach_id,email' }
      )
      .select('token')
      .single()

    if (upsertError) throw new Error('Failed to create invite')

    // 8. Send email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('Email service not configured')

    const APP_URL = Deno.env.get('APP_URL') || 'https://app.trained.com'
    const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Trained <onboarding@resend.dev>'
    const inviteLink = `${APP_URL}?invite=${invite.token}`

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#1a1a2e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Logo / App Name -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">TRAINED</h1>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="background-color:#16213e;border-radius:12px;padding:40px 32px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#ffffff;">You're invited</h2>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#a0a0b8;">
                Your coach has invited you to join <strong style="color:#ffffff;">Trained</strong> -- a fitness app for tracking workouts, macros, and progress.
              </p>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#a0a0b8;">
                Create your account to get started with your personalized training plan.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background-color:#ef4444;border-radius:8px;">
                    <a href="${inviteLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Create Your Account
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Expiry Note -->
              <p style="margin:0;font-size:13px;line-height:1.5;color:#6b6b80;text-align:center;">
                This invite expires in 7 days. If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#6b6b80;text-align:center;word-break:break-all;">
                ${inviteLink}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4a4a5e;">
                Sent by Trained. You received this because a coach invited you.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [normalizedEmail],
        subject: "You've been invited to Trained",
        html: emailHtml,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      console.error('Resend error:', errBody)
      throw new Error('Failed to send invite email')
    }

    // 9. Return success
    return new Response(
      JSON.stringify({ success: true, action: 'invite_sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
