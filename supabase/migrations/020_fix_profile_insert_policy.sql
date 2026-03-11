-- Migration: Fix profile INSERT policy for new users
-- Issue: Users couldn't create their own profile if trigger failed or they were
-- created manually. The upsert in syncProfileToCloud requires INSERT permission.

-- Add INSERT policy for profiles: users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also add a safety DELETE policy in case we need cleanup
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
