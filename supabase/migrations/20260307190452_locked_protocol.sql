-- locked_protocols: one active protocol per user at a time
CREATE TABLE locked_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active',       -- 'active' | 'ended' | 'broken'
  protocol_type TEXT NOT NULL DEFAULT 'continuous', -- 'continuous' | 'day_lock'
  goal_days INTEGER NOT NULL DEFAULT 30,
  start_date DATE NOT NULL,
  end_date DATE,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- locked_logs: one row per compliance check-in
CREATE TABLE locked_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES locked_protocols(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  log_date DATE NOT NULL,
  dp_awarded INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date) -- one log per user per day
);

-- RLS policies
ALTER TABLE locked_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE locked_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own protocols" ON locked_protocols
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own protocols" ON locked_protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own protocols" ON locked_protocols
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON locked_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON locked_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_locked_protocols_user_status ON locked_protocols(user_id, status);
CREATE INDEX idx_locked_logs_protocol_date ON locked_logs(protocol_id, log_date);
