---
phase: 02-invitations
verified: 2026-02-07T21:28:09Z
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "Send invite to new email and check inbox"
    expected: "Branded email arrives with CTA button and 7-day expiry notice"
    why_human: "Actual email delivery requires external service (Resend) and cannot be verified without deployment + RESEND_API_KEY"
  - test: "Sign up with invited email address"
    expected: "User appears in coach's client roster without manual linking"
    why_human: "Requires full auth flow and trigger execution in deployed environment"
  - test: "Send invite to existing user's email"
    expected: "No email sent, user added directly as client with 'Added as client!' feedback"
    why_human: "Requires existing user account in deployed environment"
  - test: "Send duplicate invite to same email"
    expected: "No error, expiry refreshed to 7 days from now, email re-sent"
    why_human: "Requires observing database state and email delivery"
---

# Phase 2: Invitations Verification Report

**Phase Goal:** Coach can invite new clients by email and the coach-client relationship is automatically created when the invite is accepted

**Verified:** 2026-02-07T21:28:09Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Coach enters a client email, clicks send, and a branded invite email arrives in the client's inbox | ⚠️ VERIFIED (code) | Edge Function sends HTML email via Resend API with branded template (dark theme #1a1a2e, red CTA #ef4444, invite link, 7-day expiry notice). Requires deployment + RESEND_API_KEY to test delivery. |
| 2 | Coach can see which invites are pending, accepted, or expired | ✓ VERIFIED | Coach.tsx fetches invites table, computes expired status (expires_at < now), displays pending/expired in status section with pills (yellow for pending, gray for expired), filters out accepted invites. |
| 3 | Sending a second invite to the same email does not create a duplicate (deduplication enforced) | ✓ VERIFIED | Edge Function upserts with `onConflict: 'coach_id,email'`, refreshes expires_at and status='pending'. UNIQUE(coach_id, email) constraint in DB enforces deduplication. |
| 4 | When an invited user completes signup, they appear in the coach's client roster without manual linking | ⚠️ VERIFIED (code) | handle_new_user trigger auto-accepts pending invites matching email, inserts into coach_clients with status='active'. Logic correct in migration and schema.sql. Requires deployed DB to test execution. |

**Score:** 4/4 truths verified (code structure correct, requires deployment for end-to-end testing)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/003_invitations.sql` | Complete migration with invites table, RLS, trigger extension | ✓ VERIFIED | 107 lines. invite_status enum, invites table with all columns, 4 indexes, RLS policy matching coach_clients pattern, handle_new_user extended to auto-accept invites and create coach_clients rows. UNIQUE(coach_id, email) constraint present. |
| `supabase/schema.sql` | Canonical schema with invites additions | ✓ VERIFIED | invites table definition lines 62-73, indexes lines 180-183, RLS policy lines 253-262, updated handle_new_user lines 405-437. All migration content reflected. |
| `src/lib/database.types.ts` | InviteStatus type and invites table types | ✓ VERIFIED | InviteStatus type line 13, invites Row/Insert/Update types lines 117-153, invite_status in Enums line 453. Types match schema exactly. |
| `supabase/functions/_shared/cors.ts` | CORS headers for Edge Functions | ✓ VERIFIED | 5 lines. Exports corsHeaders with origin and Supabase SDK headers (authorization, x-client-info, apikey, content-type). |
| `supabase/functions/send-invite/index.ts` | Complete invite Edge Function | ✓ VERIFIED | 209 lines. CORS preflight, auth verification, coach role check, email validation, self-invite prevention, existing user detection + direct add, invite upsert with onConflict, Resend email with branded HTML template, error handling with corsHeaders. |
| `src/screens/Coach.tsx` | Invite UI with Edge Function invocation | ✓ VERIFIED | 822 lines. Invite modal (lines 772-820) calls functions.invoke('send-invite'), fetchInvites queries invites table (lines 120-151), invite status section (lines 435-478) shows pending/expired with resend action, response-based feedback for added_directly vs invite_sent. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Coach.tsx | send-invite Edge Function | functions.invoke('send-invite', { body: { email } }) | ✓ WIRED | Line 213: client.functions.invoke called in handleInviteClient. Response parsed for action='added_directly' or 'invite_sent'. Error handling for relay errors, network errors, and function errors. |
| Coach.tsx | invites table | from('invites').select() | ✓ WIRED | Line 129-132: fetchInvites queries id, email, status, created_at, expires_at, accepted_at. Result mapped to compute display status (expired if past expires_at). setInvites called with processed data (line 147). |
| send-invite Edge Function | invites table | admin.from('invites').upsert() | ✓ WIRED | Line 88-99: upsert with onConflict on 'coach_id,email', refreshes expires_at and status='pending'. Returns token for email link. |
| send-invite Edge Function | Resend API | fetch('https://api.resend.com/emails') | ✓ WIRED | Line 173-185: POST to Resend with branded HTML email, invite link ${APP_URL}?invite=${token}, from/to/subject. Checks response.ok and throws on failure. |
| send-invite Edge Function | profiles (existing user check) | admin.from('profiles').select() | ✓ WIRED | Line 52-56: queries profiles by email. If exists, checks coach_clients (line 60-65). If not already client, inserts directly into coach_clients (line 72-76) and returns action='added_directly'. |
| handle_new_user trigger | invites table | UPDATE invites SET status='accepted' | ✓ WIRED | schema.sql line 417-424: auto-accepts pending invites matching NEW.email where expires_at > NOW(). Sets accepted_at, accepted_by. |
| handle_new_user trigger | coach_clients table | INSERT INTO coach_clients SELECT FROM invites | ✓ WIRED | schema.sql line 427-433: creates coach-client relationships for accepted invites. Uses INSERT...SELECT with ON CONFLICT DO NOTHING. |
| Coach.tsx invite status section | resend action | onClick={() => handleInviteClient(invite.email)} | ✓ WIRED | Line 470: Resend button calls handleInviteClient with emailOverride param, reusing invite flow. Upsert in Edge Function refreshes expiry. |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| INVITE-01: Coach can enter a client's email and send a branded signup invite via Supabase Edge Function + Resend | ⚠️ SATISFIED (code) | Requires deployment: (1) supabase functions deploy send-invite, (2) supabase secrets set RESEND_API_KEY, (3) verify Resend account setup. Code structure complete. |
| INVITE-02: Invite status is tracked (pending/accepted/expired) with deduplication (one active invite per email) | ✓ SATISFIED | All automated checks passed. invite_status enum with 3 states, UNIQUE(coach_id, email) constraint enforces deduplication, Coach UI displays pending/expired with computed status. |
| INVITE-03: When an invited user signs up, the coach-client relationship is automatically created | ⚠️ SATISFIED (code) | Requires deployed DB to test trigger execution. handle_new_user trigger logic correct: auto-accepts pending invites by email, creates coach_clients rows atomically. |

### Anti-Patterns Found

None. No blockers, warnings, or notable anti-patterns detected.

- No TODO/FIXME comments in functional code (only "placeholder" attribute in email input)
- No console.log-only handlers
- No empty return statements or stub patterns
- All state changes (setInvites, setClients, setInviteStatus) are wired correctly
- Error handling is comprehensive (network errors, relay errors, function errors)
- Dev bypass mode is functional and doesn't break production paths

### Human Verification Required

**Critical verification path:** The phase goal requires end-to-end testing of the invitation flow in a deployed environment with external services configured.

#### 1. Email Delivery Test

**Test:** 
1. Deploy send-invite Edge Function to Supabase
2. Configure Resend API key: `supabase secrets set RESEND_API_KEY=re_xxxxx`
3. Open coach dashboard, click "+ Invite Client"
4. Enter a valid email address (one you can check)
5. Click "Send Invite"
6. Check the email inbox

**Expected:**
- "Invite sent!" success message appears in Coach UI
- Within 1-2 minutes, branded email arrives with:
  - Subject: "You've been invited to Trained"
  - Dark background (#1a1a2e) with white text
  - Red CTA button (#ef4444) saying "Create Your Account"
  - Invite link: `https://app.trained.com?invite={token}`
  - Expiry notice: "This invite expires in 7 days"
  - Footer: "Sent by Trained"

