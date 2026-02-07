# Phase 2: Invitations - Research

**Researched:** 2026-02-07
**Domain:** Supabase Edge Functions, Resend email API, invite lifecycle, PostgreSQL triggers, coach-client relationship creation
**Confidence:** HIGH

## Summary

Phase 2 introduces the invite-by-email flow: coach enters a client email, a branded invite email is sent via a Supabase Edge Function calling the Resend API, the invite is tracked in a new `invites` table, and when the invited user signs up, the coach-client relationship is automatically created via a PostgreSQL trigger.

The standard approach uses three layers: (1) a new `invites` table with deduplication and expiry, (2) a Supabase Edge Function that validates the coach, creates the invite record, and sends the email via Resend, and (3) a database trigger on `auth.users` INSERT that checks for pending invites and auto-creates the `coach_clients` row. The coach dashboard UI gets an invite management section showing pending/accepted/expired invites.

**Primary recommendation:** Use a Supabase Edge Function + Resend for email delivery (not Supabase built-in email). Track invites in a dedicated `invites` table with status lifecycle. Auto-link on signup via an extension of the existing `handle_new_user` trigger. The invite link points to the app's normal signup page with an invite token in the URL that gets stored in the user's metadata.

## Standard Stack

No new frontend dependencies needed. The Edge Function runs on Deno (Supabase's runtime) and calls Resend's REST API directly -- no SDK needed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase Edge Functions | Deno runtime | Server-side invite logic (validate, create record, send email) | Already part of the Supabase platform, no additional infrastructure |
| Resend API | REST v1 | Email delivery | Specified in REQUIREMENTS.md (INVITE-01). 100 emails/day free tier is sufficient for single-coach onboarding batches |
| PostgreSQL triggers | N/A | Auto-create coach_clients on signup | Existing pattern (`handle_new_user` trigger already creates profiles) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase CLI | Latest | Create/deploy Edge Functions, manage secrets | Development and deployment |
| `crypto.randomUUID()` | Built-in (Deno) | Generate invite tokens | Token creation in Edge Function |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | SendGrid, Postmark | Resend is simpler (single API call, no SDK needed), requirements specify it, free tier covers the use case |
| Edge Function | `auth.admin.inviteUserByEmail()` | Built-in invite creates a Supabase magic link -- less control over email branding, subject to built-in rate limits (2-3/hr default), email scanners can consume the token |
| Edge Function | Supabase Send Email Hook | Hook replaces ALL auth emails (signup confirmation, password reset) -- too broad for just invites. Edge Function is targeted. |
| PostgreSQL trigger for auto-link | Edge Function on signup | Trigger is simpler, runs in the same transaction as user creation, no extra network call. Edge Function would need to detect "is this a signup from an invite?" separately |

**Installation:**
```bash
# Initialize Supabase CLI (if not already done)
supabase init

# Create the Edge Function
supabase functions new send-invite

# Set Resend API key as secret
supabase secrets set RESEND_API_KEY=re_xxxxxxx
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/
  functions/
    _shared/
      cors.ts              # Shared CORS headers
    send-invite/
      index.ts             # Edge Function: validate coach, create invite, send email
  migrations/
    003_invitations.sql    # invites table, RLS, trigger extension

src/
  screens/
    Coach.tsx              # MODIFY: add invite management section (replace "Add Client" modal)
  lib/
    database.types.ts      # MODIFY: add invites table types
```

### Pattern 1: Invite Lifecycle (State Machine)

**What:** Each invite follows a status lifecycle: `pending` -> `accepted` or `expired`. Deduplication enforced by unique constraint on `(coach_id, email)` filtered to non-expired/non-accepted status.

**When to use:** Always -- this is the core data model.

**Schema:**
```sql
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status invite_status DEFAULT 'pending' NOT NULL,
  token UUID DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Deduplication: one active invite per email per coach
  CONSTRAINT unique_active_invite UNIQUE (coach_id, email)
);

CREATE INDEX idx_invites_coach ON invites(coach_id);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_status ON invites(coach_id, status);
```

**Status transitions:**
- `pending` -> `accepted`: When invited user signs up (trigger sets this)
- `pending` -> `expired`: When `NOW() > expires_at` (checked on read, no cron needed)
- Resend: Coach can resend to same email -- updates `expires_at` and `updated_at` on existing row (upsert)

### Pattern 2: Edge Function for Invite Sending

**What:** A Supabase Edge Function handles the invite flow: validates the coach's identity, checks for duplicates, creates/updates the invite record, and sends the email via Resend.

**Why Edge Function (not client-side):** The Edge Function has access to the `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS to insert invites regardless of who the email belongs to) and the `RESEND_API_KEY` (secret that must not be exposed to the browser).

**Implementation:**
```typescript
// supabase/functions/send-invite/index.ts
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify the caller is authenticated and is a coach
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Use service role client for admin operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify coach role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'coach') throw new Error('Not a coach')

    // 2. Parse request
    const { email } = await req.json()
    if (!email) throw new Error('Email required')

    // 3. Validate email, check deduplication
    // ... (see Code Examples section)

    // 4. Create/update invite record
    // ... (upsert with ON CONFLICT)

    // 5. Send email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Trained <noreply@yourdomain.com>',
        to: [email],
        subject: 'You\'ve been invited to Trained',
        html: `<branded invite email HTML>`,
      }),
    })

    // 6. Return success
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### Pattern 3: Auto-Link on Signup via Trigger

