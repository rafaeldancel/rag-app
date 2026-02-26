import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface NoteCardProps {
  usfm: string
  reference: string
  note: string
  verseText?: string | null
  createdAt: number
  isSaving?: boolean
  onSave: (note: string) => void
  onDelete: () => void
}

function formatDate(ms: number) {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function NoteCard({
  reference,
  note,
  verseText,
  createdAt,
  isSaving,
  onSave,
  onDelete,
}: NoteCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note)

  function handleEdit() {
    setDraft(note)
    setEditing(true)
  }

  function handleCancel() {
    setDraft(note)
    setEditing(false)
  }

  function handleSave() {
    onSave(draft)
    setEditing(false)
  }

  return (
    <div className="mx-4 overflow-hidden rounded-xl border bg-card shadow-soft">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
        <div className="min-w-0">
          <p className="font-serif text-sm font-semibold text-foreground">{reference}</p>
          <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 gap-1">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                aria-label="Save note"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-primary/10"
              >
                <Check className="h-4 w-4 text-primary" />
              </button>
              <button
                onClick={handleCancel}
                aria-label="Cancel edit"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                aria-label="Edit note"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={onDelete}
                aria-label="Delete note"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Verse text quote */}
      {verseText && (
        <p className="px-4 pb-2 font-serif text-xs italic leading-relaxed text-foreground/60">
          "{verseText}"
        </p>
      )}

      {/* Divider before note */}
      <div className="mx-4 border-t" />

      {/* Note body */}
      <div className="px-4 py-3">
        {editing ? (
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            autoFocus
            className={cn(
              'w-full resize-none rounded-lg border bg-muted/50 px-3 py-2 text-sm leading-relaxed',
              'outline-none placeholder:text-muted-foreground focus:border-primary'
            )}
          />
        ) : (
          <p className="text-sm leading-relaxed text-foreground/80">{note}</p>
        )}
      </div>
    </div>
  )
}
