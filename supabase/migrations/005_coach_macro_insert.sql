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
