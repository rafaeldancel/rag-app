import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@repo/ui/utils'
import { Skeleton } from '../atoms/Skeleton'

interface DailyPrayerCardProps {
  text?: string
  basedOn?: string
  isLoading?: boolean
  className?: string
}

export function DailyPrayerCard({ text, basedOn, isLoading, className }: DailyPrayerCardProps) {
  const [amen, setAmen] = useState(false)

  if (isLoading) {
    return (
      <div className={cn('mx-4 rounded-xl border bg-card p-4 shadow-soft', className)}>
        <Skeleton className="mb-3 h-3 w-32" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-5/6" />
        <Skeleton className="mb-4 h-4 w-4/6" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
    )
  }

  if (!text) return null

  return (
    <div className={cn('mx-4 rounded-xl border bg-card p-4 shadow-soft', className)}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Daily Prayer · {basedOn}
      </p>
      <p className="font-serif text-base leading-relaxed text-foreground italic">{text}</p>
      <button
        onClick={() => setAmen(v => !v)}
        aria-pressed={amen}
        className={cn(
          'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors',
          amen
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Heart
          className={cn('h-3.5 w-3.5 transition-colors', amen && 'fill-primary text-primary')}
        />
        {amen ? 'Amen' : 'Say Amen'}
      </button>
    </div>
  )
}
