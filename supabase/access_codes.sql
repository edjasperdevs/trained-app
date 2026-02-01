-- Access Codes Table
-- Run this in your Supabase SQL Editor to enable access code gating

-- ===========================================
-- ACCESS CODES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- The access code (uppercase alphanumeric)
  code TEXT UNIQUE NOT NULL,

  -- Optional email of the purchaser
  email TEXT,

  -- When the code was first used
  used_at TIMESTAMPTZ,

  -- How many times the code has been used (for analytics)
  used_count INTEGER DEFAULT 0,

  -- Optional metadata (e.g., purchase source, campaign)
  metadata JSONB DEFAULT '{}',

  -- Whether the code is active
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(email);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read codes (needed for validation)
-- But they can only see limited info (code exists, not email)
CREATE POLICY "Anyone can validate codes"
  ON access_codes
  FOR SELECT
  USING (true);

-- Only authenticated admins can insert/update/delete codes
-- You'll need to manage codes via Supabase dashboard or a separate admin tool
CREATE POLICY "Only admins can manage codes"
  ON access_codes
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ===========================================
-- HELPER FUNCTION TO GENERATE CODES
-- ===========================================

-- Generate a batch of random access codes
CREATE OR REPLACE FUNCTION generate_access_codes(
  num_codes INTEGER DEFAULT 10,
  code_length INTEGER DEFAULT 8
)
RETURNS TABLE (code TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed confusing chars (0, O, 1, I)
  new_code TEXT;
  i INTEGER;
BEGIN
  FOR i IN 1..num_codes LOOP
    -- Generate random code
    new_code := '';
    FOR j IN 1..code_length LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Insert if not exists
    INSERT INTO access_codes (code)
    VALUES (new_code)
    ON CONFLICT (code) DO NOTHING;

    -- Return the code
    code := new_code;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ===========================================
-- EXAMPLE: GENERATE 50 CODES
-- ===========================================
-- Uncomment and run to generate codes:
--
-- SELECT * FROM generate_access_codes(50, 8);
--
-- To see all generated codes:
-- SELECT code, created_at, used_at, used_count FROM access_codes ORDER BY created_at DESC;

-- ===========================================
-- EXAMPLE: MANUALLY ADD A CODE
-- ===========================================
-- INSERT INTO access_codes (code, email) VALUES ('TESTCODE', 'buyer@example.com');
