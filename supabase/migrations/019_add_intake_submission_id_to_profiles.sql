-- Migration: Add intake_submission_id cross-reference to profiles table
-- Purpose: Create durable link between client profiles (Project B) and their
--          originating intake submissions (Project A)
--
-- Context: intake_submissions table lives in Project A (marketing/intake backend)
--          but we track the ID here in Project B for audit trail and bidirectional
--          tracking. This enables the client activation flow to maintain the
--          relationship between intake form submission and the resulting profile.
--
-- Safety: This migration is safe to run on production:
--         - Column is nullable (existing profiles unaffected)
--         - No data backfill required
--         - Foreign key allows NULL values
--         - Index improves query performance without locking

-- Add intake_submission_id column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS intake_submission_id UUID NULL;

-- Add comment explaining cross-project reference
COMMENT ON COLUMN profiles.intake_submission_id IS
'Cross-project reference to intake_submissions table in Project A. Tracks which intake form submission (if any) led to this profile creation. NULL for profile-only clients created directly by coach.';

-- Add foreign key constraint (allows NULL for profile-only clients)
-- Note: intake_submissions table exists in Project A, but we reference by ID
-- The foreign key validation happens at the application level since tables
-- are in different Supabase projects
DO $$
BEGIN
  -- Add constraint only if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_intake_submission_id_fkey'
  ) THEN
    -- This is a "soft" foreign key - we don't enforce referential integrity
    -- across projects, but we document the relationship in the schema
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_intake_submission_id_fkey
    FOREIGN KEY (intake_submission_id)
    REFERENCES intake_submissions(id)
    ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- intake_submissions doesn't exist in this database (Project B)
    -- This is expected - the table lives in Project A
    -- We'll track the UUID but can't enforce referential integrity
    RAISE NOTICE 'Skipping foreign key constraint - intake_submissions table not found in this database (expected for Project B)';
END $$;

-- Create index for query performance
CREATE INDEX IF NOT EXISTS idx_profiles_intake_submission_id
ON profiles(intake_submission_id);

-- Add comment to index
COMMENT ON INDEX idx_profiles_intake_submission_id IS
'Optimize queries that look up profiles by their originating intake submission.';
