import { useState, useCallback } from 'react'

const STORAGE_KEY = 'bible.chaptersRead'

function loadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function useReadingProgress() {
  const [chaptersRead, setChaptersRead] = useState<Set<string>>(() => loadSet())

  /** Call when the user finishes a chapter (scrolls past its end). Idempotent. */
  const markChapterRead = useCallback((book: string, chapter: number) => {
    const key = `${book}.${chapter}`
    setChaptersRead(prev => {
      if (prev.has(key)) return prev // no-op if already recorded
      const next = new Set(prev)
      next.add(key)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  return {
    chaptersReadCount: chaptersRead.size,
    markChapterRead,
  }
}
