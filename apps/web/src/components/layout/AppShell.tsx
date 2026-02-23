import { cn } from '@repo/ui/utils'

interface AppShellProps {
  children: React.ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="flex min-h-screen justify-center bg-muted/30 dark:bg-background">
      <div
        className={cn(
          'relative flex h-screen w-full max-w-mobile flex-col overflow-hidden bg-background shadow-soft',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
