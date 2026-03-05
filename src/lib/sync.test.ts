import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUserStore } from '@/stores/userStore'

// Mock supabase module
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {}, // truthy so guards pass
  isSupabaseConfigured: true,
  getSupabaseClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args)
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs)
            return { single: mockSingle }
          }
        }
      }
    })
  })
}))

// Must import after mocks are set up
const { loadProfileFromCloud } = await import('@/lib/sync')

const MOCK_USER_ID = 'user-123'

const cloudProfileRow = {
  id: MOCK_USER_ID,
  email: 'test@example.com',
  username: 'TestUser',
  gender: 'male',
  fitness_level: 'intermediate',
  training_days_per_week: 4,
  weight: 180,
  height: 72,
  age: 30,
  goal: 'cut',
  archetype: 'bro',
  current_streak: 5,
  longest_streak: 10,
  last_check_in_date: '2024-06-01',
  streak_paused: false,
  onboarding_complete: true,
  created_at: '2024-01-01T00:00:00Z',
  role: 'client',
}

describe('loadProfileFromCloud', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset user store to null profile (fresh browser state)
    useUserStore.setState({ profile: null, weightHistory: [] })

    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: MOCK_USER_ID } }
    })
  })

  it('should restore full profile from cloud when local profile is null', async () => {
    // Simulate fresh browser — no local profile
    expect(useUserStore.getState().profile).toBeNull()

    mockSingle.mockResolvedValue({ data: cloudProfileRow, error: null })

    const result = await loadProfileFromCloud()

    expect(result.error).toBeNull()

    const profile = useUserStore.getState().profile
    expect(profile).not.toBeNull()
    expect(profile!.onboardingComplete).toBe(true)
    expect(profile!.username).toBe('TestUser')
    expect(profile!.fitnessLevel).toBe('intermediate')
    expect(profile!.trainingDaysPerWeek).toBe(4)
    expect(profile!.weight).toBe(180)
    expect(profile!.height).toBe(72)
    expect(profile!.age).toBe(30)
    expect(profile!.goal).toBe('cut')
    expect(profile!.archetype).toBe('bro')
    expect(profile!.currentStreak).toBe(5)
    expect(profile!.longestStreak).toBe(10)
    expect(profile!.createdAt).toBe(new Date('2024-01-01T00:00:00Z').getTime())
  })

  it('should merge cloud profile into existing local profile', async () => {
    // Simulate existing local profile (same device, cache intact)
    useUserStore.setState({
      profile: {
        username: 'OldName',
        gender: 'male',
        fitnessLevel: 'beginner',
        trainingDaysPerWeek: 3,
        weight: 150,
        height: 68,
        age: 25,
        goal: 'maintain',
        archetype: 'bro',
        createdAt: 1000000,
        currentStreak: 0,
        longestStreak: 0,
        lastCheckInDate: null,
        streakPaused: false,
        onboardingComplete: true,
        units: 'metric', // locally set to metric
      }
    })

    mockSingle.mockResolvedValue({ data: cloudProfileRow, error: null })

    await loadProfileFromCloud()

    const profile = useUserStore.getState().profile
    expect(profile).not.toBeNull()
    // Cloud values should overwrite
    expect(profile!.username).toBe('TestUser')
    expect(profile!.weight).toBe(180)
    expect(profile!.currentStreak).toBe(5)
    // Local-only fields should be preserved
    expect(profile!.units).toBe('metric')
    expect(profile!.createdAt).toBe(1000000)
  })

  it('should not set profile when cloud onboarding_complete is false', async () => {
    mockSingle.mockResolvedValue({
      data: { ...cloudProfileRow, onboarding_complete: false },
      error: null
    })

    await loadProfileFromCloud()

    expect(useUserStore.getState().profile).toBeNull()
  })

  it('should return error when supabase query fails', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Row not found' }
    })

    const result = await loadProfileFromCloud()

    expect(result.error).toBe('Row not found')
    expect(useUserStore.getState().profile).toBeNull()
  })

  it('should return error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null }
    })

    const result = await loadProfileFromCloud()

    expect(result.error).toBe('Not authenticated')
  })

  it('should set default units to imperial when restoring from cloud with null local profile', async () => {
    mockSingle.mockResolvedValue({ data: cloudProfileRow, error: null })

    await loadProfileFromCloud()

    const profile = useUserStore.getState().profile
    expect(profile!.units).toBe('imperial')
  })
})
