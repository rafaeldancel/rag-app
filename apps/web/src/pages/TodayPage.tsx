import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, Sparkles, MessageCircle, Compass } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StreakHeader } from '../components/today/StreakHeader'
import { DailyVerseCard } from '../components/today/DailyVerseCard'
import { DailyPrayerCard } from '../components/today/DailyPrayerCard'
import { Skeleton } from '../components/atoms/Skeleton'
import { useVotd, useDailyPrayer } from '../hooks/useBible'
import { useStreak } from '../hooks/useStreak'
import { useAuth } from '../providers/AuthProvider'
import { useAIModal } from '../lib/AIModalContext'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const itemVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] } },
}

export function TodayPage() {
  const navigate = useNavigate()
  const votd = useVotd()
  const prayer = useDailyPrayer()
  const { current: streakCount } = useStreak()
  const { userProfile, user } = useAuth()
  const { openAI } = useAIModal()

  const displayName = userProfile?.displayName || user?.displayName || ''
  const discoveryTopics = userProfile?.discoveryTopics || []
  const faithBackground = userProfile?.faithBackground || 'Exploring'
  const worldview = userProfile?.worldviewAudit || { epistemology: 5, openness: 5, metaphysics: 5 }

  // Time-based greeting
  const hour = new Date().getHours()
  let timeStr = 'evening'
  if (hour < 12) timeStr = 'morning'
  else if (hour < 17) timeStr = 'afternoon'

  const greeting = displayName ? `Good ${timeStr}, ${displayName.split(' ')[0]}` : 'Welcome back'

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
    <motion.main
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-4"
    >
      <motion.div variants={itemVariants}>
        <StreakHeader date={today} streakCount={streakCount} />
      </motion.div>

      {/* Greeting */}
      <motion.div variants={itemVariants} className="px-4 pt-2">
        <h1 className="text-2xl font-serif text-foreground">{greeting}</h1>
      </motion.div>

      {/* User Journey Card */}
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="px-4"
      >
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Spiritual Profile</span>
            <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md">
              {faithBackground}
            </span>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>Evidence</span>
                <span>Intuition</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(worldview.epistemology / 10) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                  className="h-full bg-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>Skeptic</span>
                <span>Seeker</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(worldview.openness / 10) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  className="h-full bg-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>Materialist</span>
                <span>Supernaturalist</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(worldview.metaphysics / 10) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Discovery Topics (if any) */}
      {discoveryTopics.length > 0 && (
        <section className="space-y-3 pt-2">
          <motion.div variants={itemVariants} className="px-4">
            <h2 className="text-sm font-semibold text-muted-foreground capitalize tracking-wide flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" /> Start Exploring
            </h2>
          </motion.div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none px-4 pb-2 snap-x snap-mandatory hide-scroll">
            {discoveryTopics.map((topic, i) => (
              <motion.button
                key={i}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openAI(topic)}
                className="shrink-0 snap-start w-56 sm:w-64 bg-card border border-border rounded-xl p-4 text-left transition-all flex flex-col gap-3 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary relative z-10">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-foreground font-medium line-clamp-2 leading-snug relative z-10">
                  {topic}
                </h3>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <motion.div variants={itemVariants}>
        <AnimatePresence mode="wait">
          {votd.isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <VotdSkeleton />
            </motion.div>
          ) : votd.isError ? (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-4 text-sm text-muted-foreground"
            >
              Unable to load today's verse.
            </motion.p>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DailyVerseCard
                reference={votd.data?.reference ?? ''}
                text={votd.data?.text ?? ''}
                onReadChapter={handleReadChapter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Daily Insight Placeholder */}
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="px-4 text-left"
      >
        <button
          onClick={() => openAI('What is my daily insight for today?')}
          className="w-full bg-card hover:bg-card/80 border border-border rounded-xl p-4 text-left shadow-sm flex gap-4 items-center group"
        >
          <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-secondary border border-border">
            <img
              src="/images/peter-avatar.svg"
              alt="Peter"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Daily Insight <MessageCircle className="h-3.5 w-3.5 text-primary" />
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Ask Peter for a short insight based on your worldview profile.
            </p>
          </div>
        </button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <AnimatePresence mode="wait">
          {prayer.isLoading ? (
            <motion.div
              key="skeleton-prayer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-4 rounded-xl border bg-card p-4 shadow-soft"
            >
              <Skeleton className="mb-3 h-3 w-32" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-2 h-4 w-5/6" />
              <Skeleton className="mb-4 h-4 w-4/6" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </motion.div>
          ) : (
            <motion.div
              key="content-prayer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DailyPrayerCard
                text={prayer.data?.text}
                basedOn={prayer.data?.basedOn}
                isLoading={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={itemVariants} className="pb-8">
        <button
          onClick={handleContinueReading}
          className="mx-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-soft text-left group hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="font-medium text-sm text-foreground">Continue Reading</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {readingLabel}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </motion.main>
  )
}
