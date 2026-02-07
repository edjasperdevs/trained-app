-- Migration: Coach Foundation Schema Changes
-- Adds data ownership columns, fixes RLS vulnerability, prevents role escalation

-- ===========================================
-- 1. Add data ownership columns to macro_targets
-- ===========================================

ALTER TABLE macro_targets
  ADD COLUMN set_by TEXT NOT NULL DEFAULT 'self'
    CHECK (set_by IN ('self', 'coach')),
  ADD COLUMN set_by_coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ===========================================
-- 2. Fix coach_clients RLS policy
-- Old policy allows any authenticated user to insert into coach_clients
-- by setting coach_id = their own user ID. New policy requires coach role.
-- ===========================================

DROP POLICY "Coaches can manage their client relationships" ON coach_clients;

CREATE POLICY "Coaches can manage their client relationships"
  ON coach_clients FOR ALL
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

-- ===========================================
-- 3. Prevent role escalation via profile UPDATE
-- Users cannot change their own role column via client API.
-- Only service_role (admin) can change roles.
-- ===========================================

CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only allow role changes from service_role (admin), not from authenticated users
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
