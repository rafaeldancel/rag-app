import { Check, type LucideIcon } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface LifestyleActionCardProps {
  icon: LucideIcon
  iconBg?: string
  iconColor?: string
  title: string
  subtitle?: string
  completed?: boolean
  onToggle?: () => void
  className?: string
}

export function LifestyleActionCard({
  icon: Icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  title,
  subtitle,
  completed = false,
  onToggle,
  className,
}: LifestyleActionCardProps) {
  return (
    <div
      className={cn(
        'mx-4 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-soft',
        className
      )}
    >
      {/* Icon circle */}
      <div
        className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconBg)}
      >
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Circular check button */}
      <button
        onClick={onToggle}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          completed
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-transparent hover:border-primary'
        )}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  )
}
