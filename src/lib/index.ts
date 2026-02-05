export { supabase, isSupabaseConfigured, getUser, isCoach } from './supabase'
export type { Database, UserRole } from './database.types'
export { analytics, trackEvent } from './analytics'
export { initSentry, captureError, captureMessage, setUser, clearUser, addBreadcrumb, ErrorBoundary } from './sentry'
export {
  syncProfileToCloud,
  loadProfileFromCloud,
  syncWeightLogsToCloud,
  loadWeightLogsFromCloud,
  syncMacroTargetsToCloud,
  syncDailyMacroLogToCloud,
  syncSavedMealsToCloud,
  syncWorkoutLogToCloud,
  syncXPToCloud,
  syncAllToCloud,
  loadAllFromCloud
} from './sync'
export { friendlyError } from './errors'
