import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { Plus } from 'lucide-react'
import { SegmentedControl } from '../components/diary/SegmentedControl'
import { DiaryEntryCard } from '../components/diary/DiaryEntryCard'
import { DiaryComposer } from '../components/diary/DiaryComposer'
import { HighlightCard } from '../components/diary/HighlightCard'
import { NoteCard } from '../components/diary/NoteCard'
import { Skeleton } from '../components/atoms/Skeleton'
import {
  useDiaryEntries,
  useCreateDiaryEntry,
  useUpdateDiaryEntry,
  useDeleteDiaryEntry,
} from '../hooks/useDiary'
import {
  useAllAnnotations,
  useUpsertAnnotation,
  useDeleteAnnotation,
} from '../hooks/useAnnotations'
import type { DiaryEntry } from '@repo/shared'

const SEGMENTS = [
  { value: 'diary', label: 'Diary' },
  { value: 'notes', label: 'Notes' },
  { value: 'highlights', label: 'Highlights' },
]

function EntrySkeleton() {
  return (
    <div className="mx-4 rounded-xl border bg-card p-4 shadow-soft space-y-2">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

function AnnotationSkeleton() {
  return (
    <div className="mx-4 rounded-xl border bg-card p-4 shadow-soft space-y-2">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export function DiaryPage() {
  const { user } = useAuth()
  const userId = user?.uid ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'diary'
  function setTab(value: string) {
    setSearchParams({ tab: value }, { replace: true })
  }
  const [composerOpen, setComposerOpen] = useState(false)
  const [editing, setEditing] = useState<DiaryEntry | null>(null)

  const entriesQuery = useDiaryEntries()
  const createMutation = useCreateDiaryEntry()
  const updateMutation = useUpdateDiaryEntry()
  const deleteMutation = useDeleteDiaryEntry()

  const annotationsQuery = useAllAnnotations()
  const upsertAnnotation = useUpsertAnnotation()
  const deleteAnnotation = useDeleteAnnotation()

  const isSaving = createMutation.isPending || updateMutation.isPending

  function openComposer(entry?: DiaryEntry) {
    setEditing(entry ?? null)
    setComposerOpen(true)
  }

  function handleClose() {
    setComposerOpen(false)
    setEditing(null)
  }

  async function handleSave(title: string, text: string) {
    if (editing) {
      await updateMutation.mutateAsync({ userId, id: editing.id, title, text })
    } else {
      await createMutation.mutateAsync({ userId, title, text })
    }
    handleClose()
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync({ userId, id })
  }

  function formatDate(ms: number) {
    return new Date(ms).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const highlights = (annotationsQuery.data ?? []).filter(a => a.highlight !== null)
  const notes = (annotationsQuery.data ?? []).filter(a => a.note && a.note.trim().length > 0)

  return (
    <>
      <main className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-20 pt-4">
        <SegmentedControl segments={SEGMENTS} value={tab} onChange={setTab} />

        {/* ── Diary tab ── */}
        {tab === 'diary' && (
          <>
            {entriesQuery.isLoading && (
              <>
                <EntrySkeleton />
                <EntrySkeleton />
              </>
            )}

            {entriesQuery.isError && (
              <p className="mx-4 text-sm text-muted-foreground">Unable to load entries.</p>
            )}

            {entriesQuery.data?.length === 0 && (
              <div className="mx-4 flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm font-semibold text-foreground">No entries yet</p>
                <p className="text-xs text-muted-foreground">
                  Tap + to write your first journal entry.
                </p>
              </div>
            )}

            {entriesQuery.data?.map(entry => (
              <DiaryEntryCard
                key={entry.id}
                title={entry.title}
                body={entry.text}
                dateTime={formatDate(entry.createdAt)}
                aiInsight={entry.aiInsight}
                onEdit={() => openComposer(entry)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </>
        )}

        {/* ── Notes tab ── */}
        {tab === 'notes' && (
          <>
            {annotationsQuery.isLoading && (
              <>
                <AnnotationSkeleton />
                <AnnotationSkeleton />
              </>
            )}

            {annotationsQuery.isError && (
              <p className="mx-4 text-sm text-muted-foreground">Unable to load notes.</p>
            )}

            {!annotationsQuery.isLoading && notes.length === 0 && (
              <div className="mx-4 flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm font-semibold text-foreground">No notes yet</p>
                <p className="text-xs text-muted-foreground">
                  Tap a Bible verse and add a note to see it here.
                </p>
              </div>
            )}

            {notes.map(a => (
              <NoteCard
                key={a.usfm}
                usfm={a.usfm}
                reference={a.reference ?? a.usfm}
                note={a.note!}
                verseText={a.verseText}
                createdAt={a.createdAt}
                isSaving={upsertAnnotation.isPending}
                onSave={newNote =>
                  upsertAnnotation.mutateAsync({
                    userId,
                    usfm: a.usfm,
                    note: newNote,
                  })
                }
                onDelete={() =>
                  deleteAnnotation.mutateAsync({ userId, usfm: a.usfm, field: 'note' })
                }
              />
            ))}
          </>
        )}

        {/* ── Highlights tab ── */}
        {tab === 'highlights' && (
          <>
            {annotationsQuery.isLoading && (
              <>
                <AnnotationSkeleton />
                <AnnotationSkeleton />
              </>
            )}

            {annotationsQuery.isError && (
              <p className="mx-4 text-sm text-muted-foreground">Unable to load highlights.</p>
            )}

            {!annotationsQuery.isLoading && highlights.length === 0 && (
              <div className="mx-4 flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm font-semibold text-foreground">No highlights yet</p>
                <p className="text-xs text-muted-foreground">
                  Tap a Bible verse and choose a highlight color to see it here.
                </p>
              </div>
            )}

            {highlights.map(a => (
              <HighlightCard
                key={a.usfm}
                usfm={a.usfm}
                reference={a.reference ?? a.usfm}
                highlight={a.highlight!}
                verseText={a.verseText}
                createdAt={a.createdAt}
                onDelete={() =>
                  deleteAnnotation.mutateAsync({ userId, usfm: a.usfm, field: 'highlight' })
                }
              />
            ))}
          </>
        )}
      </main>

      {/* FAB — only on the diary tab */}
      {tab === 'diary' && (
        <button
          onClick={() => openComposer()}
          aria-label="New diary entry"
          className="absolute bottom-24 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <DiaryComposer
        open={composerOpen}
        editing={editing}
        isSaving={isSaving}
        onClose={handleClose}
        onSave={handleSave}
      />
    </>
  )
}
