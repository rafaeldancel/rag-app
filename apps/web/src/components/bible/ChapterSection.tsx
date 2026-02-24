import { useRef, useEffect } from 'react'
import { useBibleChapter, useBooks } from '../../hooks/useBible'
import { useChapterAnnotations } from '../../hooks/useAnnotations'
import { Verse } from './Verse'
import { Skeleton } from '../atoms/Skeleton'
import type { Annotation } from '@repo/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

/** A verse that has been selected by the user. Includes a snapshot of the
 *  annotation at the time of selection (used by the annotation modal). */
export interface SelectedVerse {
  usfm: string // "JHN.3.16"
  number: number
  text: string
  chapterRef: string // "John 3"
  annotation: Annotation | null
}

interface ChapterSectionProps {
  book: string
  chapter: number
  versionId: number
  selectedUsfms: Set<string>
  onVersePress: (verse: SelectedVerse) => void
  /** Called when this chapter's heading enters the top 30 % of the viewport. */
  onVisible: (book: string, chapter: number, reference: string) => void
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function ChapterSection({
  book,
  chapter,
  versionId,
  selectedUsfms,
  onVersePress,
  onVisible,
}: ChapterSectionProps) {
  const headingRef = useRef<HTMLDivElement>(null)
  const chapterQuery = useBibleChapter(book, chapter, versionId)
  const annotationsQuery = useChapterAnnotations(book, chapter)
  // useBooks shares the same React Query cache key as BiblePage — no extra API call.
  // We need it here to get the localized book name (e.g. "Manghuhukom" for ASD),
  // because getChapter.reference is always built from the hardcoded English BOOK_NAMES map.
  const booksQuery = useBooks(versionId)

  const annotationMap = Object.fromEntries((annotationsQuery.data ?? []).map(a => [a.usfm, a]))

  // Prefer the version-localized name from getBooks; fall back to the English
  // reference from getChapter while books are still loading.
  const localizedBookName = booksQuery.data?.find(b => b.usfm === book)?.name
  const chapterRef = localizedBookName
    ? `${localizedBookName} ${chapter}`
    : chapterQuery.data?.reference ?? `${book} ${chapter}`

  // Fire onVisible when heading scrolls into the top 30 % of the viewport.
  // rootMargin '0px 0px -70% 0px' means the bottom threshold is at 30 % of viewport height.
  useEffect(() => {
    const el = headingRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible(book, chapter, chapterRef)
      },
      { rootMargin: '0px 0px -70% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [book, chapter, chapterRef, onVisible])

  // Split "John 3" → bookName="John", chapterNum="3"
  // Works for multi-word books too: "1 Kings 5" → "1 Kings", "5"
  const lastSpace = chapterRef.lastIndexOf(' ')
  const bookName = lastSpace > 0 ? chapterRef.slice(0, lastSpace) : chapterRef
  const chapterNum = lastSpace > 0 ? chapterRef.slice(lastSpace + 1) : ''

  return (
    <section>
      {/* Heading — observed for URL + toolbar label updates */}
      <div ref={headingRef} className="flex flex-col items-center pt-10 pb-4 select-none">
        <span className="text-base font-semibold tracking-wide text-muted-foreground">
          {bookName}
        </span>
        <span className="text-6xl font-bold leading-tight text-foreground">{chapterNum}</span>
      </div>

      {chapterQuery.isLoading && <ChapterSkeleton />}

      {chapterQuery.isError && (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Unable to load this chapter.
        </p>
      )}

      {chapterQuery.data?.verses.map(verse => (
        <Verse
          key={verse.usfm}
          number={verse.number}
          text={verse.text}
          selected={selectedUsfms.has(verse.usfm)}
          highlightColor={annotationMap[verse.usfm]?.highlight ?? null}
          onPress={() =>
            onVersePress({
              usfm: verse.usfm,
              number: verse.number,
              text: verse.text,
              chapterRef,
              annotation: annotationMap[verse.usfm] ?? null,
            })
          }
        />
      ))}

      {chapterQuery.data?.copyright && (
        <p className="px-6 pb-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          {chapterQuery.data.copyright}
        </p>
      )}
    </section>
  )
}
