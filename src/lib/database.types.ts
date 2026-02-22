// Database types for Supabase
// These types match the schema defined in supabase/schema.sql

export type UserRole = 'client' | 'coach' | 'admin'
export type Gender = 'male' | 'female'
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'
export type GoalType = 'cut' | 'recomp' | 'maintain' | 'bulk'
export type AvatarBase = 'dominant' | 'switch' | 'submissive'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'
export type WorkoutType = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'rest'
export type XPSource = 'workout' | 'protein' | 'calories' | 'checkin' | 'claim'
export type CoachClientStatus = 'pending' | 'active' | 'inactive'
export type InviteStatus = 'pending' | 'accepted' | 'expired'
export type MacroSetBy = 'self' | 'coach'
export type CheckinStatus = 'submitted' | 'reviewed'

// Prescribed exercise shape (used in workout_templates and assigned_workouts JSONB)
export interface PrescribedExercise {
  name: string
  targetSets: number
  targetReps: string
  notes?: string
  targetWeight?: number
}

// workout_templates row
export interface WorkoutTemplate {
  id: string
  created_at: string
  updated_at: string
  coach_id: string
  name: string
  exercises: PrescribedExercise[]
}

// assigned_workouts row
export interface AssignedWorkout {
  id: string
  created_at: string
  updated_at: string
  coach_id: string
  client_id: string
  template_id: string | null
  date: string
  exercises: PrescribedExercise[]
  notes: string | null
}

