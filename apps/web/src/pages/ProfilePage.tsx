import { useState, useEffect } from 'react'
import { BookOpen, Flame, PenLine } from 'lucide-react'
import { Moon, Shield, HelpCircle } from 'lucide-react'
import { UserHeader } from '../components/profile/UserHeader'
import { StatsGrid } from '../components/profile/StatsGrid'
import { SettingsGroup } from '../components/profile/SettingsGroup'
import { useStreak } from '../hooks/useStreak'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useDiaryEntries } from '../hooks/useDiary'

export function ProfilePage() {
  const { longest } = useStreak()
  const { chaptersReadCount } = useReadingProgress()
  const diaryQuery = useDiaryEntries()
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

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

  return (
    <main className="flex-1 overflow-y-auto scrollbar-none space-y-6 pb-6">
      <UserHeader name="Alex Johnson" tagline="Growing in faith, one day at a time" />
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
    </main>
  )
}
