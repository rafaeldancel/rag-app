import { Trash2 } from 'lucide-react'
import { cn } from '@repo/ui/utils'
import type { HighlightColor } from '@repo/shared'

interface HighlightCardProps {
  usfm: string
  reference: string
  highlight: NonNullable<HighlightColor>
  verseText?: string | null
  createdAt: number
  onDelete: () => void
}

const SWATCH: Record<NonNullable<HighlightColor>, string> = {
  yellow: 'bg-yellow-400 dark:bg-yellow-500',
  red: 'bg-red-400 dark:bg-red-500',
  blue: 'bg-blue-400 dark:bg-blue-500',
  green: 'bg-green-400 dark:bg-green-500',
}

const LABEL: Record<NonNullable<HighlightColor>, string> = {
  yellow: 'Yellow',
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
}

function formatDate(ms: number) {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function HighlightCard({
  reference,
  highlight,
  verseText,
  createdAt,
  onDelete,
}: HighlightCardProps) {
  return (
    <div className="mx-4 rounded-xl border bg-card shadow-soft overflow-hidden">
      {/* Main row: swatch + reference/verse + delete */}
      <div className="flex items-start gap-3 px-4 py-3">
        <span
          className={cn('mt-1 h-3.5 w-3.5 shrink-0 rounded-full', SWATCH[highlight])}
          aria-label={LABEL[highlight]}
        />

        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-serif text-sm font-semibold text-foreground">{reference}</p>
          {verseText && (
            <p className="font-serif text-xs italic leading-relaxed text-foreground/60 line-clamp-2">
              "{verseText}"
            </p>
          )}
          <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
        </div>

        <button
          onClick={onDelete}
          aria-label="Delete highlight"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </div>
  )
}