**Why human:** Requires external email service (Resend) configured and deployed Edge Function. Cannot verify email delivery without live environment.

#### 2. Auto-Link on Signup Test

**Test:**
1. After receiving invite email (from test 1), click the CTA button
2. Complete signup flow with the invited email address
3. Return to coach dashboard and check client roster

**Expected:**
- New user appears in "Active Clients" list
- Invite moves from "Pending Invites" section to accepted (filtered out of pending section)
- No manual linking action required by coach
- Client count increments by 1

**Why human:** Requires full signup auth flow and database trigger execution in deployed environment. Cannot verify trigger wiring without live database.

#### 3. Existing User Direct Add Test

**Test:**
1. Create a second user account (not yet a client of the coach)
2. From coach dashboard, invite that user's email
3. Observe coach dashboard immediately

**Expected:**
- No email sent
- Success message: "User already had an account -- added as client!"
- User appears immediately in "Active Clients" list
- No entry in "Pending Invites" section

**Why human:** Requires existing user account in deployed environment. Edge Function logic for direct add cannot be tested without profiles table populated.

#### 4. Deduplication Test

**Test:**
1. Send invite to a new email (appears in Pending Invites)
2. Wait 10 seconds
3. Click "Resend" button on that pending invite
4. Check database: `SELECT * FROM invites WHERE email = '{email}'`
5. Observe expires_at timestamp

**Expected:**
- "Invite sent!" success message appears
- Only ONE row in invites table for that coach+email pair
- expires_at timestamp is refreshed to 7 days from second send (not original send)
- Email is re-sent (second email arrives in inbox)

**Why human:** Requires observing database state and email delivery. Upsert logic correct in code, but confirmation requires deployed environment.

### Gaps Summary

No gaps blocking goal achievement. All code artifacts are complete and wired correctly:

- **Database layer (Plan 02-01):** invites table with status lifecycle, UNIQUE constraint for deduplication, RLS for coach-only access, handle_new_user trigger extension to auto-accept and create coach_clients rows — all verified in migration and schema.sql.

- **Edge Function layer (Plan 02-02):** send-invite function with CORS, auth, coach role verification, email validation, self-invite prevention, existing user detection + direct add, invite upsert with onConflict, branded HTML email via Resend API — all verified in code.

- **UI layer (Plan 02-03):** Invite Client modal calling functions.invoke('send-invite'), invite status section showing pending/expired invites with resend action, response-based feedback (invite_sent vs added_directly) — all verified in Coach.tsx.

**Deployment prerequisite:** Phase goal cannot be fully achieved without:
1. Applying migration 003_invitations.sql to Supabase database
2. Deploying send-invite Edge Function: `supabase functions deploy send-invite`
3. Configuring secrets: `supabase secrets set RESEND_API_KEY=re_xxxxx`
4. Creating Resend account and verifying API key (optional: verify sending domain)

These are documented in 02-02-SUMMARY.md "User Setup Required" section.

---

_Verified: 2026-02-07T21:28:09Z_
_Verifier: Claude (gsd-verifier)_
