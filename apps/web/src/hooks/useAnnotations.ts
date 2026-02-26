import { trpc } from '../lib/trpc'
import { useAuth } from '../providers/AuthProvider'
import type { HighlightColor } from '@repo/shared'

function useUserId() {
  const { user } = useAuth()
  return user?.uid ?? ''
}

/** Returns all annotations for a chapter as a map keyed by USFM (e.g. "JHN.3.16"). */
export function useChapterAnnotations(book: string, chapter: number) {
  const userId = useUserId()
  return trpc.annotations.getForChapter.useQuery(
    { userId, book, chapter },
    { enabled: !!userId && !!book && chapter > 0, staleTime: 0 }
  )
}

/** Returns all annotations for the user, newest first. */
export function useAllAnnotations() {
  const userId = useUserId()
  return trpc.annotations.listAll.useQuery({ userId }, { enabled: !!userId, staleTime: 0 })
}

export function useUpsertAnnotation() {
  const userId = useUserId()
  const utils = trpc.useUtils()
  return trpc.annotations.upsert.useMutation({
    onSuccess: (_data, variables) => {
      const { book, chapter } = parseBookChapter(variables.usfm)
      utils.annotations.getForChapter.invalidate({ userId, book, chapter })
      utils.annotations.listAll.invalidate({ userId })
    },
  })
}

export function useDeleteAnnotation() {
  const userId = useUserId()
  const utils = trpc.useUtils()
  return trpc.annotations.delete.useMutation({
    onSuccess: (_data, variables) => {
      const { book, chapter } = parseBookChapter(variables.usfm)
      utils.annotations.getForChapter.invalidate({ userId, book, chapter })
      utils.annotations.listAll.invalidate({ userId })
    },
  })
}

/** Extracts book and chapter from a USFM like "JHN.3.16" → { book: "JHN", chapter: 3 } */
function parseBookChapter(usfm: string) {
  const [book, ch] = usfm.split('.')
  return { book: book ?? '', chapter: parseInt(ch ?? '1') }
}

export type { HighlightColor }
