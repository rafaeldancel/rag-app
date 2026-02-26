import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, BookMarked, PenLine, User } from 'lucide-react'
import { AITriggerButton } from './AITriggerButton'
import { cn } from '@repo/ui/utils'

const NAV_ITEMS = [
  { to: '/today', icon: BookOpen, label: 'Today' },
  { to: '/bible', icon: BookMarked, label: 'Bible' },
  { to: '/diary', icon: PenLine, label: 'Diary' },
  { to: '/profile', icon: User, label: 'Profile' },
] as const

interface BottomNavProps {
  onAIPress?: () => void
  aiOpen?: boolean
}

export function BottomNav({ onAIPress, aiOpen = false }: BottomNavProps) {
  return (
    <nav className="relative mt-auto h-[72px] w-full shrink-0" aria-label="Bottom navigation">
      {/* SVG cutout background — fill-background handles dark mode automatically */}
      <svg
        viewBox="0 0 390 72"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M0,0 L155,0 C165,0 170,8 175,18 C180,28 185,36 195,36 C205,36 210,28 215,18 C220,8 225,0 235,0 L390,0 L390,72 L0,72 Z"
          className="fill-background stroke-border"
          strokeWidth="1"
        />
      </svg>

      {/* AI button floats in the well — centered, 32px above nav top */}
      <div className="absolute left-1/2 z-10 -translate-x-1/2 -top-8">
        <AITriggerButton onClick={onAIPress} isOpen={aiOpen} />
      </div>

      {/* Nav items: left 2 | spacer | right 2 */}
      <div className="relative z-10 flex h-full items-end px-4 pb-3">
        {/* Left: Today + Bible */}
        <div className="flex flex-1 justify-around">
          {NAV_ITEMS.slice(0, 2).map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon
                    className={cn('h-5 w-5', isActive && 'animate-in zoom-in-75 duration-300')}
                  />
                  <span className="text-[10px] font-medium">{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Center spacer for the SVG well */}
        <div className="w-20 shrink-0" aria-hidden="true" />

        {/* Right: Diary + Profile */}
        <div className="flex flex-1 justify-around">
          {NAV_ITEMS.slice(2, 4).map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon
                    className={cn('h-5 w-5', isActive && 'animate-in zoom-in-75 duration-300')}
                  />
                  <span className="text-[10px] font-medium">{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
