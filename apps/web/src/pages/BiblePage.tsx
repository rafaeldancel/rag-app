import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BIBLE_VERSIONS } from '@repo/shared'
import { ReaderToolbar } from '../components/bible/ReaderToolbar'
import { ChapterPicker } from '../components/bible/ChapterPicker'
import { Verse } from '../components/bible/Verse'
import { Skeleton } from '../components/atoms/Skeleton'
import { useBibleChapter, useBooks } from '../hooks/useBible'
import { cn } from '@repo/ui/utils'

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

  const [selectedVerse, setSelectedVerse] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const versionKey = searchParams.get('v') ?? 'NIV'
  const versionId = VERSIONS[versionKey] ?? BIBLE_VERSIONS.NIV
  const chapterNum = parseInt(chapter)

  // Persist last read position so returning to /bible resumes here
  useEffect(() => {
    localStorage.setItem(
      'bible.lastPosition',
      JSON.stringify({ book, chapter: chapterNum, version: versionKey })
    )
  }, [book, chapterNum, versionKey])

  const booksQuery = useBooks(versionId)
  const chapterQuery = useBibleChapter(book, chapterNum, versionId)

  // Find current book metadata to determine chapter bounds
  const currentBookMeta = booksQuery.data?.find(b => b.usfm === book)
  const maxChapter = currentBookMeta?.chapterCount ?? 1

  function navigate_to(nextBook: string, nextChapter: number) {
    const params = versionKey !== 'ESV' ? `?v=${versionKey}` : ''
    navigate(`/bible/${nextBook}/${nextChapter}${params}`)
    setSelectedVerse(null)
  }

  function handleTranslationChange(key: string) {
    setSearchParams({ v: key }, { replace: true })
    setSelectedVerse(null)
  }

  function handlePrev() {
    if (chapterNum > 1) {
      navigate_to(book, chapterNum - 1)
    } else {
      // Jump to last chapter of the previous book
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
      // Jump to chapter 1 of the next book
      const books = booksQuery.data ?? []
      const idx = books.findIndex(b => b.usfm === book)
      if (idx >= 0 && idx < books.length - 1) {
        navigate_to(books[idx + 1].usfm, 1)
      }
    }
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
              selected={selectedVerse === verse.number}
              onPress={() => setSelectedVerse(v => (v === verse.number ? null : verse.number))}
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
