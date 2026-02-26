import { Flame } from 'lucide-react'
import { Pill } from '../atoms/Pill'

interface StreakHeaderProps {
  date: string
  streakCount: number
}

export function StreakHeader({ date, streakCount }: StreakHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <p className="text-sm font-medium text-muted-foreground">{date}</p>
      <Pill variant="orange">
        <Flame className="h-3.5 w-3.5" />
        {streakCount} day streak
      </Pill>
    </div>
  )
}
