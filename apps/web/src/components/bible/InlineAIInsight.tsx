import { cn } from '@repo/ui/utils'

interface InlineAIInsightProps {
  text: string
  className?: string
}

export function InlineAIInsight({ text, className }: InlineAIInsightProps) {
  return (
    <div
      className={cn(
        'mx-4 my-2 rounded-r-md border-l-4 border-primary bg-primary/5 py-2 pl-3 pr-3',
        className
      )}
    >
      <p className="font-serif text-sm italic leading-relaxed text-foreground/80">{text}</p>
    </div>
  )
}
