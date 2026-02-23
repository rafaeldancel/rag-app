import { Sparkles } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface MentorInsightCardProps {
  summary: string
  verseReference?: string
  verseText?: string
  className?: string
}

export function MentorInsightCard({
  summary,
  verseReference,
  verseText,
  className,
}: MentorInsightCardProps) {
  return (
    <div
      className={cn(
        'mx-4 overflow-hidden rounded-xl border shadow-soft',
        'bg-gradient-to-b from-primary/10 to-background dark:from-primary/20 dark:to-card',
        className
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Mentor Insight
          </p>
        </div>

        {/* Summary */}
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>

        {/* Related verse callout */}
        {verseReference && (
          <div className="mt-3 rounded-lg bg-primary/[0.08] px-3 py-2">
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              {verseReference}
            </p>
            {verseText && (
              <p className="font-serif text-xs italic text-foreground/75">{verseText}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
