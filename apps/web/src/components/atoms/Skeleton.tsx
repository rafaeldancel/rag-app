import { cn } from '@repo/ui/utils'

interface SkeletonProps {
  className?: string
}

/** Animated shimmer placeholder for loading states. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden="true" />
}
