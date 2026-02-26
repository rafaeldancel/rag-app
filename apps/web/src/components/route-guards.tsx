import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

// For routes that require the user to NOT be logged in (welcome, auth pages)
export function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-serif text-2xl">Logos</div>
      </div>
    )
  }

  // No user → show the public page (auth/welcome)
  if (!user) {
    return children
  }

  // User exists and completed onboarding → go to main app
  if (userProfile?.onboardingComplete) {
    return <Navigate to="/today" state={{ from: location }} replace />
  }

  // User exists but hasn't onboarded → go to onboarding
  return <Navigate to="/onboarding" state={{ from: location }} replace />
}

// For routes that require the user to be logged in and fully onboarded
export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-serif text-2xl">Logos</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/welcome" state={{ from: location }} replace />
  }

  if (!userProfile?.onboardingComplete) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  return children
}

// Specifically for the onboarding route
export function OnboardingGuard({ children }: { children: JSX.Element }) {
  const { user, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-serif text-2xl">Logos</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/welcome" state={{ from: location }} replace />
  }

  if (userProfile?.onboardingComplete) {
    return <Navigate to="/today" state={{ from: location }} replace />
  }

  return children
}
