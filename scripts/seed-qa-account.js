#!/usr/bin/env node
/**
 * Seed a QA test account in production with realistic data
 *
 * Usage: node scripts/seed-qa-account.js <email> <password>
 * Example: node scripts/seed-qa-account.js qa@example.com MyPassword123!
 */

import { createClient } from '@supabase/supabase-js'

// Production Supabase credentials
const SUPABASE_URL = 'https://yodbxsbxrbariqeywyai.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZGJ4c2J4cmJhcmlxZXl3eWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDQ5OTYsImV4cCI6MjA4NTgyMDk5Nn0.ktSP25p2GdqWxjiECgGbwji-a5LioUsG8e4_fpN0dUo'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper functions
const today = new Date()
const toISO = (d) => d.toISOString().split('T')[0]
const daysAgo = (n) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d
}

async function seedQAAccount(email, password) {
  console.log(`\n🌱 Seeding QA account: ${email}\n`)

  // Step 1: Try to sign in first (in case user already exists)
  console.log('1. Setting up user account...')
  let userId

  // Try signing in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    // User doesn't exist or wrong password, try to create
    console.log('   User not found, creating new account...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error('   ❌ Failed to create user:', authError.message)
      process.exit(1)
    }

    userId = authData.user?.id
    console.log(`   ✅ Created user ID: ${userId}`)

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Sign in to get proper session
    console.log('   Signing in...')
    const { data: newSignIn, error: newSignInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (newSignInError) {
      console.error('   ❌ Failed to sign in after creation:', newSignInError.message)
      process.exit(1)
    }
    userId = newSignIn.user?.id
  } else {
    userId = signInData.user?.id
    console.log(`   ✅ Signed in as existing user: ${userId}`)
  }

  if (!userId) {
    console.error('   ❌ No user ID available')
    process.exit(1)
  }

  // Step 2: Update profile with onboarding data
  console.log('2. Setting up profile (onboarding complete)...')
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      username: 'QATester',
      gender: 'male',
      fitness_level: 'intermediate',
      training_days_per_week: 4,
      workout_days: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
      weight: 180,
      height: 70, // 5'10"
      age: 30,
      goal: 'recomp',
      avatar_base: 'dominant',
      current_streak: 3,
      longest_streak: 7,
      last_check_in_date: toISO(today),
      onboarding_complete: true,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('   ❌ Failed to update profile:', profileError.message)
  } else {
    console.log('   ✅ Profile updated')
  }

  // Step 3: Add macro targets
  console.log('3. Setting up macro targets...')
  const { error: macroTargetError } = await supabase
    .from('macro_targets')
    .upsert({
      user_id: userId,
      protein: 180,
      calories: 2400,
      carbs: 240,
      fats: 70,
      activity_level: 'moderate',
      set_by: 'self',
    }, { onConflict: 'user_id' })

  if (macroTargetError) {
    console.error('   ❌ Failed to set macro targets:', macroTargetError.message)
  } else {
    console.log('   ✅ Macro targets set')
  }

  // Step 4: Add weight logs (last 5 days)
  console.log('4. Adding weight logs...')
  const weightLogs = [
    { user_id: userId, date: toISO(daysAgo(4)), weight: 181.2 },
    { user_id: userId, date: toISO(daysAgo(3)), weight: 180.8 },
    { user_id: userId, date: toISO(daysAgo(2)), weight: 180.5 },
    { user_id: userId, date: toISO(daysAgo(1)), weight: 180.2 },
    { user_id: userId, date: toISO(today), weight: 180.0 },
  ]

  const { error: weightError } = await supabase
    .from('weight_logs')
    .upsert(weightLogs, { onConflict: 'user_id,date' })

  if (weightError) {
    console.error('   ❌ Failed to add weight logs:', weightError.message)
  } else {
    console.log(`   ✅ Added ${weightLogs.length} weight logs`)
  }

  // Step 5: Add workout logs (2 days)
  console.log('5. Adding workout logs...')
  const workoutLogs = [
    {
      user_id: userId,
      date: toISO(daysAgo(2)),
      workout_type: 'push',
      completed: true,
      duration_minutes: 55,
      xp_awarded: true,
      exercises: [
        {
          name: 'Bench Press',
          targetSets: 4,
          targetReps: '8-10',
          sets: [
            { weight: 155, reps: 10, completed: true, skipped: false },
            { weight: 165, reps: 8, completed: true, skipped: false },
            { weight: 165, reps: 8, completed: true, skipped: false },
            { weight: 155, reps: 10, completed: true, skipped: false },
          ]
        },
        {
          name: 'Incline Dumbbell Press',
          targetSets: 3,
          targetReps: '10-12',
          sets: [
            { weight: 50, reps: 12, completed: true, skipped: false },
            { weight: 55, reps: 10, completed: true, skipped: false },
            { weight: 55, reps: 10, completed: true, skipped: false },
          ]
        },
        {
          name: 'Cable Flyes',
          targetSets: 3,
          targetReps: '12-15',
          sets: [
            { weight: 30, reps: 15, completed: true, skipped: false },
            { weight: 30, reps: 14, completed: true, skipped: false },
            { weight: 30, reps: 12, completed: true, skipped: false },
          ]
        },
        {
          name: 'Overhead Press',
          targetSets: 3,
          targetReps: '8-10',
          sets: [
            { weight: 95, reps: 10, completed: true, skipped: false },
            { weight: 95, reps: 9, completed: true, skipped: false },
            { weight: 95, reps: 8, completed: true, skipped: false },
          ]
        },
      ]
    },
    {
      user_id: userId,
      date: toISO(daysAgo(1)),
      workout_type: 'pull',
      completed: true,
      duration_minutes: 50,
      xp_awarded: true,
      exercises: [
        {
          name: 'Barbell Rows',
          targetSets: 4,
          targetReps: '6-10',
          sets: [
            { weight: 145, reps: 10, completed: true, skipped: false },
            { weight: 155, reps: 8, completed: true, skipped: false },
            { weight: 155, reps: 8, completed: true, skipped: false },
            { weight: 145, reps: 9, completed: true, skipped: false },
          ]
        },
        {
          name: 'Lat Pulldowns',
          targetSets: 3,
          targetReps: '10-12',
          sets: [
            { weight: 120, reps: 12, completed: true, skipped: false },
            { weight: 130, reps: 10, completed: true, skipped: false },
            { weight: 130, reps: 10, completed: true, skipped: false },
          ]
        },
        {
          name: 'Face Pulls',
          targetSets: 3,
          targetReps: '15-20',
          sets: [
            { weight: 40, reps: 20, completed: true, skipped: false },
            { weight: 40, reps: 18, completed: true, skipped: false },
            { weight: 40, reps: 16, completed: true, skipped: false },
          ]
        },
        {
          name: 'Barbell Curls',
          targetSets: 3,
          targetReps: '10-12',
          sets: [
            { weight: 65, reps: 12, completed: true, skipped: false },
            { weight: 65, reps: 11, completed: true, skipped: false },
            { weight: 65, reps: 10, completed: true, skipped: false },
          ]
        },
      ]
    },
  ]

  const { error: workoutError } = await supabase
    .from('workout_logs')
    .insert(workoutLogs)

  if (workoutError) {
    console.error('   ❌ Failed to add workout logs:', workoutError.message)
  } else {
    console.log(`   ✅ Added ${workoutLogs.length} workout logs`)
  }

  // Step 6: Add daily macro logs (3 days)
  console.log('6. Adding daily macro logs...')
  const macroLogs = [
    { user_id: userId, date: toISO(daysAgo(2)), protein: 175, calories: 2350, carbs: 235, fats: 68 },
    { user_id: userId, date: toISO(daysAgo(1)), protein: 182, calories: 2420, carbs: 242, fats: 72 },
    { user_id: userId, date: toISO(today), protein: 95, calories: 1250, carbs: 120, fats: 38 }, // Partial day
  ]

  const { error: macroLogError } = await supabase
    .from('daily_macro_logs')
    .upsert(macroLogs, { onConflict: 'user_id,date' })

  if (macroLogError) {
    console.error('   ❌ Failed to add macro logs:', macroLogError.message)
  } else {
    console.log(`   ✅ Added ${macroLogs.length} macro logs`)
  }

  // Step 7: Add logged meals
  console.log('7. Adding logged meals...')
  const loggedMeals = [
    // Day 2 ago
    { user_id: userId, date: toISO(daysAgo(2)), name: 'Eggs & Oatmeal', protein: 35, carbs: 45, fats: 18, calories: 478 },
    { user_id: userId, date: toISO(daysAgo(2)), name: 'Chicken & Rice', protein: 48, carbs: 60, fats: 12, calories: 540 },
    { user_id: userId, date: toISO(daysAgo(2)), name: 'Protein Shake', protein: 50, carbs: 10, fats: 5, calories: 285 },
    { user_id: userId, date: toISO(daysAgo(2)), name: 'Salmon & Veggies', protein: 42, carbs: 30, fats: 22, calories: 486 },
    // Day 1 ago
    { user_id: userId, date: toISO(daysAgo(1)), name: 'Greek Yogurt Bowl', protein: 30, carbs: 35, fats: 8, calories: 332 },
    { user_id: userId, date: toISO(daysAgo(1)), name: 'Turkey Sandwich', protein: 42, carbs: 55, fats: 18, calories: 546 },
    { user_id: userId, date: toISO(daysAgo(1)), name: 'Post-Workout Shake', protein: 55, carbs: 45, fats: 8, calories: 472 },
    { user_id: userId, date: toISO(daysAgo(1)), name: 'Steak & Potatoes', protein: 55, carbs: 65, fats: 28, calories: 728 },
    // Today (partial)
    { user_id: userId, date: toISO(today), name: 'Breakfast Burrito', protein: 38, carbs: 48, fats: 16, calories: 488 },
    { user_id: userId, date: toISO(today), name: 'Chicken Salad', protein: 45, carbs: 25, fats: 18, calories: 438 },
  ]

  const { error: mealsError } = await supabase
    .from('logged_meals')
    .insert(loggedMeals)

  if (mealsError) {
    console.error('   ❌ Failed to add logged meals:', mealsError.message)
  } else {
    console.log(`   ✅ Added ${loggedMeals.length} logged meals`)
  }

  // Step 8: Add XP record
  console.log('8. Setting up XP...')
  const { error: xpError } = await supabase
    .from('user_xp')
    .upsert({
      user_id: userId,
      total_xp: 850,
      current_level: 4,
      pending_xp: 125,
      last_claim_date: toISO(daysAgo(1)),
    }, { onConflict: 'user_id' })

  if (xpError) {
    console.error('   ❌ Failed to set XP:', xpError.message)
  } else {
    console.log('   ✅ XP record created')
  }

  // Step 9: Add XP logs
  console.log('9. Adding XP history...')
  const xpLogs = [
    { user_id: userId, date: toISO(daysAgo(2)), source: 'workout', amount: 100 },
    { user_id: userId, date: toISO(daysAgo(2)), source: 'protein', amount: 50 },
    { user_id: userId, date: toISO(daysAgo(2)), source: 'calories', amount: 50 },
    { user_id: userId, date: toISO(daysAgo(2)), source: 'checkin', amount: 25 },
    { user_id: userId, date: toISO(daysAgo(1)), source: 'workout', amount: 100 },
    { user_id: userId, date: toISO(daysAgo(1)), source: 'protein', amount: 50 },
    { user_id: userId, date: toISO(daysAgo(1)), source: 'calories', amount: 50 },
    { user_id: userId, date: toISO(daysAgo(1)), source: 'checkin', amount: 25 },
  ]

  const { error: xpLogError } = await supabase
    .from('xp_logs')
    .insert(xpLogs)

  if (xpLogError) {
    console.error('   ❌ Failed to add XP logs:', xpLogError.message)
  } else {
    console.log(`   ✅ Added ${xpLogs.length} XP log entries`)
  }

  // Sign out
  await supabase.auth.signOut()

  console.log('\n✅ QA Account Setup Complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   Email:    ${email}`)
  console.log(`   Password: ${password}`)
  console.log(`   User ID:  ${userId}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nThe account has:')
  console.log('   • Completed onboarding')
  console.log('   • 5 days of weight logs')
  console.log('   • 2 completed workouts (Push + Pull)')
  console.log('   • 3 days of meal tracking')
  console.log('   • Level 4 with 850 XP')
  console.log('   • 3-day streak')
  console.log('\n')
}

// Main
const [email, password] = process.argv.slice(2)

if (!email || !password) {
  console.error('Usage: node scripts/seed-qa-account.js <email> <password>')
  console.error('Example: node scripts/seed-qa-account.js qa@example.com TestPass123!')
  process.exit(1)
}

seedQAAccount(email, password).catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
