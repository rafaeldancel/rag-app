import { useState } from 'react'

export type BibleFont = 'lora' | 'georgia' | 'roboto-serif' | 'untitled-serif'

export interface BibleSettings {
  font: BibleFont
  /** 1 (smallest) – 10 (largest). Maps to actual font size via: 12 + fontScale px. */
  fontScale: number
}

const VALID_FONTS: BibleFont[] = ['lora', 'georgia', 'roboto-serif', 'untitled-serif']
const DEFAULTS: BibleSettings = { font: 'lora', fontScale: 5 }
const KEY = 'bible.settings'

export function useBibleSettings() {
  const [settings, setSettings] = useState<BibleSettings>(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.fontScale === 'number' && VALID_FONTS.includes(parsed.font)) {
          return parsed as BibleSettings
        }
      }
    } catch {
      // fall through
    }
    return DEFAULTS
  })

  function update(patch: Partial<BibleSettings>) {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  return { settings, update }
}
