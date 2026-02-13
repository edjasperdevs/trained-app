-- Trained App Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE user_role AS ENUM ('client', 'coach', 'admin');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE goal_type AS ENUM ('cut', 'recomp', 'maintain', 'bulk');
CREATE TYPE avatar_base AS ENUM ('dominant', 'switch', 'submissive');
CREATE TYPE activity_level AS ENUM ('sedentary', 'light', 'moderate', 'active');
CREATE TYPE workout_type AS ENUM ('push', 'pull', 'legs', 'upper', 'lower');
CREATE TYPE xp_source AS ENUM ('workout', 'protein', 'calories', 'checkin', 'claim');
CREATE TYPE coach_client_status AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

-- ===========================================
-- TABLES
-- ===========================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  role user_role DEFAULT 'client' NOT NULL,
  gender gender,
  fitness_level fitness_level,
  training_days_per_week INTEGER CHECK (training_days_per_week BETWEEN 3 AND 5),
  workout_days INTEGER[] DEFAULT ARRAY[1,3,5], -- Days of week (0=Sun, 6=Sat)
  weight DECIMAL(5,1), -- in lbs
  height INTEGER, -- in inches
  age INTEGER CHECK (age BETWEEN 13 AND 120),
  goal goal_type,
  avatar_base avatar_base,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_check_in_date DATE,
  streak_paused BOOLEAN DEFAULT FALSE NOT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE NOT NULL
);

-- Coach-Client relationships
CREATE TABLE coach_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status coach_client_status DEFAULT 'pending' NOT NULL,
  notes TEXT,
  UNIQUE(coach_id, client_id)
);

-- Invites (coach invitation lifecycle)
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

-- Weight logs
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(5,1) NOT NULL,
  UNIQUE(user_id, date)
);

-- Macro targets
CREATE TABLE macro_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  protein INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fats INTEGER NOT NULL,
  activity_level activity_level NOT NULL,
  set_by TEXT NOT NULL DEFAULT 'self'
    CHECK (set_by IN ('self', 'coach')),
  set_by_coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Daily macro logs (aggregate totals per day)
CREATE TABLE daily_macro_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  protein INTEGER DEFAULT 0 NOT NULL,
  calories INTEGER DEFAULT 0 NOT NULL,
  carbs INTEGER DEFAULT 0 NOT NULL,
  fats INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(user_id, date)
);

-- Individual logged meals
CREATE TABLE logged_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fats INTEGER NOT NULL,
  calories INTEGER NOT NULL
);

-- Saved meals (user's meal library)
CREATE TABLE saved_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fats INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  ingredients JSONB DEFAULT '[]'::jsonb
);

-- User foods: combined table for recent + favorite foods
CREATE TABLE user_foods (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fats INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  serving_size REAL NOT NULL,
  serving_description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
  logged_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- Workout logs
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  workout_type workout_type NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  duration_minutes INTEGER,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL,
  xp_awarded BOOLEAN DEFAULT FALSE NOT NULL
);

-- XP tracking
CREATE TABLE user_xp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  current_level INTEGER DEFAULT 1 NOT NULL,
  pending_xp INTEGER DEFAULT 0 NOT NULL,
  last_claim_date DATE
);

-- XP log entries (audit trail)
CREATE TABLE xp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source xp_source NOT NULL,
  amount INTEGER NOT NULL
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_coach_clients_coach ON coach_clients(coach_id);
CREATE INDEX idx_coach_clients_client ON coach_clients(client_id);
CREATE INDEX idx_invites_coach ON invites(coach_id);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_status ON invites(coach_id, status);
CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, date DESC);
CREATE INDEX idx_daily_macro_logs_user_date ON daily_macro_logs(user_id, date DESC);
CREATE INDEX idx_logged_meals_user_date ON logged_meals(user_id, date DESC);
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, date DESC);
CREATE INDEX idx_xp_logs_user_date ON xp_logs(user_id, date DESC);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_macro_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logged_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own, coaches can read their clients
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Coaches can view their clients profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = profiles.id
      AND coach_clients.status = 'active'
    )
  );

