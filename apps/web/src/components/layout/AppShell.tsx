import { cn } from '@repo/ui/utils'
import { useLocation } from 'react-router-dom'

interface AppShellProps {
  children: React.ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  const location = useLocation()
  // These routes require full-page scrolling (no height clamp)
  const scrollableRoutes = ['/landing', '/splash', '/welcome', '/auth', '/onboarding']
  const isScrollable = scrollableRoutes.includes(location.pathname)

  return (
    <div className="flex min-h-screen justify-center bg-muted/30 dark:bg-background">
      <div
        className={cn(
          'relative flex w-full max-w-mobile flex-col bg-background shadow-soft',
          isScrollable ? 'min-h-screen overflow-y-auto' : 'h-screen overflow-hidden',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
