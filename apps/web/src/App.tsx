import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { BottomNav } from './components/layout/BottomNav'
import { AIModal } from './components/layout/AIModal'
import { AIModalContext } from './lib/AIModalContext'
import { TodayPage } from './pages/TodayPage'
import { BiblePage } from './pages/BiblePage'
import { DiaryPage } from './pages/DiaryPage'
import { ProfilePage } from './pages/ProfilePage'
import { SplashPage } from './pages/Splash'
import { AuthPage } from './pages/Auth'
import { OnboardingPage } from './pages/Onboarding'
import { LandingPage } from './pages/LandingPage'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import { ProtectedRoute, PublicRoute, OnboardingGuard } from './components/route-guards'
import './style.css'

/** Shows splash on first load only; subsequent visits check auth state. */
function SplashGate() {
  const { user, userProfile, loading } = useAuth()
  const played = sessionStorage.getItem('splashPlayed') === 'true'

  if (!played) {
    return <SplashPage />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-serif text-2xl">Logos</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/landing" replace />
  }
  if (userProfile?.onboardingComplete) {
    return <Navigate to="/today" replace />
  }
  return <Navigate to="/onboarding" replace />
}

function BibleRedirect() {
  try {
    const saved = localStorage.getItem('bible.lastPosition')
    if (saved) {
      const { book, chapter, version } = JSON.parse(saved)
      if (book && chapter) {
        const query = version && version !== 'NIV' ? `?v=${version}` : ''
        return <Navigate to={`/bible/${book}/${chapter}${query}`} replace />
      }
    }
  } catch {
    // corrupted storage — fall through to default
  }
  return <Navigate to="/bible/JHN/3" replace />
}

interface MainLayoutProps {
  aiOpen: boolean
  setAiOpen: (open: boolean) => void
  aiPrefill: string
  setAiPrefill: (prefill: string) => void
  openAI: (prefill?: string) => void
}

function MainLayout({ aiOpen, setAiOpen, aiPrefill, setAiPrefill, openAI }: MainLayoutProps) {
  const location = useLocation()

  // Hide BottomNav and AI Modal on auth/splash flows
  const hideNavPaths = ['/', '/splash', '/welcome', '/landing', '/auth', '/onboarding']
  const shouldHideNav = hideNavPaths.includes(location.pathname)

  return (
    <AppShell>
      <Routes>
        {/* Public / Auth Flow */}
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/welcome" element={<Navigate to="/landing" replace />} />
        <Route
          path="/landing"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <OnboardingGuard>
              <OnboardingPage />
            </OnboardingGuard>
          }
        />

        {/* Protected / Main App */}
        <Route path="/" element={<SplashGate />} />
        <Route
          path="/today"
          element={
            <ProtectedRoute>
              <TodayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bible/:book/:chapter"
          element={
            <ProtectedRoute>
              <BiblePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bible"
          element={
            <ProtectedRoute>
              <BibleRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diary"
          element={
            <ProtectedRoute>
              <DiaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>

      {!shouldHideNav && (
        <>
          <AIModal
            open={aiOpen}
            onClose={() => {
              setAiOpen(false)
              setAiPrefill('')
            }}
            initialInput={aiPrefill}
          />
          <BottomNav
            aiOpen={aiOpen}
            onAIPress={() => {
              if (aiOpen) {
                setAiOpen(false)
                setAiPrefill('')
              } else {
                openAI()
              }
            }}
          />
        </>
      )}
    </AppShell>
  )
}

export function App() {
  const [aiOpen, setAiOpen] = useState(() => sessionStorage.getItem('ai.open') === 'true')
  const [aiPrefill, setAiPrefill] = useState('')

  useEffect(() => {
    sessionStorage.setItem('ai.open', String(aiOpen))
  }, [aiOpen])

  function openAI(prefill = '') {
    setAiPrefill(prefill)
    setAiOpen(true)
  }

  return (
    <AuthProvider>
      <AIModalContext.Provider value={{ openAI }}>
        <BrowserRouter>
          <MainLayout
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
            aiPrefill={aiPrefill}
            setAiPrefill={setAiPrefill}
            openAI={openAI}
          />
        </BrowserRouter>
      </AIModalContext.Provider>
    </AuthProvider>
  )
}
