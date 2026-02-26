import { useState, useRef } from 'react'
import { cn } from '@repo/ui/utils'

interface TooltipProps {
  label: string
  children: React.ReactNode
  side?: 'top' | 'bottom'
}

export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      className={cn('flex')}
      onMouseEnter={() => setRect(ref.current?.getBoundingClientRect() ?? null)}
      onMouseLeave={() => setRect(null)}
    >
      {children}
      {rect && (
        <span
          style={{
            position: 'fixed',
            left: rect.left + rect.width / 2,
            top: side === 'top' ? rect.top : rect.bottom,
            transform:
              side === 'top'
                ? 'translateX(-50%) translateY(calc(-100% - 6px))'
                : 'translateX(-50%) translateY(6px)',
            zIndex: 9999,
          }}
          className="pointer-events-none whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-sm"
        >
          {label}
        </span>
      )}
    </div>
  )
}
