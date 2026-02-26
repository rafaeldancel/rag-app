import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@repo/ui/utils'

type SettingsRowType = 'navigate' | 'toggle'

interface SettingsRow {
  icon: LucideIcon
  label: string
  type: SettingsRowType
  value?: boolean
  onPress?: () => void
  onToggle?: (val: boolean) => void
}

interface SettingsGroupProps {
  title?: string
  rows: SettingsRow[]
  className?: string
}

export function SettingsGroup({ title, rows, className }: SettingsGroupProps) {
  return (
    <div className={cn('mx-4', className)}>
      {title && (
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        {rows.map(({ icon: Icon, label, type, value, onPress, onToggle }, i) => (
          <div key={i}>
            {i > 0 && <div className="mx-4 h-px bg-border" />}
            <div
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                type === 'navigate' && 'cursor-pointer hover:bg-accent'
              )}
              onClick={type === 'navigate' ? onPress : undefined}
              role={type === 'navigate' ? 'button' : undefined}
              tabIndex={type === 'navigate' ? 0 : undefined}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>

              {type === 'navigate' && <ChevronRight className="h-4 w-4 text-muted-foreground" />}

              {type === 'toggle' && (
                <button
                  role="switch"
                  aria-checked={value}
                  onClick={() => onToggle?.(!value)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    value ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                      value ? 'left-[22px]' : 'left-0.5'
                    )}
                  />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
