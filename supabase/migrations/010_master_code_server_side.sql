-- SEC-02: Master Access Code Server-Side Validation
-- Moves master code check from client bundle to server-side RPC
-- Master code stored in app_config table (RLS blocks direct access)
--
-- SETUP REQUIRED: After running migration, add master code:
--   INSERT INTO app_config (key, value) VALUES ('master_access_code', 'YOUR_CODE');

-- Create config table (RLS-protected, no public access)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Block all direct access - only SECURITY DEFINER functions can read
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
-- No policies = no direct access for anon/authenticated

-- Update function to check master code from config table
CREATE OR REPLACE FUNCTION validate_access_code(input_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  master_code TEXT;
BEGIN
  -- SEC-02: Check master code from config table
  SELECT value INTO master_code
  FROM app_config
  WHERE key = 'master_access_code'
  LIMIT 1;

  IF master_code IS NOT NULL AND upper(input_code) = upper(master_code) THEN
    RETURN json_build_object(
      'valid', true,
      'email', null,
      'name', 'Master Access'
    );
  END IF;

  -- Check clients table (codes from sales site purchases)
  SELECT json_build_object(
    'valid', true,
    'email', c.email,
    'name', c.name
  ) INTO result
  FROM clients c
  WHERE c.access_code = upper(input_code)
  LIMIT 1;

  IF result IS NOT NULL THEN
    RETURN result;
  END IF;

  -- Fallback: check access_codes table (manually added codes)
  SELECT json_build_object(
    'valid', COALESCE(ac.is_active, false),
    'email', ac.email,
    'name', null
  ) INTO result
  FROM access_codes ac
  WHERE ac.code = upper(input_code)
  LIMIT 1;

  IF result IS NOT NULL THEN
    RETURN result;
  END IF;

  RETURN json_build_object('valid', false);
END;
$$;

GRANT EXECUTE ON FUNCTION validate_access_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_access_code(TEXT) TO authenticated;
