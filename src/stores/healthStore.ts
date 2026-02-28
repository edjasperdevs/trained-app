import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getLocalDateString } from '../lib/dateUtils'
import { isHealthAvailable, requestHealthPermission, readTodaySteps, readTodaySleep } from '../lib/health'

interface HealthStore {
  permissionStatus: 'unknown' | 'granted' | 'denied'
  todaySteps: number
  todaySleepMinutes: number
  manualSteps: number | null      // null = use HealthKit
  manualSleepMinutes: number | null
  lastFetchDate: string | null

  setPermissionStatus: (status: 'granted' | 'denied') => void
  setTodayHealth: (steps: number, sleepMinutes: number) => void
  setManualSteps: (steps: number) => void
  setManualSleep: (minutes: number) => void
  clearManualEntry: () => void
  getEffectiveSteps: () => number  // manual ?? todaySteps
  getEffectiveSleep: () => number  // manual ?? todaySleep
  fetchTodayHealth: () => Promise<void>  // calls health.ts functions
  requestPermission: () => Promise<boolean>  // request HealthKit permission
  resetHealth: () => void
}

const INITIAL_STATE = {
  permissionStatus: 'unknown' as const,
  todaySteps: 0,
  todaySleepMinutes: 0,
  manualSteps: null as number | null,
  manualSleepMinutes: null as number | null,
  lastFetchDate: null as string | null,
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setPermissionStatus: (status) => set({ permissionStatus: status }),

      setTodayHealth: (steps, sleepMinutes) => set({
        todaySteps: steps,
        todaySleepMinutes: sleepMinutes,
        lastFetchDate: getLocalDateString(),
      }),

      setManualSteps: (steps) => set({ manualSteps: steps }),

      setManualSleep: (minutes) => set({ manualSleepMinutes: minutes }),

      clearManualEntry: () => set({ manualSteps: null, manualSleepMinutes: null }),

      getEffectiveSteps: () => {
        const { manualSteps, todaySteps } = get()
        return manualSteps ?? todaySteps
      },

      getEffectiveSleep: () => {
        const { manualSleepMinutes, todaySleepMinutes } = get()
        return manualSleepMinutes ?? todaySleepMinutes
      },

      fetchTodayHealth: async () => {
        const state = get()
        const today = getLocalDateString()

        // Only fetch if we have permission and it's a new day or never fetched
        if (state.permissionStatus !== 'granted') return

        // Check if HealthKit is available
        const available = await isHealthAvailable()
        if (!available) return

        // Fetch today's data from HealthKit
        const steps = await readTodaySteps()
        const sleepMinutes = await readTodaySleep()

        set({
          todaySteps: steps,
          todaySleepMinutes: sleepMinutes,
          lastFetchDate: today,
        })
      },

      requestPermission: async () => {
        // Check if HealthKit is available first
        const available = await isHealthAvailable()
        if (!available) {
          set({ permissionStatus: 'denied' })
          return false
        }

        // Request permission
        const granted = await requestHealthPermission()
        set({ permissionStatus: granted ? 'granted' : 'denied' })
        return granted
      },

      resetHealth: () => {
        set({ ...INITIAL_STATE })
      },
    }),
    {
      name: 'trained-health',
    }
  )
)
