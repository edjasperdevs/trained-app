CREATE TABLE device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own tokens only
CREATE POLICY "Users manage own tokens"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for Edge Function lookups by user_id
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
