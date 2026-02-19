import { Droplets, Moon } from 'lucide-react'
import { StreakHeader } from '../components/today/StreakHeader'
import { DailyVerseCard } from '../components/today/DailyVerseCard'
import { LifestyleActionCard } from '../components/today/LifestyleActionCard'

export function TodayPage() {
  return (
    <main className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-4">
      <StreakHeader date="Wednesday, Feb 19" streakCount={14} />
      <DailyVerseCard
        reference="John 3:16"
        text="For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
      />
      <LifestyleActionCard
        icon={Droplets}
        title="Morning Prayer"
        subtitle="5 minutes of quiet time"
        completed={false}
      />
      <LifestyleActionCard
        icon={Moon}
        iconBg="bg-purple-100 dark:bg-purple-900/30"
        iconColor="text-purple-600 dark:text-purple-400"
        title="Evening Reflection"
        subtitle="Review today's reading"
        completed={true}
      />
    </main>
  )
}