**What:** Extend the existing `handle_new_user` trigger to check the `invites` table when a new user signs up. If a pending invite exists for that email, automatically create the `coach_clients` relationship and mark the invite as accepted.

**Why trigger (not Edge Function):** The trigger runs in the same transaction as user creation -- atomic, no race conditions, no extra network call. The existing `handle_new_user` trigger already creates the profile row; extending it is natural.

**Implementation:**
```sql
-- Modify existing handle_new_user to also check invites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile (existing)
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  -- Create XP record (existing)
  INSERT INTO public.user_xp (user_id)
  VALUES (NEW.id);

  -- NEW: Check for pending invites and auto-link
  UPDATE public.invites
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW();

  -- If invite was accepted, create coach-client relationship
  INSERT INTO public.coach_clients (coach_id, client_id, status)
  SELECT i.coach_id, NEW.id, 'active'
  FROM public.invites i
  WHERE i.email = NEW.email
    AND i.status = 'accepted'
    AND i.accepted_by = NEW.id
  ON CONFLICT (coach_id, client_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Pattern 4: Client-Side Invoke from Coach Dashboard

**What:** The coach dashboard calls the Edge Function via `supabase.functions.invoke()`. The SDK automatically passes the auth token.

**Implementation:**
```typescript
// In Coach.tsx
const handleSendInvite = async (email: string) => {
  const client = getSupabaseClient()
  const { data, error } = await client.functions.invoke('send-invite', {
    body: { email },
  })
  if (error) {
    toast.error(error.message || 'Failed to send invite')
  } else {
    toast.success('Invite sent!')
    fetchInvites() // Refresh invite list
  }
}
```

### Anti-Patterns to Avoid

- **Anti-pattern: Using `auth.admin.inviteUserByEmail()` from the client.** This requires the service role key, which MUST NOT be exposed to the browser. It also uses Supabase's built-in email template which cannot be branded.
- **Anti-pattern: Sending email directly from the browser.** The Resend API key would be exposed in the client bundle. All email sending must go through the Edge Function.
- **Anti-pattern: Storing invite tokens in localStorage.** Invite tokens are server-side only. The client never needs to know the token -- it is embedded in the invite email link.
- **Anti-pattern: Using a separate auth flow for invited users.** Invited users use the SAME signup flow as any other user. The `handle_new_user` trigger handles the auto-linking transparently. No special "invite signup" page is needed.
- **Anti-pattern: Creating the `coach_clients` row in the Edge Function.** The Edge Function sends the invite. The trigger creates the relationship on signup. Separating these concerns keeps the flow clean and atomic.
- **Anti-pattern: Polling for expired invites with a cron job.** Check expiry on read (`WHERE expires_at > NOW()` in queries). No background job needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery | Custom SMTP client | Resend REST API (single POST) | Deliverability, DKIM/SPF handled by Resend, tracking built-in |
| Invite tokens | Custom token generation | `uuid_generate_v4()` in PostgreSQL | Cryptographically random, unique constraint enforced at DB level |
| Auth token verification | Manual JWT parsing in Edge Function | `supabase.auth.getUser()` with forwarded Authorization header | Handles token refresh, expiry, and validation correctly |
| CORS handling | Custom middleware | Shared `_shared/cors.ts` pattern | Supabase recommended pattern, handles preflight correctly |
| Deduplication | Client-side checks before sending | Database UNIQUE constraint `(coach_id, email)` | Race conditions impossible -- DB enforces atomically |
| Invite expiry | Cron job to mark expired | `WHERE expires_at > NOW()` in queries | Simpler, no infrastructure, correct by definition |
| Auto-link on signup | Webhook or separate function | PostgreSQL trigger extending `handle_new_user` | Atomic (same transaction as user creation), no extra network call |

**Key insight:** The invite system is fundamentally a database state machine (pending -> accepted/expired) with an email side-effect. Keep the state transitions in PostgreSQL and the email sending in the Edge Function. No client-side state management needed for invites -- they are server-authoritative coach-owned data.

## Common Pitfalls

### Pitfall 1: Supabase Built-in Email Rate Limits
**What goes wrong:** If using Supabase's default SMTP for auth emails, rate limits are 2-3 emails per hour. Even with custom SMTP configured, the default starts at 30/hour. This blocks the coach from inviting more than a handful of clients.
**Why it happens:** Supabase's built-in email is designed for auth confirmation, not bulk sending.
**How to avoid:** Use the Edge Function + Resend pattern. Resend's free tier allows 100 emails/day. The coach never interacts with Supabase's email system for invites.
**Warning signs:** Coach gets 429 errors after sending a few invites. Invites "sent" but never arrive.

### Pitfall 2: Email Scanners Consuming Invite Links
**What goes wrong:** Corporate email scanners (Microsoft SafeLinks, Proofpoint) follow all links in emails to check for malware. If the invite link is a one-time-use magic link, the scanner "uses" it before the human user clicks.
**Why it happens:** The invite link points directly to a Supabase auth endpoint that consumes the token on first visit.
**How to avoid:** Do NOT use Supabase magic links for invites. Instead, the invite email links to the app's normal signup page: `https://app.trained.com?invite=<token>`. The token is stored in the URL, and the app passes it as user metadata during signup. The trigger checks for pending invites by EMAIL, not by token -- so even if a scanner visits the URL, nothing is consumed.
**Warning signs:** Users report "invite expired" when they click the link hours after receiving it.

