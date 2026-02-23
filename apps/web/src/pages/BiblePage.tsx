import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BIBLE_VERSIONS } from '@repo/shared'
import { ReaderToolbar } from '../components/bible/ReaderToolbar'
import { ChapterPicker } from '../components/bible/ChapterPicker'
import { Verse } from '../components/bible/Verse'
import { VerseAnnotationModal } from '../components/bible/VerseAnnotationModal'
import { Skeleton } from '../components/atoms/Skeleton'
import { useBibleChapter, useBooks } from '../hooks/useBible'
import { useChapterAnnotations, useUpsertAnnotation } from '../hooks/useAnnotations'
import { useAIModal } from '../lib/AIModalContext'
import { cn } from '@repo/ui/utils'
import type { HighlightColor } from '@repo/shared'

// ─── Translation map ───────────────────────────────────────────────────────────

const VERSIONS: Record<string, number> = {
  NIV: BIBLE_VERSIONS.NIV,
  ASD: BIBLE_VERSIONS.ASD,
}

// ─── Skeleton placeholder ──────────────────────────────────────────────────────

function ChapterSkeleton() {
  const widths = ['w-full', 'w-5/6', 'w-full', 'w-4/6', 'w-full', 'w-5/6', 'w-3/6', 'w-full']
  return (
    <div className="px-4 py-4 space-y-3" aria-label="Loading chapter…">
      {widths.map((w, i) => (
        <Skeleton key={i} className={`h-4 ${w}`} />
      ))}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function BiblePage() {
  const { book = 'JHN', chapter = '3' } = useParams<{ book: string; chapter: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { openAI } = useAIModal()

  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set())
  const [pickerOpen, setPickerOpen] = useState(false)

  // Modal opens automatically as soon as any verse is selected
  const annotationOpen = selectedVerses.size > 0

  const versionKey = searchParams.get('v') ?? 'NIV'
  const versionId = VERSIONS[versionKey] ?? BIBLE_VERSIONS.NIV
  const chapterNum = parseInt(chapter)

  const booksQuery = useBooks(versionId)
  const chapterQuery = useBibleChapter(book, chapterNum, versionId)
  const annotationsQuery = useChapterAnnotations(book, chapterNum)
  const upsertAnnotation = useUpsertAnnotation()

  // Build lookup: USFM → annotation
  const annotationMap = Object.fromEntries((annotationsQuery.data ?? []).map(a => [a.usfm, a]))

  // Persist last read position so returning to /bible resumes here
  useEffect(() => {
    localStorage.setItem(
      'bible.lastPosition',
      JSON.stringify({
        book,
        chapter: chapterNum,
        version: versionKey,
        reference: chapterQuery.data?.reference,
      })
    )
  }, [book, chapterNum, versionKey, chapterQuery.data?.reference])

  // Clear selection when chapter changes
  useEffect(() => {
    setSelectedVerses(new Set())
  }, [book, chapterNum])

  // Find current book metadata to determine chapter bounds
  const currentBookMeta = booksQuery.data?.find(b => b.usfm === book)
  const maxChapter = currentBookMeta?.chapterCount ?? 1

  function navigate_to(nextBook: string, nextChapter: number) {
    const params = versionKey !== 'ESV' ? `?v=${versionKey}` : ''
    navigate(`/bible/${nextBook}/${nextChapter}${params}`)
    setSelectedVerses(new Set())
  }

  function handleTranslationChange(key: string) {
    setSearchParams({ v: key }, { replace: true })
    setSelectedVerses(new Set())
  }

  function handlePrev() {
    if (chapterNum > 1) {
      navigate_to(book, chapterNum - 1)
    } else {
      const books = booksQuery.data ?? []
      const idx = books.findIndex(b => b.usfm === book)
      if (idx > 0) {
        const prev = books[idx - 1]
        navigate_to(prev.usfm, prev.chapterCount)
      }
    }
  }

  function handleNext() {
    if (chapterNum < maxChapter) {
      navigate_to(book, chapterNum + 1)
    } else {
      const books = booksQuery.data ?? []
      const idx = books.findIndex(b => b.usfm === book)
      if (idx >= 0 && idx < books.length - 1) {
        navigate_to(books[idx + 1].usfm, 1)
      }
    }
  }

  function toggleVerse(num: number) {
    setSelectedVerses(prev => {
      const next = new Set(prev)
      if (next.has(num)) {
        next.delete(num)
      } else {
        next.add(num)
      }
      return next
    })
  }

  const hasPrev = (() => {
    if (chapterNum > 1) return true
    const books = booksQuery.data ?? []
    return books.findIndex(b => b.usfm === book) > 0
  })()

  const hasNext = (() => {
    if (chapterNum < maxChapter) return true
    const books = booksQuery.data ?? []
    const idx = books.findIndex(b => b.usfm === book)
    return idx >= 0 && idx < books.length - 1
  })()

  // Selected verse objects for the annotation modal
  const selectedVerseObjects = (chapterQuery.data?.verses ?? [])
    .filter(v => selectedVerses.has(v.number))
    .map(v => ({ number: v.number, text: v.text, usfm: v.usfm }))

  // For single-verse selection, pre-fill existing annotation
  const firstUsfm = selectedVerseObjects[0]?.usfm
  const existingAnnotation =
    selectedVerseObjects.length === 1 && firstUsfm ? annotationMap[firstUsfm] : undefined

  async function handleAnnotationSave(highlight: HighlightColor, note: string) {
    const chapterRef = chapterQuery.data?.reference ?? `${book} ${chapterNum}`
    await Promise.all(
      selectedVerseObjects.map(v =>
        upsertAnnotation.mutateAsync({
          userId: 'guest',
          usfm: v.usfm,
          highlight,
          note,
          reference: `${chapterRef}:${v.number}`,
        })
      )
    )
    setSelectedVerses(new Set())
  }

  function handleAskAI(prefill: string) {
    setSelectedVerses(new Set())
    openAI(prefill)
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto scrollbar-none">
        <ReaderToolbar
          translation={versionKey}
          chapterLabel={chapterQuery.data?.reference ?? `${book} ${chapter}`}
          versions={Object.keys(VERSIONS)}
          onTranslationChange={handleTranslationChange}
          onChapterChange={() => setPickerOpen(true)}
        />

        <div className="py-2">
          {chapterQuery.isLoading && <ChapterSkeleton />}

          {chapterQuery.isError && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Unable to load this chapter. Please try again.
            </p>
          )}

          {chapterQuery.data?.verses.map(verse => (
            <Verse
              key={verse.usfm}
              number={verse.number}
              text={verse.text}
              selected={selectedVerses.has(verse.number)}
              highlightColor={annotationMap[verse.usfm]?.highlight ?? null}
              onPress={() => toggleVerse(verse.number)}
            />
          ))}
        </div>

        {/* Required by YouVersion developer terms of service */}
        {chapterQuery.data?.copyright && (
          <p className="px-6 py-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            {chapterQuery.data.copyright}
          </p>
        )}

        {/* Prev / Next chapter navigation */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <button
            onClick={handlePrev}
            disabled={!hasPrev}
            className={cn(
              'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              hasPrev
                ? 'hover:bg-accent text-foreground'
                : 'text-muted-foreground/40 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!hasNext}
            className={cn(
              'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              hasNext
                ? 'hover:bg-accent text-foreground'
                : 'text-muted-foreground/40 cursor-not-allowed'
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </main>

      <VerseAnnotationModal
        open={annotationOpen}
        verses={selectedVerseObjects}
        chapterRef={chapterQuery.data?.reference ?? `${book} ${chapterNum}`}
        existingAnnotation={existingAnnotation}
        isSaving={upsertAnnotation.isPending}
        onClose={() => setSelectedVerses(new Set())}
        onSave={handleAnnotationSave}
        onAskAI={handleAskAI}
      />

      <ChapterPicker
        open={pickerOpen}
        books={booksQuery.data ?? []}
        currentBook={book}
        currentChapter={chapterNum}
        onSelect={(b, ch) => navigate_to(b, ch)}
        onClose={() => setPickerOpen(false)}
      />
    </>
  )
}
