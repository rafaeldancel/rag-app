import { X, Sparkles, NotebookPen } from 'lucide-react'
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
  onClose: () => void
  onHighlight: (color: HighlightColor) => void
  onNote: () => void
  onAskAI: (prefill: string) => void
}

// ─── Highlight colours ────────────────────────────────────────────────────────

type HighlightOption = { color: HighlightColor; label: string; bg: string; ring: string }

const HIGHLIGHT_OPTIONS: HighlightOption[] = [
  { color: 'blue', label: 'Blue', bg: 'bg-blue-300 dark:bg-blue-600', ring: 'ring-blue-400' },
  { color: 'red', label: 'Red', bg: 'bg-red-300 dark:bg-red-600', ring: 'ring-red-400' },
  { color: 'green', label: 'Green', bg: 'bg-green-300 dark:bg-green-600', ring: 'ring-green-400' },
  {
    color: 'yellow',
    label: 'Yellow',
    bg: 'bg-yellow-300 dark:bg-yellow-600',
    ring: 'ring-yellow-400',
  },
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
  onClose,
  onHighlight,
  onNote,
  onAskAI,
}: VerseAnnotationModalProps) {
  if (!open) return null

  const label = buildLabel(chapterRef, verses)
  const aiPrefill = buildAIPrefill(label, verses)
  const activeHighlight = existingAnnotation?.highlight ?? null
  const hasNote = !!existingAnnotation?.note?.trim()

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

      {/* Highlight picker — tap a color to instantly save & close */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16 shrink-0">
          Highlight
        </span>
        <div className="flex gap-2">
          {HIGHLIGHT_OPTIONS.map(opt => (
            <button
              key={String(opt.color)}
              onClick={() => onHighlight(opt.color)}
              aria-label={opt.label}
              className={cn(
                'h-8 w-8 rounded-full ring-2 transition-all',
                opt.bg,
                activeHighlight === opt.color ? `${opt.ring} ring-offset-2` : 'ring-transparent'
              )}
            />
          ))}
        </div>
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
          onClick={onNote}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            hasNote
              ? 'bg-primary/15 text-primary'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <NotebookPen className="h-3.5 w-3.5" />
          {hasNote ? 'Edit Note' : 'Note'}
        </button>
      </div>
    </div>
  )
}
