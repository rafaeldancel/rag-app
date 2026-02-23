import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { cn } from '@repo/ui/utils'
import type { HighlightColor, Annotation } from '@repo/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectedVerse {
  number: number
  text: string
  usfm: string
}

interface VerseAnnotationModalProps {
  open: boolean
  verses: SelectedVerse[]
  chapterRef: string
  existingAnnotation?: Annotation | null
  isSaving: boolean
  onClose: () => void
  onSave: (highlight: HighlightColor, note: string) => void
  onAskAI: (prefill: string) => void
}

// ─── Highlight colours ────────────────────────────────────────────────────────

type HighlightOption = { color: HighlightColor; label: string; bg: string; ring: string }

const HIGHLIGHT_OPTIONS: HighlightOption[] = [
  { color: null, label: 'None', bg: 'bg-muted', ring: 'ring-muted-foreground/40' },
  {
    color: 'yellow',
    label: 'Yellow',
    bg: 'bg-yellow-300 dark:bg-yellow-600',
    ring: 'ring-yellow-400',
  },
  { color: 'blue', label: 'Blue', bg: 'bg-blue-300 dark:bg-blue-600', ring: 'ring-blue-400' },
  { color: 'green', label: 'Green', bg: 'bg-green-300 dark:bg-green-600', ring: 'ring-green-400' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Builds a human-readable verse label.
 *  Consecutive → range "John 3:16–17"; non-consecutive → list "John 3:1, 3". */
function buildLabel(chapterRef: string, verses: SelectedVerse[]) {
  if (verses.length === 0) return chapterRef
  const nums = verses.map(v => v.number).sort((a, b) => a - b)
  if (nums.length === 1) return `${chapterRef}:${nums[0]}`
  const isConsecutive = nums.every((n, i) => i === 0 || n === nums[i - 1]! + 1)
  const suffix = isConsecutive ? `:${nums[0]}–${nums[nums.length - 1]}` : `:${nums.join(', ')}`
  return `${chapterRef}${suffix}`
}

/** Builds the AI prefill string from selected verses. */
function buildAIPrefill(label: string, verses: SelectedVerse[]) {
  const sorted = [...verses].sort((a, b) => a.number - b.number)
  const text = sorted.map(v => `[${v.number}] ${v.text}`).join(' ')
  return `${label}: "${text}"`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VerseAnnotationModal({
  open,
  verses,
  chapterRef,
  existingAnnotation,
  isSaving,
  onClose,
  onSave,
  onAskAI,
}: VerseAnnotationModalProps) {
  const [highlight, setHighlight] = useState<HighlightColor>(null)
  const [note, setNote] = useState('')

  // Seed from existing annotation when modal opens
  useEffect(() => {
    if (open) {
      setHighlight(existingAnnotation?.highlight ?? null)
      setNote(existingAnnotation?.note ?? '')
    }
  }, [open, existingAnnotation])

  if (!open) return null

  const label = buildLabel(chapterRef, verses)
  const aiPrefill = buildAIPrefill(label, verses)

  return (
    // No backdrop — Bible content above stays fully tappable
    <div
      role="dialog"
      aria-label="Verse annotation"
      className="absolute bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl border-t bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header — shows live verse reference */}
      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 pb-2 space-y-3">
        {/* Highlight picker */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">
            Highlight
          </span>
          <div className="flex gap-2">
            {HIGHLIGHT_OPTIONS.map(opt => (
              <button
                key={String(opt.color)}
                onClick={() => setHighlight(opt.color)}
                aria-label={opt.label}
                className={cn(
                  'h-8 w-8 rounded-full ring-2 transition-all',
                  opt.bg,
                  highlight === opt.color ? `${opt.ring} ring-offset-2` : 'ring-transparent'
                )}
              />
            ))}
          </div>
        </div>

        {/* Note */}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note…"
          rows={2}
          className="w-full resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t px-4 py-3">
        <button
          onClick={() => onAskAI(aiPrefill)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask AI
        </button>
        <button
          onClick={() => onSave(highlight, note)}
          disabled={isSaving}
          className={cn(
            'flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            isSaving
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
