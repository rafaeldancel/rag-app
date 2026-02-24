import { Sparkles, X } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface AITriggerButtonProps {
  onClick?: () => void
  isOpen?: boolean
  className?: string
}

export function AITriggerButton({ onClick, isOpen = false, className }: AITriggerButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      className={cn(
        'flex h-16 w-16 items-center justify-center rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'transition-all duration-200 active:scale-95',
        isOpen && 'ring-4 ring-primary/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {isOpen ? <X className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
    </button>
  )
}
