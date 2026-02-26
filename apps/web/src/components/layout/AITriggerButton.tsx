import { X } from 'lucide-react'
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
        'shadow-lg transition-all duration-200',
        'hover:scale-110 hover:shadow-[0_0_20px_rgba(200,160,60,0.3)]',
        'active:scale-95',
        isOpen
          ? 'bg-primary text-primary-foreground ring-4 ring-primary/30'
          : 'p-0 overflow-hidden',
        'focus-visible:outline-none',
        className
      )}
    >
      {isOpen ? (
        <X className="h-7 w-7" />
      ) : (
        <img
          src="/images/peter-avatar.svg"
          alt="Ask Peter"
          className="h-full w-full rounded-full object-cover"
        />
      )}
    </button>
  )
}
