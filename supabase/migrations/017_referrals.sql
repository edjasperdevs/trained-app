-- Migration 017: Referral System
-- Adds referral tracking infrastructure for user referral codes and recruit tracking

-- ─────────────────────────────────────────────────────────────────────────────
-- Add referral_code column to profiles
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Index for faster referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code
    ON public.profiles (referral_code);

-- ─────────────────────────────────────────────────────────────────────────────
-- Referral Code Generation Function
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_referral_code(username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_name TEXT;
    suffix TEXT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INT;
BEGIN
    -- Use username if provided, otherwise default to 'USER'
    base_name := UPPER(COALESCE(NULLIF(TRIM(username), ''), 'USER'));

    -- Generate 4 random alphanumeric characters
    suffix := '';
    FOR i IN 1..4 LOOP
        suffix := suffix || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INT, 1);
    END LOOP;

    RETURN base_name || '-' || suffix;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Referrals Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recruit_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    referral_code_used TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    completed_at TIMESTAMPTZ,
    dp_awarded INTEGER DEFAULT 0 NOT NULL,
    UNIQUE(recruit_id) -- Each user can only be recruited once
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_referrals_referrer
    ON public.referrals (referrer_id);

CREATE INDEX IF NOT EXISTS idx_referrals_recruit
    ON public.referrals (recruit_id);

CREATE INDEX IF NOT EXISTS idx_referrals_status
    ON public.referrals (status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security for Referrals
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can read referrals where they are the referrer
CREATE POLICY "Users can view own referrals as referrer"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referrer_id);

-- Users can read referrals where they are the recruit
CREATE POLICY "Users can view own referrals as recruit"
    ON public.referrals FOR SELECT
    USING (auth.uid() = recruit_id);

-- Authenticated users can insert referrals (for capturing referral on signup)
CREATE POLICY "Authenticated users can create referrals"
    ON public.referrals FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- No direct update policy - updates handled by backend/service role
