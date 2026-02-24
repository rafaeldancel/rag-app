import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@repo/ui/utils'

interface NoteInputModalProps {
  open: boolean
  label: string
  existingNote?: string | null
  isSaving: boolean
  onClose: () => void
  onSave: (note: string) => void
}

export function NoteInputModal({
  open,
  label,
  existingNote,
  isSaving,
  onClose,
  onSave,
}: NoteInputModalProps) {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) setNote(existingNote ?? '')
  }, [open, existingNote])

  if (!open) return null

  return (
    <>
      {/* Backdrop — covers the annotation modal below */}
      <div className="absolute inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Sheet */}
      <div
        role="dialog"
        aria-label="Add note"
        className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl border-t bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.15)]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 pt-1">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Textarea */}
        <div className="px-4 pb-3">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Write your note…"
            rows={4}
            autoFocus
            className="w-full resize-none rounded-xl border bg-muted/50 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t px-4 py-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-muted px-3 py-2.5 text-sm font-medium text-muted-foreground"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(note)}
            disabled={isSaving}
            className={cn(
              'flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isSaving
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground'
            )}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  )
}
