-- Migration: Invitations Schema
-- Creates invites table, RLS policies, indexes, and extends handle_new_user
-- trigger to auto-accept pending invites and create coach-client relationships

-- ===========================================
-- 1. Create invite_status enum and invites table
-- ===========================================

CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status invite_status DEFAULT 'pending' NOT NULL,
  token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_active_invite UNIQUE (coach_id, email)
);

-- ===========================================
-- 2. Indexes
-- ===========================================

CREATE INDEX idx_invites_coach ON invites(coach_id);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_status ON invites(coach_id, status);

-- ===========================================
-- 3. Updated_at trigger
-- ===========================================

CREATE TRIGGER invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- 4. RLS policies for invites table
-- ===========================================

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Coach can manage their own invites (same pattern as coach_clients RLS)
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

-- Service role (used by Edge Function) bypasses RLS automatically

-- ===========================================
-- 5. Extend handle_new_user to auto-link invites
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
