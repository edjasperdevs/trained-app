/**
 * Date utilities using LOCAL timezone consistently.
 * All user-facing date operations should use these helpers.
 */

/**
 * Get today's date string in YYYY-MM-DD format using LOCAL timezone.
 * This is the correct format for comparing user activity dates.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get the start of a local day (midnight local time).
 */
export function getStartOfLocalDay(date: Date = new Date()): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get the number of calendar days between two dates in local timezone.
 * Returns positive if date1 is before date2.
 */
export function getLocalDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseLocalDateString(date1) : getStartOfLocalDay(date1)
  const d2 = typeof date2 === 'string' ? parseLocalDateString(date2) : getStartOfLocalDay(date2)

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay)
}

/**
 * Parse a YYYY-MM-DD string as a local date (midnight local time).
 * This avoids timezone issues that occur with new Date('YYYY-MM-DD').
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/**
 * Check if two date strings represent the same local day.
 */
export function isSameLocalDay(date1: string, date2: string): boolean {
  return date1 === date2
}

/**
 * Check if date1 is the day before date2 (consecutive days).
 */
export function isConsecutiveDay(date1: string, date2: string): boolean {
  return getLocalDaysDifference(date1, date2) === 1
}

/**
 * Get the start of the current local week (Sunday at midnight local time).
 */
export function getStartOfLocalWeek(date: Date = new Date()): Date {
  const result = getStartOfLocalDay(date)
  result.setDate(result.getDate() - result.getDay()) // Go back to Sunday
  return result
}

/**
 * Get local week string in YYYY-MM-DD format (the Sunday of that week).
 */
export function getLocalWeekString(date: Date = new Date()): string {
  return getLocalDateString(getStartOfLocalWeek(date))
}

/**
 * Check if a date is within the current local week.
 */
export function isCurrentLocalWeek(dateStr: string): boolean {
  const weekStart = getStartOfLocalWeek()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const date = parseLocalDateString(dateStr)
  return date >= weekStart && date < weekEnd
}

/**
 * Get the current day of week (0 = Sunday, 6 = Saturday) in local timezone.
 */
export function getLocalDayOfWeek(date: Date = new Date()): number {
  return date.getDay()
}

/**
 * Get days since a date string, in local timezone.
 */
export function getDaysSince(dateStr: string): number {
  return getLocalDaysDifference(dateStr, getLocalDateString())
}

/**
 * Human-readable relative time string (e.g., "5m ago", "2h ago", "3 days ago").
 */
export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}