### Pitfall 3: Race Condition Between Invite and Existing User
**What goes wrong:** Coach invites `client@email.com`. That person already has an account. The `handle_new_user` trigger never fires (no new signup). The invite stays `pending` forever.
**Why it happens:** The auto-link logic only runs on `auth.users` INSERT (new signups). Existing users never trigger it.
**How to avoid:** In the Edge Function, BEFORE sending the email, check if a user with that email already exists in `profiles`. If they do, skip the email and directly create the `coach_clients` relationship (or show the coach "This user already has an account -- added directly"). If they do NOT exist, send the invite email.
**Warning signs:** Coach invites an existing user, invite shows "pending" indefinitely, user never appears in roster.

### Pitfall 4: Duplicate Invites Creating Multiple Relationships
**What goes wrong:** Coach accidentally sends two invites to the same email. When the user signs up, the trigger creates two `coach_clients` rows.
**Why it happens:** The `invites` table allows multiple rows for the same email (different invite IDs).
**How to avoid:** Use `UNIQUE (coach_id, email)` constraint on the `invites` table. When coach re-invites the same email, UPSERT (update the existing row with new `expires_at`). The trigger uses `ON CONFLICT (coach_id, client_id) DO NOTHING` on the `coach_clients` insert.
**Warning signs:** Coach sees duplicate entries in their client roster for the same person.

