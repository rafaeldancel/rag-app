import { cn } from '@repo/ui/utils'
import type { HighlightColor } from '@repo/shared'

interface VerseProps {
  number: number
  text: string
  selected?: boolean
  highlightColor?: HighlightColor
  onPress?: () => void
  className?: string
}

const HIGHLIGHT_BG: Record<NonNullable<HighlightColor>, string> = {
  yellow: 'bg-yellow-200/70 dark:bg-yellow-800/30',
  blue: 'bg-blue-200/70 dark:bg-blue-800/30',
  green: 'bg-green-200/70 dark:bg-green-800/30',
}

export function Verse({
  number,
  text,
  selected = false,
  highlightColor,
  onPress,
  className,
}: VerseProps) {
  const highlightClass = highlightColor ? HIGHLIGHT_BG[highlightColor] : ''

  return (
    <p
      onClick={onPress}
      className={cn(
        'px-4 py-2 font-serif text-[17px] leading-[1.8] text-foreground',
        'cursor-pointer rounded-md transition-colors',
        selected ? 'bg-primary/15' : highlightClass || 'hover:bg-muted/60',
        className
      )}
    >
      <sup className="mr-1 text-[11px] font-bold text-muted-foreground">{number}</sup>
      {text}
    </p>
  )
}
