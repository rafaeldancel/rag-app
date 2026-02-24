import { Pencil, Trash2, Sparkles } from 'lucide-react'
import { Pill } from '../atoms/Pill'
import { cn } from '@repo/ui/utils'

type PillVariant = 'default' | 'green' | 'orange' | 'blue'

interface AIInsight {
  text: string
  verseRef?: string
  verseText?: string
}

interface DiaryEntryCardProps {
  title: string
  body: string
  mood?: string
  moodVariant?: PillVariant
  dateTime: string
  aiInsight?: AIInsight | null
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function DiaryEntryCard({
  title,
  body,
  mood,
  moodVariant = 'green',
  dateTime,
  aiInsight,
  onEdit,
  onDelete,
  className,
}: DiaryEntryCardProps) {
  return (
    <div
      className={cn('group mx-4 overflow-hidden rounded-xl border bg-card shadow-soft', className)}
    >
      {/* ── Entry section ── */}
      <div className="p-4">
        {/* Top row: title + action icons */}
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 text-base font-bold leading-snug text-foreground">{title}</p>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={onEdit}
              aria-label="Edit entry"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete entry"
              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Mood + date row */}
        <div className="mt-1.5 flex items-center gap-2">
          {mood && <Pill variant={moodVariant}>{mood}</Pill>}
          <span className="text-xs text-muted-foreground">{dateTime}</span>
        </div>

        {/* Clamped body preview */}
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/75">{body}</p>
      </div>

      {/* ── Mentor Insight section ── */}
      {aiInsight && (
        <div className="border-t bg-gradient-to-b from-primary/[0.07] to-primary/[0.03] px-4 py-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Mentor Insight
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">{aiInsight.text}</p>
          {aiInsight.verseRef && (
            <div className="mt-2 rounded-lg bg-primary/[0.08] px-3 py-2">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                {aiInsight.verseRef}
              </p>
              {aiInsight.verseText && (
                <p className="font-serif text-xs italic text-foreground/75">
                  {aiInsight.verseText}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