### Pitfall 5: Coach Self-Invite
**What goes wrong:** Coach enters their own email as a client invite. This would create a circular coach-client relationship where the coach is both coach and client of themselves.
**Why it happens:** No validation preventing self-invite.
**How to avoid:** In the Edge Function, compare the invite email with the coach's own email. Reject with error message: "You cannot invite yourself."
**Warning signs:** Coach appears in their own client roster.

### Pitfall 6: Edge Function Not Deployed or Misconfigured
**What goes wrong:** The Edge Function exists in the repo but has not been deployed. Or the RESEND_API_KEY secret is not set. The coach clicks "Send Invite" and gets a cryptic error.
**Why it happens:** Edge Functions require separate deployment (`supabase functions deploy`) and secret configuration (`supabase secrets set`). These are not part of the normal `npm run build` or database migration flow.
**How to avoid:** Document the deployment steps. Add a pre-deployment checklist. Test the function locally first with `supabase functions serve`. Handle errors gracefully in the UI (show "Invite service not configured" if the function returns a 500).
**Warning signs:** 500 errors when sending invites. "FunctionsRelayError" in the console.

## Code Examples

### Example 1: Complete Edge Function (`send-invite/index.ts`)

```typescript
// supabase/functions/send-invite/index.ts
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Not authenticated')

    // Admin client (bypasses RLS)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify coach role
    const { data: profile } = await admin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'coach') {
      throw new Error('Only coaches can send invites')
    }

    // Parse and validate email
    const { email } = await req.json()
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Invalid email address')
    }

    // Prevent self-invite
    if (normalizedEmail === profile.email?.toLowerCase()) {
      throw new Error('You cannot invite yourself')
    }

    // Check if user already exists and is already a client
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

      // User exists but not a client -- add directly
      await admin.from('coach_clients').insert({
        coach_id: user.id,
        client_id: existingProfile.id,
        status: 'active',
      })

      return new Response(
        JSON.stringify({ success: true, action: 'added_directly' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // User does not exist -- create/update invite and send email
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

    // Send email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error('Email service not configured')

    const APP_URL = Deno.env.get('APP_URL') || 'https://app.trained.com'

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Trained <noreply@yourdomain.com>',
        to: [normalizedEmail],
        subject: 'You\'ve been invited to Trained',
        html: `<!-- branded HTML email -->`,
      }),
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      console.error('Resend error:', errBody)
      throw new Error('Failed to send invite email')
    }

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
```

### Example 2: SQL Migration (`003_invitations.sql`)

```sql
-- 003_invitations.sql

-- ===========================================
-- 1. Create invite_status enum and invites table
-- ===========================================

CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status invite_status DEFAULT 'pending' NOT NULL,
  token UUID DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_active_invite UNIQUE (coach_id, email)
);

CREATE INDEX idx_invites_coach ON invites(coach_id);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_status ON invites(coach_id, status);

-- updated_at trigger
CREATE TRIGGER invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- 2. RLS policies for invites table
-- ===========================================

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Coach can manage their own invites
CREATE POLICY "Coaches can manage own invites"
  ON invites FOR ALL
  USING (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'coach'
    )
  );

-- ===========================================
-- 3. Extend handle_new_user to auto-link invites
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile (existing behavior)
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  -- Create XP record (existing behavior)
  INSERT INTO public.user_xp (user_id)
  VALUES (NEW.id);

  -- Auto-accept pending invites for this email
  UPDATE public.invites
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW();

  -- Create coach-client relationships for accepted invites
  INSERT INTO public.coach_clients (coach_id, client_id, status)
  SELECT i.coach_id, NEW.id, 'active'
  FROM public.invites i
  WHERE i.email = NEW.email
    AND i.status = 'accepted'
    AND i.accepted_by = NEW.id
  ON CONFLICT (coach_id, client_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Example 3: CORS Shared Helper

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Example 4: Coach Dashboard Invite UI Integration

```typescript
// In Coach.tsx -- fetch invites for display
const fetchInvites = async () => {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('invites')
    .select('id, email, status, created_at, expires_at, accepted_at')
    .order('created_at', { ascending: false })

  if (!error && data) {
    // Compute display status (expired check)
    const invites = data.map(inv => ({
      ...inv,
      displayStatus: inv.status === 'pending' && new Date(inv.expires_at) < new Date()
        ? 'expired'
        : inv.status,
    }))
    setInvites(invites)
  }
}

