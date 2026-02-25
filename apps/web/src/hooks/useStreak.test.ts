import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStreak } from './useStreak'

function setDate(isoDate: string) {
  vi.setSystemTime(new Date(`${isoDate}T12:00:00`))
}

describe('useStreak', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts at 1 on first ever open', () => {
    setDate('2026-02-25')
    const { result } = renderHook(() => useStreak())
    expect(result.current.current).toBe(1)
    expect(result.current.longest).toBe(1)
  })

  it('stays at 1 when opened again on the same day', () => {
    setDate('2026-02-25')
    renderHook(() => useStreak()) // first open: ticks and stores
    sessionStorage.clear() // remove guard so logic re-runs
    const { result } = renderHook(() => useStreak())
    expect(result.current.current).toBe(1)
  })

  it('increments on a consecutive day', () => {
    setDate('2026-02-24')
    renderHook(() => useStreak())
    sessionStorage.clear()
    setDate('2026-02-25')
    const { result } = renderHook(() => useStreak())
    expect(result.current.current).toBe(2)
  })

  it('resets to 1 when a day is skipped', () => {
    setDate('2026-02-22')
    renderHook(() => useStreak())
    sessionStorage.clear()
    setDate('2026-02-25') // skipped 23 and 24
    const { result } = renderHook(() => useStreak())
    expect(result.current.current).toBe(1)
  })

  it('preserves longest streak across a reset', () => {
    setDate('2026-02-20')
    renderHook(() => useStreak())
    sessionStorage.clear()
    setDate('2026-02-21')
    renderHook(() => useStreak())
    sessionStorage.clear()
    setDate('2026-02-22')
    renderHook(() => useStreak())
    // skip to 2026-02-25 — streak resets to 1, longest stays 3
    sessionStorage.clear()
    setDate('2026-02-25')
    const { result } = renderHook(() => useStreak())
    expect(result.current.current).toBe(1)
    expect(result.current.longest).toBe(3)
  })

  it('does not double-increment when rendered twice on the same day', () => {
    setDate('2026-02-25')
    renderHook(() => useStreak()) // first render: ticks, sets sessionStorage to today
    // Do NOT clear sessionStorage — same session, same day
    const { result } = renderHook(() => useStreak())
    // Guard: sessionStorage('streak.ticked') === today, so logic is skipped
    expect(result.current.current).toBe(1)
  })
})
