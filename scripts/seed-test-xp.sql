-- Seed Test XP Data for WellTrained
-- Run this in Supabase SQL Editor

-- First, let's see what users exist
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 20;

-- =============================================
-- STEP 1: Pick user IDs from the query above
-- STEP 2: Uncomment and run the INSERT statements below
-- =============================================

-- Example: Master rank user (15000 DP = Rank 15)
-- INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
-- VALUES ('PASTE-USER-ID-HERE', 15000, 15, 0)
-- ON CONFLICT (user_id) DO UPDATE SET total_xp = 15000, current_level = 15;

-- Example: Elite rank user (10500 DP = Rank 12)
-- INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
-- VALUES ('PASTE-USER-ID-HERE', 10500, 12, 0)
-- ON CONFLICT (user_id) DO UPDATE SET total_xp = 10500, current_level = 12;

-- Example: Mid-rank user (5000 DP = Rank 7)
-- INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
-- VALUES ('PASTE-USER-ID-HERE', 5000, 7, 0)
-- ON CONFLICT (user_id) DO UPDATE SET total_xp = 5000, current_level = 7;

-- Example: New user (100 DP = Rank 0)
-- INSERT INTO user_xp (user_id, total_xp, current_level, pending_xp)
-- VALUES ('PASTE-USER-ID-HERE', 100, 0, 0)
-- ON CONFLICT (user_id) DO UPDATE SET total_xp = 100, current_level = 0;


-- =============================================
-- OR: Batch update ALL existing users with test data
-- (Useful for dev/staging environments)
-- =============================================

-- Give all users with email containing 'test' Master rank:
-- UPDATE user_xp SET total_xp = 15000, current_level = 15
-- WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE '%test%');

-- =============================================
-- Rank Reference Table:
-- =============================================
-- Rank 0:  Uninitiated  (0 DP)
-- Rank 1:  Initiate     (250 DP)
-- Rank 2:  Compliant    (750 DP)
-- Rank 3:  Obedient     (1500 DP)
-- Rank 4:  Disciplined  (2250 DP)
-- Rank 5:  Conditioned  (3000 DP)
-- Rank 6:  Proven       (3750 DP)
-- Rank 7:  Hardened     (4750 DP)
-- Rank 8:  Forged       (5750 DP)
-- Rank 9:  Trusted      (6750 DP)
-- Rank 10: Enforcer     (7750 DP)
-- Rank 11: Seasoned     (9000 DP)
-- Rank 12: Elite        (10250 DP)
-- Rank 13: Apex         (11500 DP)
-- Rank 14: Sovereign    (13000 DP)
-- Rank 15: Master       (14750 DP)
