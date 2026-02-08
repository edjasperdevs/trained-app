-- Migration: Weekly Check-ins Schema
-- Adds weekly_checkins table for coach-client weekly communication

-- ===========================================
-- ENUM: checkin_status
-- ===========================================

CREATE TYPE checkin_status AS ENUM ('submitted', 'reviewed');

-- ===========================================
-- TABLE: weekly_checkins
-- Client submits weekly, coach reviews and responds
-- ===========================================

CREATE TABLE weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ownership
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Metadata
  week_of DATE NOT NULL, -- The Monday of the check-in week
  status checkin_status DEFAULT 'submitted' NOT NULL,

  -- =====================
  -- Client-submitted fields (16 fields)
  -- =====================
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

  -- =====================
  -- Auto-populated app data (snapshot at submission)
  -- =====================
  auto_weight_current DECIMAL(5,1),
  auto_weight_weekly_avg DECIMAL(5,1),
  auto_weight_change DECIMAL(4,1),
  auto_step_avg INTEGER,
  auto_macro_hit_rate INTEGER,
  auto_cardio_sessions INTEGER,
  auto_workouts_completed INTEGER,

  -- =====================
  -- Coach response
  -- =====================
  coach_response TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Prevent duplicate check-ins for same week
  UNIQUE(client_id, week_of)
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_weekly_checkins_client ON weekly_checkins(client_id, week_of DESC);
CREATE INDEX idx_weekly_checkins_coach_pending ON weekly_checkins(coach_id, status, created_at)
  WHERE status = 'submitted';

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Client can insert their own check-ins
CREATE POLICY "Clients can insert own check-ins"
  ON weekly_checkins FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- Client can view their own check-ins (including coach response)
CREATE POLICY "Clients can view own check-ins"
  ON weekly_checkins FOR SELECT
  USING (client_id = auth.uid());

-- Client can update own check-ins before coach reviews
CREATE POLICY "Clients can update own submitted check-ins"
  ON weekly_checkins FOR UPDATE
  USING (client_id = auth.uid() AND status = 'submitted')
  WITH CHECK (client_id = auth.uid() AND status = 'submitted');

-- Coach can view their clients' check-ins
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

-- Coach can update check-ins (to add response)
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

-- ===========================================
-- TRIGGER: updated_at
-- ===========================================

CREATE TRIGGER weekly_checkins_updated_at
  BEFORE UPDATE ON weekly_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