// Invoke Edge Function
const handleSendInvite = async (email: string) => {
  setInviteStatus('loading')
  const client = getSupabaseClient()
  const { data, error } = await client.functions.invoke('send-invite', {
    body: { email },
  })
  if (error) {
    setInviteStatus('error')
    setInviteMessage(error.message || 'Failed to send invite')
  } else if (data?.action === 'added_directly') {
    setInviteStatus('success')
    setInviteMessage('User already had an account -- added as client!')
    fetchClients()
  } else {
    setInviteStatus('success')
    setInviteMessage('Invite sent!')
  }
  fetchInvites()
}
```

### Example 5: TypeScript Types for Invites

```typescript
// Add to database.types.ts
export type InviteStatus = 'pending' | 'accepted' | 'expired'

// In Database.public.Tables:
invites: {
  Row: {
    id: string
    created_at: string
    updated_at: string
    coach_id: string
    email: string
    status: InviteStatus
    token: string
    expires_at: string
    accepted_at: string | null
    accepted_by: string | null
  }
  Insert: {
    id?: string
    created_at?: string
    updated_at?: string
    coach_id: string
    email: string
    status?: InviteStatus
    token?: string
    expires_at?: string
    accepted_at?: string | null
    accepted_by?: string | null
  }
  Update: {
    id?: string
    created_at?: string
    updated_at?: string
    coach_id?: string
    email?: string
    status?: InviteStatus
    token?: string
    expires_at?: string
    accepted_at?: string | null
    accepted_by?: string | null
  }
  Relationships: []
}

