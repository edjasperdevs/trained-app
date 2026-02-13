-- Migration 009: User foods (favorites + recents) and saved meal ingredients
-- Adds ingredients JSONB to saved_meals and creates user_foods table

-- Add ingredients JSONB to saved_meals
ALTER TABLE saved_meals ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::jsonb;

-- User foods: combined table for recent + favorite foods
CREATE TABLE user_foods (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fats INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  serving_size REAL NOT NULL,
  serving_description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
  logged_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, id)
);

ALTER TABLE user_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own foods"
  ON user_foods FOR ALL
  USING (user_id = auth.uid());
