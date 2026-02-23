import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SegmentedControl } from '../components/diary/SegmentedControl'
import { MentorInsightCard } from '../components/diary/MentorInsightCard'
import { DiaryEntryCard } from '../components/diary/DiaryEntryCard'
import { DiaryComposer } from '../components/diary/DiaryComposer'
import { Skeleton } from '../components/atoms/Skeleton'
import {
  useDiaryEntries,
  useCreateDiaryEntry,
  useUpdateDiaryEntry,
  useDeleteDiaryEntry,
} from '../hooks/useDiary'
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

export function DiaryPage() {
  const [tab, setTab] = useState('diary')
  const [composerOpen, setComposerOpen] = useState(false)
  const [editing, setEditing] = useState<DiaryEntry | null>(null)

  const entriesQuery = useDiaryEntries()
  const createMutation = useCreateDiaryEntry()
  const updateMutation = useUpdateDiaryEntry()
  const deleteMutation = useDeleteDiaryEntry()

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
      await updateMutation.mutateAsync({ userId: 'guest', id: editing.id, title, text })
    } else {
      await createMutation.mutateAsync({ userId: 'guest', title, text })
    }
    handleClose()
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync({ userId: 'guest', id })
  }

  const latestInsight = entriesQuery.data?.[0]?.aiInsight

  function formatDate(ms: number) {
    return new Date(ms).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-20 pt-4">
        <SegmentedControl segments={SEGMENTS} value={tab} onChange={setTab} />

        {tab === 'diary' && (
          <>
            {latestInsight && (
              <MentorInsightCard
                summary={latestInsight.text}
                verseReference={latestInsight.verseRef}
                verseText={latestInsight.verseText}
              />
            )}

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
              <div key={entry.id} className="space-y-2">
                <DiaryEntryCard
                  title={entry.title}
                  body={entry.text}
                  dateTime={formatDate(entry.createdAt)}
                  onEdit={() => openComposer(entry)}
                  onDelete={() => handleDelete(entry.id)}
                />
                {entry.aiInsight && (
                  <MentorInsightCard
                    summary={entry.aiInsight.text}
                    verseReference={entry.aiInsight.verseRef}
                    verseText={entry.aiInsight.verseText}
                    className="mx-8 mt-0"
                  />
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'notes' && (
          <p className="mx-4 text-sm text-muted-foreground">
            Notes from Bible verses will appear here.
          </p>
        )}

        {tab === 'highlights' && (
          <p className="mx-4 text-sm text-muted-foreground">Highlighted verses will appear here.</p>
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
