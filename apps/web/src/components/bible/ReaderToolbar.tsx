import { ChevronDown, Search, Settings } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface ReaderToolbarProps {
  translation: string
  chapterLabel: string
  onTranslationChange?: () => void
  onChapterChange?: () => void
  onSearch?: () => void
  onSettings?: () => void
  className?: string
}

export function ReaderToolbar({
  translation,
  chapterLabel,
  onTranslationChange,
  onChapterChange,
  onSearch,
  onSettings,
  className,
}: ReaderToolbarProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur-sm',
        className
      )}
    >
      {/* Translation selector */}
      <button
        onClick={onTranslationChange}
        className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
      >
        {translation}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* Chapter selector — centered, flex-1 */}
      <button
        onClick={onChapterChange}
        className="flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-accent"
      >
        {chapterLabel}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button onClick={onSearch} aria-label="Search" className="rounded-md p-1.5 hover:bg-accent">
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={onSettings}
          aria-label="Reader settings"
          className="rounded-md p-1.5 hover:bg-accent"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
