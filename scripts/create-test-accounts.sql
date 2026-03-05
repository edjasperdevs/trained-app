-- Create 10 Test Accounts for WellTrained
-- 5 Archetypes x 2 ranks (mid-level + master) = 10 accounts
-- Run this in Supabase SQL Editor

-- NOTE: Archetype is stored locally, not in database.
-- After logging in, go to Settings to change archetype.

-- =============================================
-- STEP 1: Create auth users via Supabase Dashboard
-- Go to Authentication > Users > Add User
-- Create these 10 users with password: TestPass123!
-- =============================================

-- =============================================
-- STEP 2: Get user IDs
-- =============================================
SELECT id, email FROM auth.users WHERE email LIKE '%@test.welltrained.app' ORDER BY email;

-- =============================================
-- STEP 3: Replace USER_ID placeholders below with actual UUIDs
-- =============================================

-- BRO MID (Rank 8 - Forged, 6000 DP, 45 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_BRO_MID',
  'bro.mid@test.welltrained.app',
  'BRO_FORGED',
  'male', 'intermediate', 4, 185, 71, 28, 'recomp', 'dominant',
  45, 52, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 45, longest_streak = 52, username = 'BRO_FORGED';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_BRO_MID', 6000, 8, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 6000, current_level = 8;

-- BRO MASTER (Rank 15 - Master, 16000 DP, 180 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_BRO_MASTER',
  'bro.master@test.welltrained.app',
  'BRO_MASTER',
  'male', 'advanced', 5, 195, 72, 32, 'bulk', 'dominant',
  180, 180, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 180, longest_streak = 180, username = 'BRO_MASTER';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_BRO_MASTER', 16000, 15, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 16000, current_level = 15;

-- HIMBO MID (Rank 7 - Hardened, 5000 DP, 21 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_HIMBO_MID',
  'himbo.mid@test.welltrained.app',
  'HIMBO_HARDENED',
  'male', 'intermediate', 4, 175, 70, 25, 'maintain', 'switch',
  21, 35, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 21, longest_streak = 35, username = 'HIMBO_HARDENED';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_HIMBO_MID', 5000, 7, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 5000, current_level = 7;

-- HIMBO MASTER (Rank 15 - Master, 15500 DP, 120 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_HIMBO_MASTER',
  'himbo.master@test.welltrained.app',
  'HIMBO_MASTER',
  'male', 'advanced', 5, 180, 69, 27, 'recomp', 'switch',
  120, 145, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 120, longest_streak = 145, username = 'HIMBO_MASTER';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_HIMBO_MASTER', 15500, 15, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 15500, current_level = 15;

-- BRUTE MID (Rank 9 - Trusted, 7000 DP, 60 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_BRUTE_MID',
  'brute.mid@test.welltrained.app',
  'BRUTE_TRUSTED',
  'male', 'intermediate', 5, 220, 74, 30, 'bulk', 'dominant',
  60, 60, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 60, longest_streak = 60, username = 'BRUTE_TRUSTED';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_BRUTE_MID', 7000, 9, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 7000, current_level = 9;

-- BRUTE MASTER (Rank 15 - Master, 17000 DP, 200 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_BRUTE_MASTER',
  'brute.master@test.welltrained.app',
  'BRUTE_MASTER',
  'male', 'advanced', 5, 235, 75, 34, 'bulk', 'dominant',
  200, 200, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 200, longest_streak = 200, username = 'BRUTE_MASTER';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_BRUTE_MASTER', 17000, 15, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 17000, current_level = 15;

-- PUP MID (Rank 6 - Proven, 4000 DP, 14 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_PUP_MID',
  'pup.mid@test.welltrained.app',
  'PUP_PROVEN',
  'male', 'beginner', 3, 155, 67, 23, 'cut', 'submissive',
  14, 28, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 14, longest_streak = 28, username = 'PUP_PROVEN';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_PUP_MID', 4000, 6, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 4000, current_level = 6;

-- PUP MASTER (Rank 15 - Master, 15000 DP, 90 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_PUP_MASTER',
  'pup.master@test.welltrained.app',
  'PUP_MASTER',
  'male', 'intermediate', 4, 165, 68, 26, 'recomp', 'submissive',
  90, 110, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 90, longest_streak = 110, username = 'PUP_MASTER';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_PUP_MASTER', 15000, 15, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 15000, current_level = 15;

-- BULL MID (Rank 10 - Enforcer, 8000 DP, 75 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_BULL_MID',
  'bull.mid@test.welltrained.app',
  'BULL_ENFORCER',
  'male', 'advanced', 5, 210, 73, 29, 'recomp', 'dominant',
  75, 82, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 75, longest_streak = 82, username = 'BULL_ENFORCER';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_BULL_MID', 8000, 10, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 8000, current_level = 10;

-- BULL MASTER (Rank 15 - Master, 18000 DP, 250 day streak)
INSERT INTO profiles (id, email, username, gender, fitness_level, training_days_per_week, weight, height, age, goal, avatar_base, current_streak, longest_streak, last_check_in_date, onboarding_complete)
VALUES (
  'USER_ID_BULL_MASTER',
  'bull.master@test.welltrained.app',
  'BULL_MASTER',
  'male', 'advanced', 5, 225, 74, 35, 'maintain', 'dominant',
  250, 250, CURRENT_DATE, true
) ON CONFLICT (id) DO UPDATE SET current_streak = 250, longest_streak = 250, username = 'BULL_MASTER';

INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
VALUES ('USER_ID_BULL_MASTER', 18000, 15, 0)
ON CONFLICT (user_id) DO UPDATE SET total_xp = 18000, current_level = 15;

-- =============================================
-- VERIFY
-- =============================================
SELECT p.username, p.current_streak, x.total_xp, x.current_level
FROM profiles p
JOIN user_xp x ON p.id = x.user_id
WHERE p.email LIKE '%@test.welltrained.app'
ORDER BY x.current_level;

-- =============================================
-- NOTE: After logging in, change archetype in Settings!
-- Archetype is stored locally, not in database.
-- =============================================
