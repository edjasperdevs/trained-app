-- Daily health tracking table
-- Stores steps and sleep data from HealthKit or manual entry
-- Used to track health metrics and award DP for meeting thresholds

CREATE TABLE daily_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER,
  sleep_minutes INTEGER,
  steps_source TEXT NOT NULL DEFAULT 'manual',
  sleep_source TEXT NOT NULL DEFAULT 'manual',
  dp_awarded_steps BOOLEAN NOT NULL DEFAULT false,
  dp_awarded_sleep BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE daily_health ENABLE ROW LEVEL SECURITY;

-- Users can only access their own health data
CREATE POLICY "Users can manage own health data"
  ON daily_health FOR ALL
  USING (auth.uid() = user_id);

-- Index for efficient lookups by user and date
CREATE INDEX idx_daily_health_user_date ON daily_health(user_id, date);
