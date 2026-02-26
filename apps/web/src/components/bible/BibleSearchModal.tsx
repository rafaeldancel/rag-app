import { useState } from 'react'
import { X, Search } from 'lucide-react'
import type { BibleBook } from '@repo/shared'

interface BibleSearchModalProps {
  open: boolean
  books: BibleBook[]
  currentBook: string
  currentChapter: number
  onSelect: (book: string, chapter: number) => void
  onClose: () => void
}

export function BibleSearchModal({
  open,
  books,
  currentBook,
  currentChapter,
  onSelect,
  onClose,
}: BibleSearchModalProps) {
  const [query, setQuery] = useState('')

  if (!open) return null

  const q = query.trim().toLowerCase()
  const filtered = q
    ? books.filter(
        b => b.name.toLowerCase().includes(q) || b.abbreviation.toLowerCase().includes(q)
      )
    : []

  return (
    <div
      role="dialog"
      aria-label="Navigate Bible"
      className="absolute inset-0 z-40 flex flex-col bg-background"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          type="text"
          placeholder="Search books…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={() => {
            setQuery('')
            onClose()
          }}
          aria-label="Close search"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Book list */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {!q ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Type a book name to search.
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            No books found.
          </div>
        ) : (
          filtered.map(book => (
            <div key={book.usfm} className="border-b px-4 py-3">
              {/* Book name */}
              <p className="mb-2 text-sm font-semibold text-foreground">{book.name}</p>

              {/* Horizontal chapter scroll */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map(ch => {
                  const active = book.usfm === currentBook && ch === currentChapter
                  return (
                    <button
                      key={ch}
                      onClick={() => {
                        setQuery('')
                        onSelect(book.usfm, ch)
                      }}
                      className={
                        active
                          ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold bg-primary text-primary-foreground'
                          : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-medium border bg-background hover:bg-primary hover:text-primary-foreground transition-colors'
                      }
                    >
                      {ch}
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
