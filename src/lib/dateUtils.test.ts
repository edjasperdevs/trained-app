import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getLocalDateString,
  getTimeAgo,
  parseLocalDateString,
  getLocalDaysDifference,
  isConsecutiveDay,
} from './dateUtils'

describe('dateUtils', () => {
  describe('getLocalDateString', () => {
    it('returns YYYY-MM-DD for a known date', () => {
      const date = new Date(2026, 0, 15) // Jan 15, 2026
      expect(getLocalDateString(date)).toBe('2026-01-15')
    })

    it('pads single-digit months and days', () => {
      const date = new Date(2026, 2, 5) // Mar 5, 2026
      expect(getLocalDateString(date)).toBe('2026-03-05')
    })
  })

  describe('parseLocalDateString', () => {
    it('parses YYYY-MM-DD to midnight local time', () => {
      const date = parseLocalDateString('2026-06-15')
      expect(date.getFullYear()).toBe(2026)
      expect(date.getMonth()).toBe(5) // June = 5
      expect(date.getDate()).toBe(15)
      expect(date.getHours()).toBe(0)
    })
  })

  describe('getLocalDaysDifference', () => {
    it('returns positive for future dates', () => {
      expect(getLocalDaysDifference('2026-01-01', '2026-01-05')).toBe(4)
    })

    it('returns 0 for same day', () => {
      expect(getLocalDaysDifference('2026-03-10', '2026-03-10')).toBe(0)
    })
  })

  describe('isConsecutiveDay', () => {
    it('returns true for consecutive days', () => {
      expect(isConsecutiveDay('2026-01-14', '2026-01-15')).toBe(true)
    })

    it('returns false for non-consecutive days', () => {
      expect(isConsecutiveDay('2026-01-14', '2026-01-16')).toBe(false)
    })
  })

  describe('getTimeAgo', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('returns "Just now" for < 1 minute', () => {
      const now = new Date()
      expect(getTimeAgo(now.toISOString())).toBe('Just now')
    })

    it('returns minutes for < 1 hour', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000)
      expect(getTimeAgo(date.toISOString())).toBe('5m ago')
    })

    it('returns hours for < 24 hours', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
      expect(getTimeAgo(date.toISOString())).toBe('3h ago')
    })

    it('returns "1 day ago" for 1 day', () => {
      const date = new Date(Date.now() - 25 * 60 * 60 * 1000)
      expect(getTimeAgo(date.toISOString())).toBe('1 day ago')
    })

    it('returns "N days ago" for multiple days', () => {
      const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      expect(getTimeAgo(date.toISOString())).toBe('5 days ago')
    })
  })
})
