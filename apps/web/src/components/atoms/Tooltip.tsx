import { cn } from '@repo/ui/utils'

interface TooltipProps {
  label: string
  children: React.ReactNode
  side?: 'top' | 'bottom'
}

export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  return (
    <div className="group/tip relative flex">
      {children}
      <span
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap',
          'rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-sm',
          'opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        )}
      >
        {label}
      </span>
    </div>
  )
}
