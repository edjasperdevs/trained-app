-- Add archetype column to profiles table
-- Phase 21-02: Archetype selection syncs to Supabase

-- Add archetype column with default (using text with constraint)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS archetype text DEFAULT 'bro' NOT NULL;

-- Add constraint to validate values
DO $$ BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT valid_archetype CHECK (archetype IN ('bro', 'himbo', 'brute', 'pup', 'bull'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Comment for documentation
COMMENT ON COLUMN profiles.archetype IS 'User archetype selection - affects DP earning modifiers';
