import { useState, useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@repo/ui/utils'
import type { DiaryEntry } from '@repo/shared'

interface DiaryComposerProps {
  open: boolean
  editing?: DiaryEntry | null
  isSaving: boolean
  onClose: () => void
  onSave: (title: string, text: string) => void
}

export function DiaryComposer({ open, editing, isSaving, onClose, onSave }: DiaryComposerProps) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Seed fields when editing an existing entry
  useEffect(() => {
    if (open) {
      setTitle(editing?.title ?? '')
      setText(editing?.text ?? '')
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open, editing])

  function handleSave() {
    if (!title.trim() || !text.trim() || isSaving) return
    onSave(title.trim(), text.trim())
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-20 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-label="Write diary entry"
        className="absolute bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl bg-background"
        style={{ maxHeight: '90%' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <span className="text-sm font-semibold text-foreground">
            {editing ? 'Edit Entry' : 'New Entry'}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2 space-y-3">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give it a title…"
            className="w-full rounded-xl border bg-muted/50 px-3 py-2.5 text-sm font-semibold outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What's on your heart today?"
            rows={8}
            className="w-full resize-none rounded-xl border bg-muted/50 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          {isSaving && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving and generating your insight…
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t px-4 py-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !text.trim() || isSaving}
            className={cn(
              'flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
              title.trim() && text.trim() && !isSaving
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isSaving ? 'Saving…' : editing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </>
  )
}
