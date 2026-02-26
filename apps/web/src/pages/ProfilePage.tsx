import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Flame, PenLine, LogOut } from 'lucide-react'
import { Moon, Shield, HelpCircle } from 'lucide-react'
import { UserHeader } from '../components/profile/UserHeader'
import { StatsGrid } from '../components/profile/StatsGrid'
import { SettingsGroup } from '../components/profile/SettingsGroup'
import { useStreak } from '../hooks/useStreak'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useDiaryEntries } from '../hooks/useDiary'
import { useAuth } from '../providers/AuthProvider'

export function ProfilePage() {
  const { longest } = useStreak()
  const { chaptersReadCount } = useReadingProgress()
  const diaryQuery = useDiaryEntries()
  const { user, userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const displayName = userProfile?.displayName || user?.displayName || 'User'
  const faithTag = userProfile?.faithBackground || 'Growing in faith, one day at a time'

  const stats = [
    { value: longest, label: 'Longest Streak', icon: Flame },
    { value: chaptersReadCount, label: 'Chapters Read', icon: BookOpen },
    { value: diaryQuery.data?.length ?? 0, label: 'Diary Entries', icon: PenLine },
  ]

  // Keep the document class in sync with state (also applies on mount)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleDarkMode = (val: boolean) => {
    setDarkMode(val)
    localStorage.setItem('darkMode', String(val))
  }

  const handleLogout = async () => {
    sessionStorage.removeItem('splashPlayed')
    await signOut()
    navigate('/landing', { replace: true })
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto scrollbar-none space-y-6 pb-6">
        <UserHeader name={displayName} tagline={faithTag} />
        <StatsGrid stats={stats} />
        <SettingsGroup
          title="Preferences"
          rows={[
            {
              icon: Moon,
              label: 'Dark Mode',
              type: 'toggle',
              value: darkMode,
              onToggle: handleDarkMode,
            },
            {
              icon: Shield,
              label: 'Privacy',
              type: 'navigate',
            },
            {
              icon: HelpCircle,
              label: 'Help & Support',
              type: 'navigate',
            },
          ]}
        />

        {/* Logout button */}
        <div className="px-4 pt-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </main>

      {/* Logout confirmation dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 mx-6 max-w-sm w-full shadow-2xl border border-border space-y-4">
            <h3 className="text-lg font-serif text-foreground">Log out?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to log out? You'll need to sign in again to access your data.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-500 font-medium hover:bg-red-500/30 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
