-- Migration: Workout Programming Schema
-- Adds workout_templates, assigned_workouts tables, and assignment_id FK on workout_logs

-- ===========================================
-- TABLE: workout_templates
-- Coach-created reusable workout blueprints
-- ===========================================

CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL
);

CREATE INDEX idx_workout_templates_coach ON workout_templates(coach_id);

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- TABLE: assigned_workouts
-- Coach-assigned workout for a specific client and date
-- ===========================================

CREATE TABLE assigned_workouts (
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

CREATE INDEX idx_assigned_workouts_client_date ON assigned_workouts(client_id, date DESC);
CREATE INDEX idx_assigned_workouts_coach ON assigned_workouts(coach_id);

ALTER TABLE assigned_workouts ENABLE ROW LEVEL SECURITY;

-- Coaches can manage assignments for their active clients
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

-- Clients can view their own assigned workouts
CREATE POLICY "Clients can view own assigned workouts"
  ON assigned_workouts FOR SELECT
  USING (client_id = auth.uid());

CREATE TRIGGER assigned_workouts_updated_at
  BEFORE UPDATE ON assigned_workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- ALTER: workout_logs.assignment_id
-- Links a completed workout log to its assignment
-- ===========================================

ALTER TABLE workout_logs
  ADD COLUMN assignment_id UUID REFERENCES assigned_workouts(id) ON DELETE SET NULL;

CREATE INDEX idx_workout_logs_assignment
  ON workout_logs(assignment_id)
  WHERE assignment_id IS NOT NULL;
