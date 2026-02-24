import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { BIBLE_VERSIONS } from '@repo/shared'
import { ReaderToolbar } from '../components/bible/ReaderToolbar'
import { ChapterPicker } from '../components/bible/ChapterPicker'
import { ChapterSection, type SelectedVerse } from '../components/bible/ChapterSection'
import { VerseAnnotationModal } from '../components/bible/VerseAnnotationModal'
import { NoteInputModal } from '../components/bible/NoteInputModal'
import { useBooks } from '../hooks/useBible'
import { useUpsertAnnotation } from '../hooks/useAnnotations'
import { useAIModal } from '../lib/AIModalContext'
import type { HighlightColor, BibleBook } from '@repo/shared'

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSIONS: Record<string, number> = {
  NIV: BIBLE_VERSIONS.NIV,
  ASD: BIBLE_VERSIONS.ASD,
}

interface ChapterKey {
  book: string
  chapter: number
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function BiblePage() {
  const { book = 'JHN', chapter = '3' } = useParams<{ book: string; chapter: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { openAI } = useAIModal()

  const versionKey = searchParams.get('v') ?? 'NIV'
  const versionId = VERSIONS[versionKey] ?? BIBLE_VERSIONS.NIV
  const initialChapter = parseInt(chapter)

  // ── Infinite scroll: ordered list of loaded chapters ─────────────────────
  const [chapters, setChapters] = useState<ChapterKey[]>([{ book, chapter: initialChapter }])
  // Ref keeps IntersectionObserver callbacks up-to-date without re-subscribing
  const chaptersRef = useRef<ChapterKey[]>(chapters)
  chaptersRef.current = chapters

  // ── Visible chapter state (drives toolbar label, URL, and picker highlight) ─
  const [visibleBook, setVisibleBook] = useState(book)
  const [visibleChapter, setVisibleChapter] = useState(initialChapter)
  const [visibleRef, setVisibleRef] = useState(`${book} ${initialChapter}`)

  // ── Cross-chapter verse selection: Map<usfm, SelectedVerse> ─────────────
  const [selectedVerses, setSelectedVerses] = useState<Map<string, SelectedVerse>>(new Map())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)

  const annotationOpen = selectedVerses.size > 0

  const booksQuery = useBooks(versionId)
  const upsertAnnotation = useUpsertAnnotation()

  // Stable ref for books data used inside IntersectionObserver callback
  const booksDataRef = useRef<BibleBook[]>([])
  useEffect(() => {
    if (booksQuery.data) booksDataRef.current = booksQuery.data
  }, [booksQuery.data])

  // Reset everything when the URL route changes (e.g. ChapterPicker navigation)
  useEffect(() => {
    setChapters([{ book, chapter: initialChapter }])
    setSelectedVerses(new Map())
    setVisibleBook(book)
    setVisibleChapter(initialChapter)
    setVisibleRef(`${book} ${initialChapter}`)
  }, [book, initialChapter])

  // Persist last read position
  useEffect(() => {
    localStorage.setItem(
      'bible.lastPosition',
      JSON.stringify({ book: visibleBook, chapter: visibleChapter, version: versionKey })
    )
  }, [visibleBook, visibleChapter, versionKey])

  // ── Scroll container ref (needed for scroll-position correction on prepend) ─
  const mainRef = useRef<HTMLElement>(null)

  // ── Sentinels ─────────────────────────────────────────────────────────────
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Captured scroll height just before a prepend — used to restore position
  const scrollHeightBeforePrependRef = useRef<number | null>(null)

  // After prepend renders, offset scrollTop by the height of the inserted chapter
  // so the user's reading position doesn't jump.
  useLayoutEffect(() => {
    const before = scrollHeightBeforePrependRef.current
    if (before === null) return
    const el = mainRef.current
    if (!el) return
    el.scrollTop += el.scrollHeight - before
    scrollHeightBeforePrependRef.current = null
  }, [chapters])

  const loadPrevChapter = useCallback(() => {
    const current = chaptersRef.current
    const first = current[0]
    if (!first) return

    const books = booksDataRef.current
    let prevBook = first.book
    let prevChapter = first.chapter - 1

    if (prevChapter < 1) {
      const idx = books.findIndex(b => b.usfm === first.book)
      if (idx <= 0) return // Beginning of Bible
      prevBook = books[idx - 1].usfm
      prevChapter = books[idx - 1].chapterCount
    }

    if (current.some(c => c.book === prevBook && c.chapter === prevChapter)) return
    // Capture scroll height before prepend so useLayoutEffect can correct position
    scrollHeightBeforePrependRef.current = mainRef.current?.scrollHeight ?? null
    setChapters(prev => [{ book: prevBook, chapter: prevChapter }, ...prev])
  }, [])

  useEffect(() => {
    const el = topSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadPrevChapter()
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadPrevChapter])

  const loadNextChapter = useCallback(() => {
    const current = chaptersRef.current
    const last = current[current.length - 1]
    if (!last) return

    const books = booksDataRef.current
    const bookMeta = books.find(b => b.usfm === last.book)

    let nextBook = last.book
    let nextChapter = last.chapter + 1

    if (bookMeta && nextChapter > bookMeta.chapterCount) {
      const idx = books.findIndex(b => b.usfm === last.book)
      if (idx < 0 || idx >= books.length - 1) return // End of Bible
      nextBook = books[idx + 1].usfm
      nextChapter = 1
    }

    if (current.some(c => c.book === nextBook && c.chapter === nextChapter)) return
    setChapters(prev => [...prev, { book: nextBook, chapter: nextChapter }])
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNextChapter()
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadNextChapter])

  // ── Visible chapter tracking (fired by each ChapterSection) ───────────────
  const onChapterVisible = useCallback(
    (visBook: string, visChap: number, reference: string) => {
      setVisibleBook(visBook)
      setVisibleChapter(visChap)
      setVisibleRef(reference)
      const params = versionKey !== 'NIV' ? `?v=${versionKey}` : ''
      window.history.replaceState(null, '', `/bible/${visBook}/${visChap}${params}`)
    },
    [versionKey]
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleTranslationChange(key: string) {
    setSearchParams({ v: key }, { replace: true })
    setSelectedVerses(new Map())
  }

  function handleVersePress(verse: SelectedVerse) {
    setSelectedVerses(prev => {
      const next = new Map(prev)
      if (next.has(verse.usfm)) {
        next.delete(verse.usfm)
      } else {
        next.set(verse.usfm, verse)
      }
      return next
    })
  }

  function navigateTo(nextBook: string, nextChapter: number) {
    const params = versionKey !== 'NIV' ? `?v=${versionKey}` : ''
    navigate(`/bible/${nextBook}/${nextChapter}${params}`)
    setPickerOpen(false)
    setSelectedVerses(new Map())
  }

  // ── Derived data for annotation modals ────────────────────────────────────

  const selectedVerseArray = Array.from(selectedVerses.values()).sort((a, b) =>
    a.usfm.localeCompare(b.usfm)
  )
  const firstSelected = selectedVerseArray[0]
  const chapterRef = firstSelected?.chapterRef ?? visibleRef
  const existingAnnotation =
    selectedVerseArray.length === 1 ? firstSelected?.annotation ?? null : null

  const selectedUsfms = new Set(selectedVerses.keys())

  async function handleHighlightSelect(highlight: HighlightColor) {
    await Promise.all(
      selectedVerseArray.map(v =>
        upsertAnnotation.mutateAsync({
          userId: 'guest',
          usfm: v.usfm,
          highlight,
          reference: `${v.chapterRef}:${v.number}`,
          verseText: v.text,
        })
      )
    )
    setSelectedVerses(new Map())
  }

  async function handleNoteSave(note: string) {
    await Promise.all(
      selectedVerseArray.map(v =>
        upsertAnnotation.mutateAsync({
          userId: 'guest',
          usfm: v.usfm,
          note,
          reference: `${v.chapterRef}:${v.number}`,
          verseText: v.text,
        })
      )
    )
    setNoteModalOpen(false)
    setSelectedVerses(new Map())
  }

  function handleAskAI(prefill: string) {
    setSelectedVerses(new Map())
    openAI(prefill)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <main ref={mainRef} className="flex-1 overflow-y-auto scrollbar-none">
        {/* Sticky toolbar — always visible, updates to show current chapter */}
        <div className="sticky top-0 z-10 bg-background">
          <ReaderToolbar
            translation={versionKey}
            chapterLabel={visibleRef}
            versions={Object.keys(VERSIONS)}
            onTranslationChange={handleTranslationChange}
            onChapterChange={() => setPickerOpen(true)}
          />
        </div>

        <div className="pb-8">
          {/* Top sentinel: entering viewport triggers previous chapter load */}
          <div ref={topSentinelRef} className="h-1" aria-hidden="true" />
          {chapters.map(({ book: b, chapter: ch }) => (
            <ChapterSection
              key={`${b}-${ch}`}
              book={b}
              chapter={ch}
              versionId={versionId}
              selectedUsfms={selectedUsfms}
              onVersePress={handleVersePress}
              onVisible={onChapterVisible}
            />
          ))}
          {/* Sentinel: entering viewport triggers the next chapter load */}
          <div ref={sentinelRef} className="h-1" aria-hidden="true" />
        </div>
      </main>

      {/* Modals are outside <main> so they anchor to the AppShell container, not the scroll area */}
      <VerseAnnotationModal
        open={annotationOpen}
        verses={selectedVerseArray}
        chapterRef={chapterRef}
        existingAnnotation={existingAnnotation}
        onClose={() => setSelectedVerses(new Map())}
        onHighlight={handleHighlightSelect}
        onNote={() => setNoteModalOpen(true)}
        onAskAI={handleAskAI}
      />

      <NoteInputModal
        open={noteModalOpen}
        label={chapterRef}
        existingNote={existingAnnotation?.note}
        isSaving={upsertAnnotation.isPending}
        onClose={() => setNoteModalOpen(false)}
        onSave={handleNoteSave}
      />

      <ChapterPicker
        open={pickerOpen}
        books={booksQuery.data ?? []}
        currentBook={visibleBook}
        currentChapter={visibleChapter}
        onSelect={navigateTo}
        onClose={() => setPickerOpen(false)}
      />
    </>
  )
}
