-- Validate Access Code RPC
-- SECURITY DEFINER function so anon users can validate codes
-- without direct table access (RLS blocks anon from clients table).
-- Checks clients.access_code first, then access_codes.code as fallback.

CREATE OR REPLACE FUNCTION validate_access_code(input_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check clients table first (codes from sales site purchases)
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

  -- No match found
  RETURN json_build_object('valid', false);
END;
$$;
