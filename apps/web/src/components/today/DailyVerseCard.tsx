import { ChevronRight } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface DailyVerseCardProps {
  reference: string
  text: string
  onReadChapter?: () => void
  className?: string
}

export function DailyVerseCard({ reference, text, onReadChapter, className }: DailyVerseCardProps) {
  return (
    <div
      className={cn(
        'mx-4 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-soft',
        className
      )}
    >
      {/* 2px gradient top border */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary via-primary/70 to-streak" />

      <div className="p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {reference}
        </p>
        <p className="font-serif text-lg leading-relaxed text-foreground">{text}</p>
        <button
          onClick={onReadChapter}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Read Chapter
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
