import { useState } from 'react'

// Returns local date as YYYY-MM-DD to avoid UTC midnight timezone drift
function getTodayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Parse YYYY-MM-DD as a local date (not UTC) to correctly count calendar-day gaps
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysBetween(isoA: string, isoB: string): number {
  const msPerDay = 86_400_000
  return Math.round(
    Math.abs(parseLocalDate(isoB).getTime() - parseLocalDate(isoA).getTime()) / msPerDay
  )
}

export interface StreakData {
  current: number
  longest: number
}

/**
 * Increments the daily streak once per calendar day (guarded by sessionStorage).
 * Resets to 1 if the user missed a day. Returns { current, longest }.
 */
export function useStreak(): StreakData {
  const [data] = useState<StreakData>(() => {
    const today = getTodayISO()

    // Only run once per calendar day per browser session
    if (sessionStorage.getItem('streak.ticked') !== today) {
      const lastDate = localStorage.getItem('streak.lastDate')
      const count = parseInt(localStorage.getItem('streak.count') ?? '0', 10)
      const longest = parseInt(localStorage.getItem('streak.longest') ?? '0', 10)

      let newCount: number
      if (!lastDate) {
        newCount = 1 // first ever open
      } else {
        const diff = daysBetween(lastDate, today)
        if (diff === 0) {
          newCount = count // same day (defensive: shouldn't reach here due to guard)
        } else if (diff === 1) {
          newCount = count + 1 // opened consecutive day — streak continues
        } else {
          newCount = 1 // missed one or more days — reset
        }
      }

      const newLongest = Math.max(newCount, longest)
      localStorage.setItem('streak.count', String(newCount))
      localStorage.setItem('streak.lastDate', today)
      localStorage.setItem('streak.longest', String(newLongest))
      sessionStorage.setItem('streak.ticked', today)
    }

    return {
      current: parseInt(localStorage.getItem('streak.count') ?? '1', 10),
      longest: parseInt(localStorage.getItem('streak.longest') ?? '1', 10),
    }
  })

  return data
}
