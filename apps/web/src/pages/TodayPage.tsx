import { useNavigate } from 'react-router-dom'
import { Droplets, Moon } from 'lucide-react'
import { StreakHeader } from '../components/today/StreakHeader'
import { DailyVerseCard } from '../components/today/DailyVerseCard'
import { DailyPrayerCard } from '../components/today/DailyPrayerCard'
import { LifestyleActionCard } from '../components/today/LifestyleActionCard'
import { Skeleton } from '../components/atoms/Skeleton'
import { useVotd, useDailyPrayer } from '../hooks/useBible'

function VotdSkeleton() {
  return (
    <div className="mx-4 overflow-hidden rounded-xl border bg-card shadow-soft">
      <div className="h-0.5 w-full bg-gradient-to-r from-primary via-primary/70 to-streak" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="mt-1 h-4 w-28" />
      </div>
    </div>
  )
}

export function TodayPage() {
  const navigate = useNavigate()
  const votd = useVotd()
  const prayer = useDailyPrayer()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  function handleReadChapter() {
    if (!votd.data) return
    navigate(`/bible/${votd.data.book}/${votd.data.chapter}`)
  }

  return (
    <main className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-4">
      <StreakHeader date={today} streakCount={14} />

      {votd.isLoading && <VotdSkeleton />}
      {votd.isError && (
        <p className="mx-4 text-sm text-muted-foreground">Unable to load today's verse.</p>
      )}
      {votd.data && (
        <DailyVerseCard
          reference={votd.data.reference}
          text={votd.data.text}
          onReadChapter={handleReadChapter}
        />
      )}

      <DailyPrayerCard
        text={prayer.data?.text}
        basedOn={prayer.data?.basedOn}
        isLoading={prayer.isLoading}
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
