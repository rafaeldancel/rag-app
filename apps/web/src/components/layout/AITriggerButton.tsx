import { Sparkles } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface AITriggerButtonProps {
  onClick?: () => void
  className?: string
}

export function AITriggerButton({ onClick, className }: AITriggerButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open AI assistant"
      className={cn(
        'flex h-16 w-16 items-center justify-center rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'transition-transform duration-150 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      <Sparkles className="h-7 w-7" />
    </button>
  )
}
