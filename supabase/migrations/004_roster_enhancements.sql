-- Migration 004: Add security_invoker to coach_client_summary view
--
-- Why: Without security_invoker, the view executes with the privileges of the
-- view owner (postgres) rather than the querying user. This bypasses RLS
-- policies on the underlying tables (coach_clients, profiles, user_xp, etc.),
-- meaning any authenticated user could read all coaches' client data through
-- the view. With security_invoker = true, the view respects RLS on each
-- underlying table, enforcing that coaches only see their own clients.

CREATE OR REPLACE VIEW coach_client_summary
WITH (security_invoker = true) AS
SELECT
  cc.coach_id,
  cc.client_id,
  cc.status,
  p.username,
  p.email,
  p.current_streak,
  p.longest_streak,
  p.last_check_in_date,
  p.goal,
  p.onboarding_complete,
  ux.current_level,
  ux.total_xp,
  (SELECT weight FROM weight_logs wl WHERE wl.user_id = p.id ORDER BY date DESC LIMIT 1) as latest_weight,
  (SELECT date FROM weight_logs wl WHERE wl.user_id = p.id ORDER BY date DESC LIMIT 1) as latest_weight_date,
  (SELECT COUNT(*) FROM workout_logs wl WHERE wl.user_id = p.id AND wl.completed = true AND wl.date >= CURRENT_DATE - INTERVAL '7 days') as workouts_last_7_days
FROM coach_clients cc
JOIN profiles p ON p.id = cc.client_id
LEFT JOIN user_xp ux ON ux.user_id = p.id;

GRANT SELECT ON coach_client_summary TO authenticated;
