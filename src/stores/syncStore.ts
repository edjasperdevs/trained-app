import { create } from 'zustand'

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error'

interface SyncStore {
  status: SyncStatus
  lastSyncedAt: string | null
  isOnline: boolean
  pendingChanges: boolean
  setStatus: (status: SyncStatus) => void
  setOnline: (online: boolean) => void
  setPendingChanges: (pending: boolean) => void
  setLastSyncedAt: (date: string) => void
}

export const useSyncStore = create<SyncStore>((set) => ({
  status: navigator.onLine ? 'synced' : 'offline',
  lastSyncedAt: null,
  isOnline: navigator.onLine,
  pendingChanges: false,
  setStatus: (status) => set({ status }),
  setOnline: (online) => set({ isOnline: online, status: online ? 'synced' : 'offline' }),
  setPendingChanges: (pending) => set({ pendingChanges: pending }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
}))
