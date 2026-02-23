import { BIBLE_VERSIONS } from '@repo/shared'
import { trpc } from '../lib/trpc'

const VOTD_STALE_TIME = 24 * 60 * 60 * 1000 // 24 hours — VOTD changes once per day
const CHAPTER_STALE_TIME = 60 * 60 * 1000 // 1 hour — chapter text is static
const BOOKS_STALE_TIME = 7 * 24 * 60 * 60 * 1000 // 7 days — book list never changes

/** Fetches today's Verse of the Day. Cached for 24 hours. */
export function useVotd(versionId: number = BIBLE_VERSIONS.NIV) {
  return trpc.bible.getVOTD.useQuery({ versionId }, { staleTime: VOTD_STALE_TIME })
}

/** Fetches a Gemini-generated prayer based on today's VOTD. Cached for 24 hours. */
export function useDailyPrayer(versionId: number = BIBLE_VERSIONS.NIV) {
  return trpc.bible.getDailyPrayer.useQuery({ versionId }, { staleTime: VOTD_STALE_TIME })
}

/** Fetches all books in a Bible version. Cached for 7 days. */
export function useBooks(versionId: number = BIBLE_VERSIONS.NIV) {
  return trpc.bible.getBooks.useQuery({ versionId }, { staleTime: BOOKS_STALE_TIME })
}

/** Fetches a full chapter by book + chapter number + version. */
export function useBibleChapter(
  book: string,
  chapter: number,
  versionId: number = BIBLE_VERSIONS.NIV
) {
  return trpc.bible.getChapter.useQuery(
    { book, chapter, versionId },
    { enabled: !!book && chapter > 0, staleTime: CHAPTER_STALE_TIME }
  )
}