// In Database.public.Enums:
invite_status: InviteStatus
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth.admin.inviteUserByEmail()` | Edge Function + Resend API | 2024+ | Full control over email branding, no rate limit collision with auth emails, better deliverability |
| Supabase default SMTP | Custom email via Resend/Postmark/SendGrid | 2023+ | Supabase docs now explicitly recommend custom SMTP or Edge Functions for production email |
| Magic link invites | Normal signup with invite metadata | 2024+ | Avoids email scanner token consumption, simpler UX (standard signup flow) |
| Manual coach-client linking | Database trigger auto-link on signup | N/A (standard PostgreSQL pattern) | Zero manual work, atomic, no race conditions |

**Deprecated/outdated:**
- Supabase's default email sender is explicitly labeled "for development only" -- production should use custom SMTP or Edge Functions
- `auth.admin.inviteUserByEmail()` is still available but Supabase documentation increasingly recommends custom flows via Edge Functions for branded experiences

## Open Questions

1. **What domain will Resend send from?**
   - What we know: Resend requires a verified domain for production sending (e.g., `noreply@trained.app`). The free tier allows `onboarding@resend.dev` for testing.
   - What's unclear: What domain is available for the coach's email sending? Does the user own a domain they can verify with Resend?
   - Recommendation: Start with Resend's default test domain for development. Document domain verification as a deployment requirement. The Edge Function should read the `from` address from an environment variable.

2. **Should the invite email contain the invite token in the URL?**
   - What we know: The auto-link trigger works by matching the signup email against pending invites. The token is NOT needed for the auto-link to work -- email matching is sufficient.
   - What's unclear: Should the URL include the token anyway (for future use, like showing a custom landing page)?
   - Recommendation: Include the token as a URL parameter (`?invite=<token>`) but do NOT require it for the auto-link. This keeps the door open for a custom invite landing page later while keeping the current flow simple. The app can detect `?invite=` in the URL and show a welcome message.

3. **How should the coach dashboard differentiate clients from invites vs. manually added?**
   - What we know: The existing `coach_clients` table has no `source` column. The `invites` table tracks which clients came from invites.
   - What's unclear: Does the coach need to see "Added via invite" vs "Added manually" in the roster?
   - Recommendation: Not needed for v1.3. The `invites` table provides an audit trail if needed later. Keep the roster simple.

4. **What happens when the coach resends an invite?**
   - What we know: The `UNIQUE (coach_id, email)` constraint means only one invite row per coach+email combination.
   - Recommendation: Resending upserts the existing row (refreshes `expires_at`, `updated_at`, re-generates `token`). The Edge Function handles this via PostgreSQL UPSERT. Show the coach "Invite resent" feedback.

5. **Should the Supabase CLI be initialized (`supabase init`) in the repo?**
   - What we know: No `supabase/config.toml` exists. Edge Functions require the `supabase/functions/` directory structure.
   - Recommendation: Run `supabase init` to create `config.toml` and the `functions/` directory. Add `config.toml` to version control. Add `.env` files to `.gitignore`.

## Sources

### Primary (HIGH confidence)
- Direct analysis of `supabase/schema.sql` -- existing `handle_new_user` trigger, `coach_clients` table, RLS policies
- Direct analysis of `src/screens/Coach.tsx` -- existing invite flow (email lookup + direct insert, no email sending)
- Direct analysis of `src/stores/authStore.ts` -- signup/signin flow, syncData lifecycle
- Direct analysis of `src/App.tsx` -- route structure, auth flow, SPA routing
- [Supabase Edge Functions Quickstart](https://supabase.com/docs/guides/functions/quickstart) -- Function structure, deployment, invocation
- [Supabase Edge Functions - Send Emails](https://supabase.com/docs/guides/functions/examples/send-emails) -- Resend integration pattern
- [Supabase Edge Functions - CORS](https://supabase.com/docs/guides/functions/cors) -- CORS headers, preflight handling
- [Supabase Edge Functions - Secrets](https://supabase.com/docs/guides/functions/secrets) -- Environment variables, `Deno.env.get()`, `supabase secrets set`
- [Supabase functions.invoke() Reference](https://supabase.com/docs/reference/javascript/functions-invoke) -- Client-side invocation, auto auth headers
- [Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook) -- Hook replaces all auth emails (not suitable for targeted invites)

### Secondary (MEDIUM confidence)
- [Resend + Supabase Integration Guide](https://resend.com/docs/send-with-supabase-edge-functions) -- Setup steps, verified domain requirement
- [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email) -- Request/response format, required fields, idempotency key
- [Resend Pricing](https://resend.com/pricing) -- Free tier: 100 emails/day (~3K/month), Pro: $20/mo for 50K/month
- [Supabase Auth Rate Limits](https://supabase.com/docs/guides/auth/rate-limits) -- Default 2-3/hr, custom SMTP 30/hr
- [RBAC Admin App User Invitations](https://blog.hijabicoder.dev/create-and-invite-users-to-your-admin-app-using-supabase-edge-functions) -- Pattern for Edge Function invite + relationship creation

### Tertiary (LOW confidence)
- [Supabase Discussion #22753](https://github.com/orgs/supabase/discussions/22753) -- Edge Function creating user then inserting to another table pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Supabase Edge Functions + Resend are explicitly specified in requirements, verified with official docs
- Architecture: HIGH -- Based on direct codebase analysis of existing trigger, Coach.tsx, auth flow; patterns verified with Supabase official docs
- Pitfalls: HIGH -- Email rate limits documented in Supabase docs, email scanner issue is well-known, race condition identified from actual code analysis
- Edge Function pattern: HIGH -- Verified with official Supabase examples and documentation
- Auto-link trigger: HIGH -- Extending existing `handle_new_user` trigger, standard PostgreSQL pattern

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable -- Supabase Edge Functions and Resend API are production-stable services)
