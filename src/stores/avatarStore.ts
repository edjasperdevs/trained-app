import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AvatarBase } from './userStore'

export type AvatarMood = 'happy' | 'neutral' | 'sad' | 'hyped' | 'neglected'

interface AvatarStore {
  baseCharacter: AvatarBase
  currentMood: AvatarMood
  accessories: string[]
  lastInteraction: number
  recentReaction: string | null

  // Actions
  setBaseCharacter: (base: AvatarBase) => void
  setMood: (mood: AvatarMood) => void
  triggerReaction: (type: 'checkIn' | 'levelUp' | 'missedDay' | 'streak' | 'claim') => void
  checkNeglected: () => void
  resetAvatar: () => void
  exportData: () => string
  importData: (data: string) => boolean
}

const REACTION_MESSAGES = {
  checkIn: ['Logged.', 'Noted.', 'Recorded.', 'Progress tracked.'],
  levelUp: ['Rank up.', 'Advancement unlocked.', 'New level achieved.'],
  missedDay: ['Missed day noted.', 'Return when ready.', 'Resume protocol.'],
  streak: ['Streak continues.', 'Consistency maintained.', 'Protocol followed.'],
  claim: ['Claimed.', 'Reward secured.', 'Points transferred.']
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      baseCharacter: 'dominant',
      currentMood: 'neutral',
      accessories: [],
      lastInteraction: Date.now(),
      recentReaction: null,

      setBaseCharacter: (base) => set({ baseCharacter: base }),

      setMood: (mood) => set({ currentMood: mood, lastInteraction: Date.now() }),

      triggerReaction: (type) => {
        const messages = REACTION_MESSAGES[type]
        const message = messages[Math.floor(Math.random() * messages.length)]

        let newMood: AvatarMood = 'happy'
        if (type === 'missedDay') newMood = 'sad'
        if (type === 'levelUp' || type === 'claim') newMood = 'hyped'

        set({
          currentMood: newMood,
          recentReaction: message,
          lastInteraction: Date.now()
        })

        // Clear reaction after 3 seconds
        setTimeout(() => {
          set({ recentReaction: null })
        }, 3000)
      },

      checkNeglected: () => {
        const lastInteraction = get().lastInteraction
        const now = Date.now()
        const daysSinceInteraction = (now - lastInteraction) / (1000 * 60 * 60 * 24)

        if (daysSinceInteraction >= 3) {
          set({ currentMood: 'neglected' })
        }
      },

      resetAvatar: () => set({
        baseCharacter: 'dominant',
        currentMood: 'neutral',
        accessories: [],
        lastInteraction: Date.now(),
        recentReaction: null
      }),

      exportData: () => {
        const state = get()
        return JSON.stringify({
          avatar: {
            baseCharacter: state.baseCharacter,
            currentMood: state.currentMood,
            accessories: state.accessories,
            lastInteraction: state.lastInteraction
          }
        }, null, 2)
      },

      importData: (data: string) => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.avatar) {
            set({
              baseCharacter: parsed.avatar.baseCharacter || 'dominant',
              currentMood: parsed.avatar.currentMood || 'neutral',
              accessories: parsed.avatar.accessories || [],
              lastInteraction: parsed.avatar.lastInteraction || Date.now()
            })
            return true
          }
          return false
        } catch {
          return false
        }
      }
    }),
    {
      name: 'gamify-gains-avatar',
    }
  )
)
