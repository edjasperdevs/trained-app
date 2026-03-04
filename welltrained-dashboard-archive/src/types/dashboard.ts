// =====================================================
// DASHBOARD TYPES
// =====================================================

export type SubmissionStatus = 'new' | 'reviewed' | 'active' | 'archived'

export const STATUS_OPTIONS: { value: SubmissionStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

export interface IntakePhoto {
  id: string
  submission_id: string
  photo_type: 'front_relaxed' | 'back_relaxed' | 'side_relaxed' | 'front_flexed'
  storage_path: string
  created_at: string
}

export interface Submission {
  // System fields
  id: string
  created_at: string
  updated_at: string
  status: SubmissionStatus
  coach_notes: string | null

  // Personal Information
  full_name: string
  preferred_name: string | null
  date_of_birth: string | null
  email: string
  phone: string | null
  city_state_timezone: string | null
  preferred_communication: string | null

  // Body Composition
  fasted_weight: number | null
  height: string | null
  body_fat_percent: number | null
  measurement_chest: number | null
  measurement_waist: number | null
  measurement_hips: number | null
  measurement_shoulders: number | null
  measurement_r_bicep: number | null
  measurement_l_bicep: number | null
  measurement_r_thigh: number | null
  measurement_l_thigh: number | null
  measurement_neck: number | null

  // Goals & Motivation
  primary_goal: string | null
  target_physique: string | null
  target_date: string | null
  commitment_level: number | null
  past_obstacles: string | null
  why_now: string | null

  // Training
  training_experience: string | null
  training_days_per_week: number | null
  session_length_minutes: number | null
  training_time_of_day: string | null
  training_location: string | null
  available_equipment: string | null
  current_split: string | null
  favorite_exercises: string | null
  exercises_to_avoid: string | null
  bench_press: string | null
  squat: string | null
  deadlift: string | null
  ohp: string | null
  barbell_row: string | null
  pullups: string | null
  current_cardio: string | null
  preferred_cardio: string | null
  avg_daily_steps: string | null

  // Nutrition
  tracking_macros: boolean | null
  current_macro_targets: string | null
  meals_per_day: number | null
  meal_prep: boolean | null
  typical_day_of_eating: string | null
  go_to_foods: string | null
  food_dislikes_allergies: string | null
  dietary_approach: string | null
  binge_emotional_eating: string | null
  eating_out_frequency: string | null
  alcohol: string | null
  daily_water_intake: string | null

  // Supplements & Gear
  current_supplements: string | null
  ped_history: string | null
  ped_details: string | null
  hormone_clinic: boolean | null
  bloodwork_regular: boolean | null
  bloodwork_flags: string | null

  // Health & Injuries
  current_injuries: string | null
  past_injuries_surgeries: string | null
  medical_conditions: string | null
  prescription_medications: string | null
  mobility_limitations: string | null

  // Lifestyle & Recovery
  occupation_schedule: string | null
  avg_sleep_hours: number | null
  sleep_quality: number | null
  sleep_issues: string | null
  stress_level: number | null
  stress_sources: string | null
  recovery_tools: string | null
  substance_use: string | null

  // Coaching Preferences
  coaching_style_preference: string | null
  feedback_preference: string | null
  previous_coaching_experience: string | null
  number_one_need: string | null

  // Agreement
  agreement_signed: boolean
  signature_name: string | null
  signature_date: string | null
}

export type SubmissionWithPhotos = Submission & {
  intake_photos: IntakePhoto[]
}

// =====================================================
// SECTION CONFIGURATION FOR DASHBOARD DISPLAY
// =====================================================

interface FieldConfig {
  key: keyof Submission
  label: string
}

interface SectionConfig {
  title: string
  fields: FieldConfig[]
}

export const SECTION_CONFIG: SectionConfig[] = [
  {
    title: 'Personal Information',
    fields: [
      { key: 'full_name', label: 'Full Name' },
      { key: 'preferred_name', label: 'Preferred Name' },
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'city_state_timezone', label: 'City/State/Timezone' },
      { key: 'preferred_communication', label: 'Preferred Communication' },
    ],
  },
  {
    title: 'Body Composition',
    fields: [
      { key: 'fasted_weight', label: 'Fasted Weight (lbs)' },
      { key: 'height', label: 'Height' },
      { key: 'body_fat_percent', label: 'Body Fat %' },
      { key: 'measurement_chest', label: 'Chest (in)' },
      { key: 'measurement_waist', label: 'Waist (in)' },
      { key: 'measurement_hips', label: 'Hips (in)' },
      { key: 'measurement_shoulders', label: 'Shoulders (in)' },
      { key: 'measurement_r_bicep', label: 'Right Bicep (in)' },
      { key: 'measurement_l_bicep', label: 'Left Bicep (in)' },
      { key: 'measurement_r_thigh', label: 'Right Thigh (in)' },
      { key: 'measurement_l_thigh', label: 'Left Thigh (in)' },
      { key: 'measurement_neck', label: 'Neck (in)' },
    ],
  },
  {
    title: 'Goals & Motivation',
    fields: [
      { key: 'primary_goal', label: 'Primary Goal' },
      { key: 'target_physique', label: 'Target Physique' },
      { key: 'target_date', label: 'Target Date' },
      { key: 'commitment_level', label: 'Commitment Level (1-10)' },
      { key: 'past_obstacles', label: 'Past Obstacles' },
      { key: 'why_now', label: 'Why Now' },
    ],
  },
  {
    title: 'Training History',
    fields: [
      { key: 'training_experience', label: 'Training Experience' },
      { key: 'training_days_per_week', label: 'Training Days/Week' },
      { key: 'session_length_minutes', label: 'Session Length (min)' },
      { key: 'training_time_of_day', label: 'Training Time of Day' },
      { key: 'training_location', label: 'Training Location' },
      { key: 'available_equipment', label: 'Available Equipment' },
      { key: 'current_split', label: 'Current Split' },
      { key: 'favorite_exercises', label: 'Favorite Exercises' },
      { key: 'exercises_to_avoid', label: 'Exercises to Avoid' },
      { key: 'bench_press', label: 'Bench Press' },
      { key: 'squat', label: 'Squat' },
      { key: 'deadlift', label: 'Deadlift' },
      { key: 'ohp', label: 'Overhead Press' },
      { key: 'barbell_row', label: 'Barbell Row' },
      { key: 'pullups', label: 'Pull-ups' },
      { key: 'current_cardio', label: 'Current Cardio' },
      { key: 'preferred_cardio', label: 'Preferred Cardio' },
      { key: 'avg_daily_steps', label: 'Avg Daily Steps' },
    ],
  },
  {
    title: 'Nutrition',
    fields: [
      { key: 'tracking_macros', label: 'Tracking Macros' },
      { key: 'current_macro_targets', label: 'Current Macro Targets' },
      { key: 'meals_per_day', label: 'Meals per Day' },
      { key: 'meal_prep', label: 'Meal Prep' },
      { key: 'typical_day_of_eating', label: 'Typical Day of Eating' },
      { key: 'go_to_foods', label: 'Go-To Foods' },
      { key: 'food_dislikes_allergies', label: 'Food Dislikes/Allergies' },
      { key: 'dietary_approach', label: 'Dietary Approach' },
      { key: 'binge_emotional_eating', label: 'Binge/Emotional Eating' },
      { key: 'eating_out_frequency', label: 'Eating Out Frequency' },
      { key: 'alcohol', label: 'Alcohol' },
      { key: 'daily_water_intake', label: 'Daily Water Intake' },
    ],
  },
  {
    title: 'Supplements & Gear',
    fields: [
      { key: 'current_supplements', label: 'Current Supplements' },
      { key: 'ped_history', label: 'PED History' },
      { key: 'ped_details', label: 'PED Details' },
      { key: 'hormone_clinic', label: 'Hormone Clinic' },
      { key: 'bloodwork_regular', label: 'Regular Bloodwork' },
      { key: 'bloodwork_flags', label: 'Bloodwork Flags' },
    ],
  },
  {
    title: 'Health & Injuries',
    fields: [
      { key: 'current_injuries', label: 'Current Injuries' },
      { key: 'past_injuries_surgeries', label: 'Past Injuries/Surgeries' },
      { key: 'medical_conditions', label: 'Medical Conditions' },
      { key: 'prescription_medications', label: 'Prescription Medications' },
      { key: 'mobility_limitations', label: 'Mobility Limitations' },
    ],
  },
  {
    title: 'Lifestyle & Recovery',
    fields: [
      { key: 'occupation_schedule', label: 'Occupation/Schedule' },
      { key: 'avg_sleep_hours', label: 'Avg Sleep Hours' },
      { key: 'sleep_quality', label: 'Sleep Quality (1-10)' },
      { key: 'sleep_issues', label: 'Sleep Issues' },
      { key: 'stress_level', label: 'Stress Level (1-10)' },
      { key: 'stress_sources', label: 'Stress Sources' },
      { key: 'recovery_tools', label: 'Recovery Tools' },
      { key: 'substance_use', label: 'Substance Use' },
    ],
  },
  {
    title: 'Coaching Preferences',
    fields: [
      { key: 'coaching_style_preference', label: 'Coaching Style Preference' },
      { key: 'feedback_preference', label: 'Feedback Preference' },
      { key: 'previous_coaching_experience', label: 'Previous Coaching Experience' },
      { key: 'number_one_need', label: 'Number One Need' },
    ],
  },
  {
    title: 'Photos & Agreement',
    fields: [
      { key: 'agreement_signed', label: 'Agreement Signed' },
      { key: 'signature_name', label: 'Signature Name' },
      { key: 'signature_date', label: 'Signature Date' },
    ],
  },
]
