import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Parse submission_id from body
    const { submission_id } = await req.json()
    if (!submission_id) throw new Error('Missing submission_id')

    // 2. Admin client (bypasses RLS)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Fetch submission
    const { data: submission, error: fetchError } = await admin
      .from('intake_submissions')
      .select('id, full_name, email, primary_goal, training_experience, training_days_per_week, commitment_level, why_now, status, created_at')
      .eq('id', submission_id)
      .single()

    if (fetchError || !submission) {
      throw new Error('Submission not found')
    }

    // 4. Idempotency guard -- only notify for new submissions
    if (submission.status !== 'new') {
      return new Response(
        JSON.stringify({ success: true, action: 'already_processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Send notification email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('Email service not configured')

    const APP_URL = Deno.env.get('APP_URL') || 'https://app.welltrained.fitness'
    const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Trained <noreply@contact.welltrained.fitness>'

    const truncatedWhyNow = submission.why_now
      ? submission.why_now.length > 200
        ? submission.why_now.slice(0, 200) + '...'
        : submission.why_now
      : 'Not provided'

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
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#ffffff;">New Intake Completed</h2>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#a0a0b8;">
                A new client has submitted their intake form. Here's a quick summary:
              </p>
              <!-- Data Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 16px;border-bottom:1px solid #2a2a4e;">
                    <span style="font-size:13px;color:#6b6b80;">Name</span><br>
                    <span style="font-size:15px;color:#ffffff;font-weight:500;">${submission.full_name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;border-bottom:1px solid #2a2a4e;">
                    <span style="font-size:13px;color:#6b6b80;">Email</span><br>
                    <span style="font-size:15px;color:#ffffff;font-weight:500;">${submission.email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;border-bottom:1px solid #2a2a4e;">
                    <span style="font-size:13px;color:#6b6b80;">Primary Goal</span><br>
                    <span style="font-size:15px;color:#ffffff;font-weight:500;">${submission.primary_goal || 'Not specified'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;border-bottom:1px solid #2a2a4e;">
                    <span style="font-size:13px;color:#6b6b80;">Training Experience</span><br>
                    <span style="font-size:15px;color:#ffffff;font-weight:500;">${submission.training_experience || 'Not specified'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;border-bottom:1px solid #2a2a4e;">
                    <span style="font-size:13px;color:#6b6b80;">Training Days/Week</span><br>
                    <span style="font-size:15px;color:#ffffff;font-weight:500;">${submission.training_days_per_week ?? 'Not specified'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;border-bottom:1px solid #2a2a4e;">
                    <span style="font-size:13px;color:#6b6b80;">Commitment Level</span><br>
                    <span style="font-size:15px;color:#ffffff;font-weight:500;">${submission.commitment_level != null ? submission.commitment_level + '/10' : 'Not specified'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;">
                    <span style="font-size:13px;color:#6b6b80;">Why Now</span><br>
                    <span style="font-size:15px;color:#ffffff;font-weight:500;line-height:1.4;">${truncatedWhyNow}</span>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background-color:#ef4444;border-radius:8px;">
                    <a href="${APP_URL}/coach" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Review Intake
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4a4a5e;">
                Sent by Trained. You received this because a new intake was submitted.
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
        to: ['coachjasper@welltrained.fitness'],
        subject: `New Intake Completed — ${submission.full_name}`,
        html: emailHtml,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      console.error('Resend error:', errBody)
      throw new Error('Failed to send notification email')
    }

    // 6. Return success
    return new Response(
      JSON.stringify({ success: true, action: 'notification_sent' }),
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
