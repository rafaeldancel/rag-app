import { useState } from 'react'
import { BookOpen, Flame, Clock, Star, Users, Award } from 'lucide-react'
import { Bell, Moon, Shield, HelpCircle } from 'lucide-react'
import { UserHeader } from '../components/profile/UserHeader'
import { StatsGrid } from '../components/profile/StatsGrid'
import { SettingsGroup } from '../components/profile/SettingsGroup'

const STATS = [
  { value: 14, label: 'Day Streak', icon: Flame },
  { value: 87, label: 'Chapters', icon: BookOpen },
  { value: '2h', label: 'This Week', icon: Clock },
  { value: 12, label: 'Favorites', icon: Star },
  { value: 3, label: 'Mentors', icon: Users },
  { value: 'Gold', label: 'Badge', icon: Award },
]

export function ProfilePage() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const handleDarkMode = (val: boolean) => {
    setDarkMode(val)
    document.documentElement.classList.toggle('dark', val)
  }

  return (
    <main className="flex-1 overflow-y-auto scrollbar-none space-y-6 pb-6">
      <UserHeader name="Alex Johnson" tagline="Growing in faith, one day at a time" />
      <StatsGrid stats={STATS} />
      <SettingsGroup
        title="Preferences"
        rows={[
          {
            icon: Bell,
            label: 'Notifications',
            type: 'toggle',
            value: notifications,
            onToggle: setNotifications,
          },
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
