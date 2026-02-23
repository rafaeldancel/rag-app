import { useState, useEffect } from 'react'
import { BookOpen, Flame, PenLine } from 'lucide-react'
import { Moon, Shield, HelpCircle } from 'lucide-react'
import { UserHeader } from '../components/profile/UserHeader'
import { StatsGrid } from '../components/profile/StatsGrid'
import { SettingsGroup } from '../components/profile/SettingsGroup'

const STATS = [
  { value: 21, label: 'Longest Streak', icon: Flame },
  { value: 87, label: 'Chapters', icon: BookOpen },
  { value: 5, label: 'Diary Entries', icon: PenLine },
]

export function ProfilePage() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  // Keep the document class in sync with state (also applies on mount)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleDarkMode = (val: boolean) => {
    setDarkMode(val)
    localStorage.setItem('darkMode', String(val))
  }

  return (
    <main className="flex-1 overflow-y-auto scrollbar-none space-y-6 pb-6">
      <UserHeader name="Alex Johnson" tagline="Growing in faith, one day at a time" />
      <StatsGrid stats={STATS} />
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
    </main>
  )
}
