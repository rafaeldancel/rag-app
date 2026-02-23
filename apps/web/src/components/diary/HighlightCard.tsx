import { Trash2 } from 'lucide-react'
import { cn } from '@repo/ui/utils'
import type { HighlightColor } from '@repo/shared'

interface HighlightCardProps {
  usfm: string
  reference: string
  highlight: NonNullable<HighlightColor>
  createdAt: number
  onDelete: () => void
}

const SWATCH: Record<NonNullable<HighlightColor>, string> = {
  yellow: 'bg-yellow-400 dark:bg-yellow-500',
  blue: 'bg-blue-400 dark:bg-blue-500',
  green: 'bg-green-400 dark:bg-green-500',
}

const LABEL: Record<NonNullable<HighlightColor>, string> = {
  yellow: 'Yellow',
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

export function HighlightCard({ reference, highlight, createdAt, onDelete }: HighlightCardProps) {
  return (
    <div className="mx-4 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-soft">
      {/* Color swatch */}
      <span
        className={cn('h-4 w-4 shrink-0 rounded-full', SWATCH[highlight])}
        aria-label={LABEL[highlight]}
      />

      {/* Reference + date */}
      <div className="min-w-0 flex-1">
        <p className="font-serif text-sm font-semibold text-foreground">{reference}</p>
        <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        aria-label="Delete highlight"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  )
}
