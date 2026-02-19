import { cn } from '@repo/ui/utils'

interface Segment {
  value: string
  label: string
}

interface SegmentedControlProps {
  segments: Segment[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedControl({ segments, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn('mx-4 flex rounded-full bg-muted p-1', className)} role="tablist">
      {segments.map(seg => (
        <button
          key={seg.value}
          role="tab"
          aria-selected={value === seg.value}
          onClick={() => onChange(seg.value)}
          className={cn(
            'flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
            value === seg.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {seg.label}
        </button>
      ))}
    </div>
  )
}
