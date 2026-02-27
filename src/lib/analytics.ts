/**
 * Analytics utilities for Plausible
 *
 * Plausible is privacy-friendly and doesn't require cookie consent.
 * Events are tracked anonymously with no personal data.
 *
 * Setup:
 * 1. Sign up at https://plausible.io
 * 2. Add your domain
 * 3. Replace YOUR_DOMAIN_HERE in index.html with your actual domain
 */

// Plausible's global function type
declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void
  }
}

/**
 * Track a custom event in Plausible
 * @param event - Event name (e.g., 'Signup', 'Workout Complete')
 * @param props - Optional properties to attach to the event
 */
export function trackEvent(
  event: string,
  props?: Record<string, string | number | boolean>
) {
  // Only track in production
  if (import.meta.env.DEV) {
    console.log('[Analytics]', event, props)
    return
  }

  // Call Plausible if available
  if (window.plausible) {
    window.plausible(event, props ? { props } : undefined)
  }
}

// ==========================================
// Pre-defined events for consistency
// ==========================================

export const analytics = {
  // Onboarding events
  onboardingStarted: () => trackEvent('Onboarding Started'),
  onboardingCompleted: (days: number) =>
    trackEvent('Onboarding Completed', { training_days: days }),

  // Workout events
  workoutStarted: (type: string) =>
    trackEvent('Workout Started', { workout_type: type }),
  workoutCompleted: (type: string, duration: number) =>
    trackEvent('Workout Completed', { workout_type: type, duration_minutes: duration }),
  quickWorkoutLogged: () => trackEvent('Quick Workout Logged'),

  // Macro events
  mealLogged: (source: 'manual' | 'search' | 'saved') =>
    trackEvent('Meal Logged', { source }),
  mealSaved: () => trackEvent('Meal Saved'),
  proteinTargetHit: () => trackEvent('Protein Target Hit'),
  calorieTargetHit: () => trackEvent('Calorie Target Hit'),

  // Gamification events
  checkInCompleted: (streak: number) =>
    trackEvent('Check-In Completed', { streak }),
  xpClaimed: (amount: number) =>
    trackEvent('XP Claimed', { amount }),
  levelUp: (level: number) =>
    trackEvent('Level Up', { level }),
  badgeEarned: (badge: string, rarity: string) =>
    trackEvent('Badge Earned', { badge, rarity }),
  // Engagement events
  appOpened: () => trackEvent('App Opened'),
  settingsViewed: () => trackEvent('Settings Viewed'),
  achievementsViewed: () => trackEvent('Achievements Viewed'),
  dataExported: () => trackEvent('Data Exported'),

  // Auth events (if using Supabase)
  signupCompleted: () => trackEvent('Signup Completed'),
  loginCompleted: () => trackEvent('Login Completed'),

}
