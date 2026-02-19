import { cn } from '@repo/ui/utils'

interface VerseProps {
  number: number
  text: string
  selected?: boolean
  onPress?: () => void
  className?: string
}

export function Verse({ number, text, selected = false, onPress, className }: VerseProps) {
  return (
    <p
      onClick={onPress}
      className={cn(
        'px-4 py-2 font-serif text-[17px] leading-[1.8] text-foreground',
        'cursor-pointer rounded-md transition-colors',
        selected ? 'bg-primary/10' : 'hover:bg-muted/60',
        className
      )}
    >
      <sup className="mr-1 text-[11px] font-bold text-muted-foreground">{number}</sup>
      {text}
    </p>
  )
}
