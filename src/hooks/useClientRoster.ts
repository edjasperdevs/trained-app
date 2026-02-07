import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { getMockClients } from '@/lib/devSeed'

const devBypass = import.meta.env.VITE_DEV_BYPASS === 'true'

export const PAGE_SIZE = 20

export interface ClientSummary {
  client_id: string | null
  status: 'pending' | 'active' | 'inactive' | null
  username: string | null
  email: string | null
  current_streak: number | null
  longest_streak: number | null
  last_check_in_date: string | null
  goal: string | null
  onboarding_complete: boolean | null
  current_level: number | null
  total_xp: number | null
  latest_weight: number | null
  latest_weight_date: string | null
  workouts_last_7_days: number | null
}

interface UseClientRosterReturn {
  clients: ClientSummary[]
  totalCount: number
  page: number
  search: string
  isLoading: boolean
  error: string | null
  totalPages: number
  setPage: (page: number) => void
  setSearch: (search: string) => void
  refresh: () => void
}

async function fetchRosterPage(
  page: number,
  search: string
): Promise<{ clients: ClientSummary[]; totalCount: number }> {
  const client = getSupabaseClient()
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = client
    .from('coach_client_summary')
    .select('*', { count: 'estimated' })
    .order('username', { ascending: true, nullsFirst: false })

  const trimmed = search.trim()
  if (trimmed) {
    query = query.or(`username.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
  }

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) throw error

  return { clients: data || [], totalCount: count || 0 }
}

function fetchMockRosterPage(
  page: number,
  search: string
): { clients: ClientSummary[]; totalCount: number } {
  const allClients = getMockClients()
  const trimmed = search.trim().toLowerCase()

  const filtered = trimmed
    ? allClients.filter(
        (c) =>
          c.username.toLowerCase().includes(trimmed) ||
          c.email.toLowerCase().includes(trimmed)
      )
    : allClients

  const start = page * PAGE_SIZE
  const sliced = filtered.slice(start, start + PAGE_SIZE)

  return { clients: sliced as ClientSummary[], totalCount: filtered.length }
}

export function useClientRoster(): UseClientRosterReturn {
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearchState] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // setSearch: update display immediately, debounce the actual query
  const setSearch = useCallback((value: string) => {
    setSearchState(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      setPage(0)
      setDebouncedSearch(value)
    }, 400)
  }, [])

  // Fetch when page or debouncedSearch changes
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (devBypass) {
          const result = fetchMockRosterPage(page, debouncedSearch)
          if (!cancelled && mountedRef.current) {
            setClients(result.clients)
            setTotalCount(result.totalCount)
          }
          return
        }

        const result = await fetchRosterPage(page, debouncedSearch)
        if (!cancelled && mountedRef.current) {
          setClients(result.clients)
          setTotalCount(result.totalCount)
        }
      } catch (err) {
        console.error('[ClientRoster] Error fetching clients:', err)
        if (!cancelled && mountedRef.current) {
          if (err instanceof Error && err.message.includes('network')) {
            setError('Network error - check your connection')
          } else {
            setError('Failed to load clients')
          }
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // refresh: re-fetch current page with current search
  const refresh = useCallback(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (devBypass) {
          const result = fetchMockRosterPage(page, debouncedSearch)
          if (mountedRef.current) {
            setClients(result.clients)
            setTotalCount(result.totalCount)
          }
          return
        }

        const result = await fetchRosterPage(page, debouncedSearch)
        if (mountedRef.current) {
          setClients(result.clients)
          setTotalCount(result.totalCount)
        }
      } catch (err) {
        console.error('[ClientRoster] Error refreshing clients:', err)
        if (mountedRef.current) {
          if (err instanceof Error && err.message.includes('network')) {
            setError('Network error - check your connection')
          } else {
            setError('Failed to load clients')
          }
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    load()
  }, [page, debouncedSearch])

  return {
    clients,
    totalCount,
    page,
    search,
    isLoading,
    error,
    totalPages,
    setPage,
    setSearch,
    refresh,
  }
}
