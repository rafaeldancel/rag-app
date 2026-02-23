import { Pencil } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface UserHeaderProps {
  avatarUrl?: string
  name: string
  tagline?: string
  onEditAvatar?: () => void
  className?: string
}

export function UserHeader({ avatarUrl, name, tagline, onEditAvatar, className }: UserHeaderProps) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-6', className)}>
      {/* Avatar with edit badge */}
      <div className="relative mb-4">
        <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary/30 bg-muted">
          {avatarUrl ? (
            <img src={avatarUrl} alt={`${name}'s avatar`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <button
          onClick={onEditAvatar}
          aria-label="Edit avatar"
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      <h1 className="text-2xl font-bold text-foreground">{name}</h1>
      {tagline && <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>}
    </div>
  )
}
