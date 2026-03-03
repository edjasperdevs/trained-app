-- Migration 015: AI Meal Planning

-- Create user_food_preferences table
CREATE TABLE IF NOT EXISTS public.user_food_preferences (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    cuisines TEXT[] DEFAULT '{}',
    dietary_restrictions TEXT[] DEFAULT '{}',
    liked_foods TEXT[] DEFAULT '{}',
    disliked_foods TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create table for AI Meal Plans
CREATE TABLE IF NOT EXISTS public.ai_meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meals JSONB NOT NULL DEFAULT '[]', -- Array of meal objects
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived'
    user_rating INTEGER, -- 1-5 stars or thumbs up/down
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, date) -- One active plan per day
);

-- Create meal plan feedback table
CREATE TABLE IF NOT EXISTS public.meal_plan_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.ai_meal_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meal_index INTEGER NOT NULL, -- Which meal in the array
    feedback_type TEXT NOT NULL, -- 'thumbs_up', 'thumbs_down', 'swap_request'
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_food_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for user_food_preferences
CREATE POLICY "Users can view own food preferences" 
    ON public.user_food_preferences FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food preferences" 
    ON public.user_food_preferences FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food preferences" 
    ON public.user_food_preferences FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policies for ai_meal_plans
CREATE POLICY "Users can view own meal plans" 
    ON public.ai_meal_plans FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" 
    ON public.ai_meal_plans FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" 
    ON public.ai_meal_plans FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" 
    ON public.ai_meal_plans FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for meal_plan_feedback
CREATE POLICY "Users can view own meal plan feedback" 
    ON public.meal_plan_feedback FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plan feedback" 
    ON public.meal_plan_feedback FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plan feedback" 
    ON public.meal_plan_feedback FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plan feedback" 
    ON public.meal_plan_feedback FOR DELETE 
    USING (auth.uid() = user_id);
