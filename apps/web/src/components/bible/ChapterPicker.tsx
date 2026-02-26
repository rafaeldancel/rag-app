import { useState, useEffect } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { cn } from '@repo/ui/utils'
import type { BibleBook } from '@repo/shared'

interface ChapterPickerProps {
  open: boolean
  books: BibleBook[]
  currentBook: string
  currentChapter: number
  onSelect: (book: string, chapter: number) => void
  onClose: () => void
}

const CANON_LABELS: Record<string, string> = {
  OT: 'Old Testament',
  NT: 'New Testament',
  DC: 'Deuterocanon',
}

export function ChapterPicker({
  open,
  books,
  currentBook,
  currentChapter,
  onSelect,
  onClose,
}: ChapterPickerProps) {
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null)

  // Reset to book list whenever picker opens
  useEffect(() => {
    if (open) setSelectedBook(null)
  }, [open])

  function handleBookSelect(book: BibleBook) {
    // If the book only has one chapter, navigate immediately
    if (book.chapterCount === 1) {
      onSelect(book.usfm, 1)
      onClose()
    } else {
      setSelectedBook(book)
    }
  }

  function handleChapterSelect(chapter: number) {
    if (!selectedBook) return
    onSelect(selectedBook.usfm, chapter)
    onClose()
  }

  // Group books by canon
  const grouped = books.reduce<Record<string, BibleBook[]>>((acc, book) => {
    const key = book.canon
    if (!acc[key]) acc[key] = []
    acc[key].push(book)
    return acc
  }, {})

  const canonOrder = ['OT', 'NT', 'DC']

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 z-40 bg-black/40 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'absolute left-4 right-4 top-1/2 z-50 flex flex-col rounded-2xl bg-background shadow-2xl',
          'max-h-[75vh] -translate-y-1/2 transition-all duration-200 ease-out',
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Select book and chapter"
      >
        {/* Header */}
        <div className="flex items-center px-4 pt-4 pb-2">
          {selectedBook ? (
            <button
              onClick={() => setSelectedBook(null)}
              className="flex items-center gap-1 rounded-md p-1.5 text-sm text-muted-foreground hover:bg-accent"
              aria-label="Back to books"
            >
              <ChevronLeft className="h-4 w-4" />
              Books
            </button>
          ) : (
            <span className="text-sm font-semibold">Select Book</span>
          )}

          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pb-safe">
          {/* ── Book list ── */}
          {!selectedBook && (
            <div className="px-2 pb-4">
              {canonOrder.map(canon => {
                const section = grouped[canon]
                if (!section?.length) return null
                return (
                  <div key={canon}>
                    <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {CANON_LABELS[canon] ?? canon}
                    </p>
                    {section.map(book => (
                      <button
                        key={book.usfm}
                        onClick={() => handleBookSelect(book)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-accent',
                          book.usfm === currentBook && 'bg-primary/10 font-semibold text-primary'
                        )}
                      >
                        <span>{book.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {book.chapterCount} {book.chapterCount === 1 ? 'ch' : 'chs'}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Chapter grid ── */}
          {selectedBook && (
            <div className="px-4 pb-4">
              <p className="py-2 text-base font-semibold">{selectedBook.name}</p>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    onClick={() => handleChapterSelect(ch)}
                    className={cn(
                      'flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium hover:bg-accent',
                      selectedBook.usfm === currentBook && ch === currentChapter
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
