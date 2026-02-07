---
phase: 02-invitations
plan: 02
subsystem: api
tags: [supabase, edge-functions, deno, resend, email, cors, invites]

# Dependency graph
requires:
  - phase: 02-invitations plan 01
    provides: invites table, RLS policies, handle_new_user trigger extension
provides:
  - Shared CORS headers for all Edge Functions
  - Complete send-invite Edge Function (auth, validation, upsert, email)
affects: [02-invitations plan 03 (coach UI invokes this function), deployment (requires RESEND_API_KEY secret)]

# Tech tracking
tech-stack:
  added: [Resend API (email delivery via REST), Supabase Edge Functions (Deno runtime)]
  patterns: [Edge Function with service role admin client, shared _shared/ helpers, Resend REST integration]

key-files:
  created:
    - supabase/functions/_shared/cors.ts
    - supabase/functions/send-invite/index.ts
  modified: []

key-decisions:
  - "EMAIL_FROM read from env with fallback to Resend test domain (onboarding@resend.dev)"
  - "APP_URL env var with fallback to https://app.trained.com"
  - "Invite link uses ?invite=token parameter on normal signup URL (not magic link)"

patterns-established:
  - "Edge Function pattern: CORS preflight -> auth -> admin client -> business logic -> response with corsHeaders"
  - "Shared CORS headers in supabase/functions/_shared/cors.ts imported by all functions"
  - "Resend integration via direct fetch to api.resend.com (no SDK)"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 2 Plan 2: Send-Invite Edge Function Summary

**Supabase Edge Function with Resend email integration handling coach auth, existing user detection, invite upsert with dedup, and branded HTML email**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T21:13:36Z
- **Completed:** 2026-02-07T21:15:54Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Created shared CORS helper reusable by all future Edge Functions
- Built complete send-invite Edge Function handling all 5 invite scenarios (auth failure, not coach, self-invite, existing user, new user)
- Existing users are detected and added directly as clients without email (Pitfall 3 from research handled)
- Invite deduplication via upsert with onConflict on (coach_id, email) -- resend refreshes expiry (Pitfall 4 handled)
- Self-invite prevention with explicit error message (Pitfall 5 handled)
- Branded HTML email with dark theme (#1a1a2e), red CTA (#ef4444), inline CSS, table-based layout for email client compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CORS helper** - `4f426128` (feat)
2. **Task 2: Create send-invite Edge Function** - `ecb48f19` (feat)

## Files Created/Modified
- `supabase/functions/_shared/cors.ts` - Shared CORS headers (origin, Supabase SDK headers)
- `supabase/functions/send-invite/index.ts` - Complete invite Edge Function (208 lines)

## Decisions Made
- EMAIL_FROM env var with fallback to `Trained <onboarding@resend.dev>` (Resend test domain) for development -- production will set a verified domain
- APP_URL env var with fallback to `https://app.trained.com` -- configurable per environment
- Invite link format `?invite=token` on normal signup URL -- auto-link trigger matches by email, token kept for potential future custom landing page
- Error on insert failure for direct client add (checks insertError explicitly)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

External services require manual configuration before the Edge Function works:

**Resend (email delivery):**
1. Create account at https://resend.com/signup
2. Get API key from Resend Dashboard -> API Keys
3. (Optional) Verify sending domain for production use

**Supabase secrets:**
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxx
supabase secrets set APP_URL=https://your-app-url.com
supabase secrets set EMAIL_FROM="Trained <noreply@yourdomain.com>"  # optional
```

**Deploy the function:**
```bash
supabase functions deploy send-invite
```

## Next Phase Readiness
- Edge Function code is complete and ready for deployment
- 02-03 (Coach UI) can now invoke `supabase.functions.invoke('send-invite', { body: { email } })` and handle the response
- Function returns `{ action: 'added_directly' }` or `{ action: 'invite_sent' }` for UI differentiation

## Self-Check: PASSED

---
*Phase: 02-invitations*
*Completed: 2026-02-07*
