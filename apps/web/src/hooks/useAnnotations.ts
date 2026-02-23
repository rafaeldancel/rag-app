import { trpc } from '../lib/trpc'
import type { HighlightColor } from '@repo/shared'

const USER_ID = 'guest'

/** Returns all annotations for a chapter as a map keyed by USFM (e.g. "JHN.3.16"). */
export function useChapterAnnotations(book: string, chapter: number) {
  return trpc.annotations.getForChapter.useQuery(
    { userId: USER_ID, book, chapter },
    { enabled: !!book && chapter > 0, staleTime: 0 }
  )
}

export function useUpsertAnnotation() {
  const utils = trpc.useUtils()
  return trpc.annotations.upsert.useMutation({
    onSuccess: (_data, variables) => {
      const { book, chapter } = parseBookChapter(variables.usfm)
      utils.annotations.getForChapter.invalidate({ userId: USER_ID, book, chapter })
    },
  })
}

/** Extracts book and chapter from a USFM like "JHN.3.16" → { book: "JHN", chapter: 3 } */
function parseBookChapter(usfm: string) {
  const [book, ch] = usfm.split('.')
  return { book: book ?? '', chapter: parseInt(ch ?? '1') }
}

export type { HighlightColor }
