import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight } from 'lucide-react'
import { StreakHeader } from '../components/today/StreakHeader'
import { DailyVerseCard } from '../components/today/DailyVerseCard'
import { DailyPrayerCard } from '../components/today/DailyPrayerCard'
import { Skeleton } from '../components/atoms/Skeleton'
import { useVotd, useDailyPrayer } from '../hooks/useBible'
import { useStreak } from '../hooks/useStreak'

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
  const { current: streakCount } = useStreak()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const lastPosition = (() => {
    try {
      const saved = localStorage.getItem('bible.lastPosition')
      if (saved)
        return JSON.parse(saved) as {
          book: string
          chapter: number
          version?: string
          reference?: string
        }
    } catch {
      // ignore malformed storage
    }
    return null
  })()

  function handleReadChapter() {
    if (!votd.data) return
    navigate(`/bible/${votd.data.book}/${votd.data.chapter}`)
  }

  function handleContinueReading() {
    if (!lastPosition) {
      navigate('/bible/JHN/3')
      return
    }
    const query =
      lastPosition.version && lastPosition.version !== 'NIV' ? `?v=${lastPosition.version}` : ''
    navigate(`/bible/${lastPosition.book}/${lastPosition.chapter}${query}`)
  }

  const readingLabel =
    lastPosition?.reference ??
    (lastPosition ? `${lastPosition.book} ${lastPosition.chapter}` : 'John 3')

  return (
    <main className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-4">
      <StreakHeader date={today} streakCount={streakCount} />

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

      <button
        onClick={handleContinueReading}
        className="mx-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-soft text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">Continue Reading</p>
          <p className="truncate text-xs text-muted-foreground">{readingLabel}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </main>
  )
}