-- Helper: check coach role without triggering RLS on profiles (avoids circular dependency)
CREATE OR REPLACE FUNCTION public.is_coach_role(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'coach'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Coach-Clients: Coaches manage their relationships, clients can see their coach
-- Uses is_coach_role() to avoid circular RLS between coach_clients <-> profiles
CREATE POLICY "Coaches can manage their client relationships"
  ON coach_clients FOR ALL
  USING (
    coach_id = auth.uid()
    AND public.is_coach_role(auth.uid())
  )
  WITH CHECK (
    coach_id = auth.uid()
    AND public.is_coach_role(auth.uid())
  );

CREATE POLICY "Clients can view their coach relationship"
  ON coach_clients FOR SELECT
  USING (client_id = auth.uid());

-- Invites: Coaches manage their own invites
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

-- Weight logs: Own data + coach can view client data
CREATE POLICY "Users can manage own weight logs"
  ON weight_logs FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view client weight logs"
  ON weight_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = weight_logs.user_id
      AND coach_clients.status = 'active'
    )
  );

-- Macro targets: Own data + coach can view/update client data
CREATE POLICY "Users can manage own macro targets"
  ON macro_targets FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view client macro targets"
  ON macro_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = macro_targets.user_id
      AND coach_clients.status = 'active'
    )
  );

CREATE POLICY "Coaches can update client macro targets"
  ON macro_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = macro_targets.user_id
      AND coach_clients.status = 'active'
    )
  );

-- Allow coaches to INSERT macro targets for their active clients
-- Needed when a client has never used the macro calculator (no existing row)
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

-- Daily macro logs: Own data + coach can view
CREATE POLICY "Users can manage own daily macro logs"
  ON daily_macro_logs FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view client daily macro logs"
  ON daily_macro_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = daily_macro_logs.user_id
      AND coach_clients.status = 'active'
    )
  );

-- Logged meals: Own data + coach can view
CREATE POLICY "Users can manage own logged meals"
  ON logged_meals FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view client logged meals"
  ON logged_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = logged_meals.user_id
      AND coach_clients.status = 'active'
    )
  );

-- Saved meals: Own data only
CREATE POLICY "Users can manage own saved meals"
  ON saved_meals FOR ALL
  USING (user_id = auth.uid());

-- User foods: Own data only
CREATE POLICY "Users can manage own foods"
  ON user_foods FOR ALL
  USING (user_id = auth.uid());

-- Workout logs: Own data + coach can view
CREATE POLICY "Users can manage own workout logs"
  ON workout_logs FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view client workout logs"
  ON workout_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = workout_logs.user_id
      AND coach_clients.status = 'active'
    )
  );

-- User XP: Own data + coach can view
CREATE POLICY "Users can manage own XP"
  ON user_xp FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view client XP"
  ON user_xp FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = user_xp.user_id
      AND coach_clients.status = 'active'
    )
  );

-- XP logs: Own data + coach can view
CREATE POLICY "Users can manage own XP logs"
  ON xp_logs FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view client XP logs"
  ON xp_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
      AND coach_clients.client_id = xp_logs.user_id
      AND coach_clients.status = 'active'
    )
  );

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-create profile on user signup, auto-accept pending invites
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

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER macro_targets_updated_at
  BEFORE UPDATE ON macro_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Prevent users from escalating their own role via profile UPDATE
-- Only service_role (admin) can change roles
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
      RAISE EXCEPTION 'Cannot change role via client API';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();

-- ===========================================
-- VIEWS (for coach dashboard)
-- ===========================================

-- Client summary view for coaches
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

-- Grant access to the view
GRANT SELECT ON coach_client_summary TO authenticated;

-- ===========================================
-- WORKOUT PROGRAMMING (migration 006)
-- ===========================================

-- Workout templates (coach-created reusable blueprints)
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL
);

-- Assigned workouts (coach-assigned workout for a specific client and date)
CREATE TABLE assigned_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Link workout logs to assigned workouts
ALTER TABLE workout_logs
  ADD COLUMN assignment_id UUID REFERENCES assigned_workouts(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_workout_templates_coach ON workout_templates(coach_id);
CREATE INDEX idx_assigned_workouts_client_date ON assigned_workouts(client_id, date DESC);
CREATE INDEX idx_assigned_workouts_coach ON assigned_workouts(coach_id);
CREATE INDEX idx_workout_logs_assignment ON workout_logs(assignment_id) WHERE assignment_id IS NOT NULL;

-- RLS
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_workouts ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Clients can view own assigned workouts"
  ON assigned_workouts FOR SELECT
  USING (client_id = auth.uid());

-- Triggers
CREATE TRIGGER workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER assigned_workouts_updated_at
  BEFORE UPDATE ON assigned_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
