import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@repo/ui/utils'

const pillVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        orange: 'bg-streak/15 text-streak dark:bg-streak/20',
        blue: 'bg-primary/10 text-primary',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {
  children: React.ReactNode
}

export function Pill({ variant, className, children, ...props }: PillProps) {
  return (
    <span className={cn(pillVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}
