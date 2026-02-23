import { cn } from '@repo/ui/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCell {
  value: string | number
  label: string
  icon: LucideIcon
}

interface StatsGridProps {
  stats: StatCell[]
  className?: string
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn('mx-4 grid grid-cols-3 gap-3', className)}>
      {stats.map(({ value, label, icon: Icon }, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1 rounded-xl border bg-card py-3 shadow-soft"
        >
          <Icon className="h-5 w-5 text-primary" />
          <span className="text-xl font-bold text-foreground">{value}</span>
          <span className="text-center text-[11px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}