// weekly_checkins row
export interface WeeklyCheckin {
  id: string
  created_at: string
  updated_at: string
  client_id: string
  coach_id: string | null
  week_of: string
  status: CheckinStatus
  water_intake: string | null
  caffeine_intake: string | null
  hunger_level: number | null
  slip_ups: string | null
  refeed_date: string | null
  digestion: string | null
  training_progress: string | null
  training_feedback: string | null
  recovery_soreness: string | null
  sleep_quality: number | null
  sleep_hours: number | null
  stress_level: number | null
  stressors: string | null
  mental_health: string | null
  injuries: string | null
  cycle_status: string | null
  side_effects: string | null
  bloodwork_date: string | null
  open_feedback: string | null
  auto_weight_current: number | null
  auto_weight_weekly_avg: number | null
  auto_weight_change: number | null
  auto_step_avg: number | null
  auto_macro_hit_rate: number | null
  auto_cardio_sessions: number | null
  auto_workouts_completed: number | null
  coach_response: string | null
  reviewed_at: string | null
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          username: string | null
          role: UserRole
          gender: Gender | null
          fitness_level: FitnessLevel | null
          training_days_per_week: number | null
          weight: number | null
          height: number | null
          age: number | null
          goal: GoalType | null
          avatar_base: AvatarBase | null
          current_streak: number
          longest_streak: number
          last_check_in_date: string | null
          streak_paused: boolean
          onboarding_complete: boolean
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          username?: string | null
          role?: UserRole
          gender?: Gender | null
          fitness_level?: FitnessLevel | null
          training_days_per_week?: number | null
          weight?: number | null
          height?: number | null
          age?: number | null
          goal?: GoalType | null
          avatar_base?: AvatarBase | null
          current_streak?: number
          longest_streak?: number
          last_check_in_date?: string | null
          streak_paused?: boolean
          onboarding_complete?: boolean
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          role?: UserRole
          gender?: Gender | null
          fitness_level?: FitnessLevel | null
          training_days_per_week?: number | null
          weight?: number | null
          height?: number | null
          age?: number | null
          goal?: GoalType | null
          avatar_base?: AvatarBase | null
          current_streak?: number
          longest_streak?: number
          last_check_in_date?: string | null
          streak_paused?: boolean
          onboarding_complete?: boolean
        }
        Relationships: []
      }
      coach_clients: {
        Row: {
          id: string
          created_at: string
          coach_id: string
          client_id: string
          status: CoachClientStatus
        }
        Insert: {
          id?: string
          created_at?: string
          coach_id: string
          client_id: string
          status?: CoachClientStatus
        }
        Update: {
          id?: string
          created_at?: string
          coach_id?: string
          client_id?: string
          status?: CoachClientStatus
        }
        Relationships: []
      }
      invites: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          coach_id: string
          email: string
          status: InviteStatus
          token: string
          expires_at: string
          accepted_at: string | null
          accepted_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          coach_id: string
          email: string
          status?: InviteStatus
          token?: string
          expires_at?: string
          accepted_at?: string | null
          accepted_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          coach_id?: string
          email?: string
          status?: InviteStatus
          token?: string
          expires_at?: string
          accepted_at?: string | null
          accepted_by?: string | null
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          weight: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          weight: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          weight?: number
        }
        Relationships: []
      }
      macro_targets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          protein: number
          calories: number
          carbs: number
          fats: number
          activity_level: ActivityLevel
          set_by: MacroSetBy
          set_by_coach_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          protein: number
          calories: number
          carbs: number
          fats: number
          activity_level: ActivityLevel
          set_by?: MacroSetBy
          set_by_coach_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          protein?: number
          calories?: number
          carbs?: number
          fats?: number
          activity_level?: ActivityLevel
          set_by?: MacroSetBy
          set_by_coach_id?: string | null
        }
        Relationships: []
      }
      daily_macro_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          protein: number
          calories: number
          carbs: number
          fats: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          protein: number
          calories: number
          carbs: number
          fats: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          protein?: number
          calories?: number
          carbs?: number
          fats?: number
        }
        Relationships: []
      }
      logged_meals: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          name: string
          protein: number
          carbs: number
          fats: number
          calories: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          name: string
          protein: number
          carbs: number
          fats: number
          calories: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          name?: string
          protein?: number
          carbs?: number
          fats?: number
          calories?: number
        }
        Relationships: []
      }
      saved_meals: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          protein: number
          carbs: number
          fats: number
          calories: number
          usage_count: number
          ingredients: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          protein: number
          carbs: number
          fats: number
          calories: number
          usage_count?: number
          ingredients?: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          protein?: number
          carbs?: number
          fats?: number
          calories?: number
          usage_count?: number
          ingredients?: Json
        }
        Relationships: []
      }
      user_foods: {
        Row: {
          id: string
          user_id: string
          name: string
          brand: string | null
          protein: number
          carbs: number
          fats: number
          calories: number
          serving_size: number
          serving_description: string
          quantity: number
          unit: string
          is_favorite: boolean
          logged_at: number
        }
        Insert: {
          id: string
          user_id: string
          name: string
          brand?: string | null
          protein: number
          carbs: number
          fats: number
          calories: number
          serving_size: number
          serving_description: string
          quantity: number
          unit: string
          is_favorite?: boolean
          logged_at: number
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          brand?: string | null
          protein?: number
          carbs?: number
          fats?: number
          calories?: number
          serving_size?: number
          serving_description?: string
          quantity?: number
          unit?: string
          is_favorite?: boolean
          logged_at?: number
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          workout_type: WorkoutType
          completed: boolean
          duration_minutes: number | null
          exercises: Json
          xp_awarded: boolean
          assignment_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          workout_type: WorkoutType
          completed?: boolean
          duration_minutes?: number | null
          exercises?: Json
          xp_awarded?: boolean
          assignment_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          workout_type?: WorkoutType
          completed?: boolean
          duration_minutes?: number | null
          exercises?: Json
          xp_awarded?: boolean
          assignment_id?: string | null
        }
        Relationships: []
      }
      xp_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          source: XPSource
          amount: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          source: XPSource
          amount: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          source?: XPSource
          amount?: number
        }
        Relationships: []
      }
      workout_templates: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          coach_id: string
          name: string
          exercises: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          coach_id: string
          name: string
          exercises?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          coach_id?: string
          name?: string
          exercises?: Json
        }
        Relationships: []
      }
      assigned_workouts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          coach_id: string
          client_id: string
          template_id: string | null
          date: string
          exercises: Json
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          coach_id: string
          client_id: string
          template_id?: string | null
          date: string
          exercises: Json
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          coach_id?: string
          client_id?: string
          template_id?: string | null
          date?: string
          exercises?: Json
          notes?: string | null
        }
        Relationships: []
      }
      weekly_checkins: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          client_id: string
          coach_id: string | null
          week_of: string
          status: CheckinStatus
          water_intake: string | null
          caffeine_intake: string | null
          hunger_level: number | null
          slip_ups: string | null
          refeed_date: string | null
          digestion: string | null
          training_progress: string | null
          training_feedback: string | null
          recovery_soreness: string | null
          sleep_quality: number | null
          sleep_hours: number | null
          stress_level: number | null
          stressors: string | null
          mental_health: string | null
          injuries: string | null
          cycle_status: string | null
          side_effects: string | null
          bloodwork_date: string | null
          open_feedback: string | null
          auto_weight_current: number | null
          auto_weight_weekly_avg: number | null
          auto_weight_change: number | null
          auto_step_avg: number | null
          auto_macro_hit_rate: number | null
          auto_cardio_sessions: number | null
          auto_workouts_completed: number | null
          coach_response: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          client_id: string
          coach_id?: string | null
          week_of: string
          status?: CheckinStatus
          water_intake?: string | null
          caffeine_intake?: string | null
          hunger_level?: number | null
          slip_ups?: string | null
          refeed_date?: string | null
          digestion?: string | null
          training_progress?: string | null
          training_feedback?: string | null
          recovery_soreness?: string | null
          sleep_quality?: number | null
          sleep_hours?: number | null
          stress_level?: number | null
          stressors?: string | null
          mental_health?: string | null
          injuries?: string | null
          cycle_status?: string | null
          side_effects?: string | null
          bloodwork_date?: string | null
          open_feedback?: string | null
          auto_weight_current?: number | null
          auto_weight_weekly_avg?: number | null
          auto_weight_change?: number | null
          auto_step_avg?: number | null
          auto_macro_hit_rate?: number | null
          auto_cardio_sessions?: number | null
          auto_workouts_completed?: number | null
          coach_response?: string | null
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          client_id?: string
          coach_id?: string | null
          week_of?: string
          status?: CheckinStatus
          water_intake?: string | null
          caffeine_intake?: string | null
          hunger_level?: number | null
          slip_ups?: string | null
          refeed_date?: string | null
          digestion?: string | null
          training_progress?: string | null
          training_feedback?: string | null
          recovery_soreness?: string | null
          sleep_quality?: number | null
          sleep_hours?: number | null
          stress_level?: number | null
          stressors?: string | null
          mental_health?: string | null
          injuries?: string | null
          cycle_status?: string | null
          side_effects?: string | null
          bloodwork_date?: string | null
          open_feedback?: string | null
          auto_weight_current?: number | null
          auto_weight_weekly_avg?: number | null
          auto_weight_change?: number | null
          auto_step_avg?: number | null
          auto_macro_hit_rate?: number | null
          auto_cardio_sessions?: number | null
          auto_workouts_completed?: number | null
          coach_response?: string | null
          reviewed_at?: string | null
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          id: string
          user_id: string
          total_xp: number
          current_level: number
          pending_xp: number
          last_claim_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          total_xp?: number
          current_level?: number
          pending_xp?: number
          last_claim_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          total_xp?: number
          current_level?: number
          pending_xp?: number
          last_claim_date?: string | null
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          platform: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          platform: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          platform?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      coach_client_summary: {
        Row: {
          coach_id: string | null
          client_id: string | null
          status: CoachClientStatus | null
          username: string | null
          email: string | null
          current_streak: number | null
          longest_streak: number | null
          last_check_in_date: string | null
          goal: GoalType | null
          onboarding_complete: boolean | null
          current_level: number | null
          total_xp: number | null
          latest_weight: number | null
          latest_weight_date: string | null
          workouts_last_7_days: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      gender: Gender
      fitness_level: FitnessLevel
      goal_type: GoalType
      avatar_base: AvatarBase
      activity_level: ActivityLevel
      workout_type: WorkoutType
      xp_source: XPSource
      coach_client_status: CoachClientStatus
      invite_status: InviteStatus
      macro_set_by: MacroSetBy
      checkin_status: CheckinStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
