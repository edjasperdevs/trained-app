-- =============================================================
-- Combined Migrations 003-007 for Production (IDEMPOTENT)
-- Safe to re-run — all statements skip if objects already exist
-- Apply via Supabase Dashboard → SQL Editor → New query
-- =============================================================

BEGIN;

-- =============================================================
-- MIGRATION 003: Invitations Schema
-- =============================================================

DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS invites (
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

CREATE INDEX IF NOT EXISTS idx_invites_coach ON invites(coach_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(coach_id, status);

DO $$ BEGIN
  CREATE TRIGGER invites_updated_at
    BEFORE UPDATE ON invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_xp (user_id)
  VALUES (NEW.id);

  UPDATE public.invites
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW();

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

-- =============================================================
-- MIGRATION 004: Roster Enhancements (security_invoker on view)
-- =============================================================

CREATE OR REPLACE VIEW coach_client_summary
WITH (security_invoker = true) AS
SELECT
  cc.coach_id,
  cc.client_id,
  cc.status,
  p.username,
  p.email,
  p.current_streak,
  p.longest_streak,
  p.last_check_in_date,
  p.goal,
  p.onboarding_complete,
  ux.current_level,
  ux.total_xp,
  (SELECT weight FROM weight_logs wl WHERE wl.user_id = p.id ORDER BY date DESC LIMIT 1) as latest_weight,
  (SELECT date FROM weight_logs wl WHERE wl.user_id = p.id ORDER BY date DESC LIMIT 1) as latest_weight_date,
  (SELECT COUNT(*) FROM workout_logs wl WHERE wl.user_id = p.id AND wl.completed = true AND wl.date >= CURRENT_DATE - INTERVAL '7 days') as workouts_last_7_days
FROM coach_clients cc
JOIN profiles p ON p.id = cc.client_id
LEFT JOIN user_xp ux ON ux.user_id = p.id;

GRANT SELECT ON coach_client_summary TO authenticated;

-- =============================================================
-- MIGRATION 005: Coach Macro Insert Policy
-- =============================================================

DO $$ BEGIN
  CREATE POLICY "Coaches can insert client macro targets"
    ON macro_targets FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM coach_clients
        WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = macro_targets.user_id
        AND coach_clients.status = 'active'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- MIGRATION 006: Workout Programming
-- =============================================================

CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_templates_coach ON workout_templates(coach_id);

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Coaches can manage own templates"
    ON workout_templates FOR ALL
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER workout_templates_updated_at
    BEFORE UPDATE ON workout_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS assigned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  exercises JSONB NOT NULL,
  notes TEXT,
  UNIQUE(client_id, date)
);

CREATE INDEX IF NOT EXISTS idx_assigned_workouts_client_date ON assigned_workouts(client_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_assigned_workouts_coach ON assigned_workouts(coach_id);

ALTER TABLE assigned_workouts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Coaches can manage client workout assignments"
    ON assigned_workouts FOR ALL
    USING (
      coach_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM coach_clients
        WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = assigned_workouts.client_id
        AND coach_clients.status = 'active'
      )
    )
    WITH CHECK (
      coach_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM coach_clients
        WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = assigned_workouts.client_id
        AND coach_clients.status = 'active'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Clients can view own assigned workouts"
    ON assigned_workouts FOR SELECT
    USING (client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER assigned_workouts_updated_at
    BEFORE UPDATE ON assigned_workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add assignment_id column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE workout_logs
    ADD COLUMN assignment_id UUID REFERENCES assigned_workouts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_workout_logs_assignment
  ON workout_logs(assignment_id)
  WHERE assignment_id IS NOT NULL;

-- =============================================================
-- MIGRATION 007: Weekly Check-ins
-- =============================================================

DO $$ BEGIN
  CREATE TYPE checkin_status AS ENUM ('submitted', 'reviewed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  week_of DATE NOT NULL,
  status checkin_status DEFAULT 'submitted' NOT NULL,
  water_intake TEXT,
  caffeine_intake TEXT,
  hunger_level INTEGER CHECK (hunger_level BETWEEN 1 AND 5),
  slip_ups TEXT,
  refeed_date DATE,
  digestion TEXT,
  training_progress TEXT,
  training_feedback TEXT,
  recovery_soreness TEXT,
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  sleep_hours DECIMAL(3,1),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  stressors TEXT,
  mental_health TEXT,
  injuries TEXT,
  cycle_status TEXT,
  side_effects TEXT,
  bloodwork_date DATE,
  open_feedback TEXT,
  auto_weight_current DECIMAL(5,1),
  auto_weight_weekly_avg DECIMAL(5,1),
  auto_weight_change DECIMAL(4,1),
  auto_step_avg INTEGER,
  auto_macro_hit_rate INTEGER,
  auto_cardio_sessions INTEGER,
  auto_workouts_completed INTEGER,
  coach_response TEXT,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(client_id, week_of)
);

CREATE INDEX IF NOT EXISTS idx_weekly_checkins_client ON weekly_checkins(client_id, week_of DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_coach_pending ON weekly_checkins(coach_id, status, created_at)
  WHERE status = 'submitted';

ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Clients can insert own check-ins"
    ON weekly_checkins FOR INSERT
    WITH CHECK (client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Clients can view own check-ins"
    ON weekly_checkins FOR SELECT
    USING (client_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Clients can update own submitted check-ins"
    ON weekly_checkins FOR UPDATE
    USING (client_id = auth.uid() AND status = 'submitted')
    WITH CHECK (client_id = auth.uid() AND status = 'submitted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Coaches can view client check-ins"
    ON weekly_checkins FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM coach_clients
        WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = weekly_checkins.client_id
        AND coach_clients.status = 'active'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Coaches can respond to client check-ins"
    ON weekly_checkins FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM coach_clients
        WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = weekly_checkins.client_id
        AND coach_clients.status = 'active'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER weekly_checkins_updated_at
    BEFORE UPDATE ON weekly_checkins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
