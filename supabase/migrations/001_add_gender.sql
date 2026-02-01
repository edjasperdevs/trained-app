-- Migration: Add gender column to profiles
-- Run this if you already have an existing database

-- Create the gender enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
    CREATE TYPE gender AS ENUM ('male', 'female');
  END IF;
END $$;

-- Add gender column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gender gender;

-- Default existing users to 'male' (they can update in the app)
UPDATE profiles SET gender = 'male' WHERE gender IS NULL;
