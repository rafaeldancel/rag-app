import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReadingProgress } from './useReadingProgress'

describe('useReadingProgress', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with 0 chapters read when storage is empty', () => {
    const { result } = renderHook(() => useReadingProgress())
    expect(result.current.chaptersReadCount).toBe(0)
  })

  it('increments count when a chapter is marked read', () => {
    const { result } = renderHook(() => useReadingProgress())
    act(() => {
      result.current.markChapterRead('JHN', 3)
    })
    expect(result.current.chaptersReadCount).toBe(1)
  })

  it('is idempotent — marking the same chapter twice counts as one', () => {
    const { result } = renderHook(() => useReadingProgress())
    act(() => {
      result.current.markChapterRead('JHN', 3)
      result.current.markChapterRead('JHN', 3)
    })
    expect(result.current.chaptersReadCount).toBe(1)
  })

  it('counts multiple different chapters correctly', () => {
    const { result } = renderHook(() => useReadingProgress())
    act(() => {
      result.current.markChapterRead('JHN', 3)
      result.current.markChapterRead('PSA', 23)
      result.current.markChapterRead('ROM', 8)
    })
    expect(result.current.chaptersReadCount).toBe(3)
  })

  it('persists completed chapters to localStorage', () => {
    const { result } = renderHook(() => useReadingProgress())
    act(() => {
      result.current.markChapterRead('JHN', 3)
    })
    const stored = JSON.parse(localStorage.getItem('bible.chaptersRead') ?? '[]') as string[]
    expect(stored).toContain('JHN.3')
  })

  it('loads previously stored chapters on initialisation', () => {
    localStorage.setItem('bible.chaptersRead', JSON.stringify(['JHN.3', 'PSA.23']))
    const { result } = renderHook(() => useReadingProgress())
    expect(result.current.chaptersReadCount).toBe(2)
  })

  it('handles corrupt localStorage gracefully (starts at 0)', () => {
    localStorage.setItem('bible.chaptersRead', 'not-valid-json')
    const { result } = renderHook(() => useReadingProgress())
    expect(result.current.chaptersReadCount).toBe(0)
  })
})
