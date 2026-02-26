import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
  useChapterAnnotations,
  useAllAnnotations,
  useUpsertAnnotation,
  useDeleteAnnotation,
} from './useAnnotations'

const mockAnnotations = [
  {
    usfm: 'JHN.3.16',
    highlight: 'yellow',
    note: null,
    reference: 'John 3:16',
    verseText: 'For God so loved the world...',
    createdAt: 1700000000000,
  },
  {
    usfm: 'PSA.23.1',
    highlight: null,
    note: 'Favourite verse',
    reference: 'Psalm 23:1',
    verseText: 'The Lord is my shepherd',
    createdAt: 1700086400000,
  },
]

vi.mock('../lib/trpc', () => ({
  trpc: {
    annotations: {
      getForChapter: {
        useQuery: vi.fn(() => ({
          data: mockAnnotations.filter(a => a.usfm.startsWith('JHN')),
          isLoading: false,
        })),
      },
      listAll: {
        useQuery: vi.fn(() => ({
          data: mockAnnotations,
          isLoading: false,
        })),
      },
      upsert: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue(mockAnnotations[0]),
          isPending: false,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({ usfm: 'JHN.3.16' }),
          isPending: false,
        })),
      },
    },
    useUtils: vi.fn(() => ({
      annotations: {
        getForChapter: { invalidate: vi.fn() },
        listAll: { invalidate: vi.fn() },
      },
    })),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useChapterAnnotations', () => {
  it('returns annotations scoped to the requested chapter', () => {
    const { result } = renderHook(() => useChapterAnnotations('JHN', 3), {
      wrapper: createWrapper(),
    })
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].usfm).toBe('JHN.3.16')
  })

  it('exposes isLoading flag', () => {
    const { result } = renderHook(() => useChapterAnnotations('JHN', 3), {
      wrapper: createWrapper(),
    })
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useAllAnnotations', () => {
  it('returns all annotations across chapters', () => {
    const { result } = renderHook(() => useAllAnnotations(), { wrapper: createWrapper() })
    expect(result.current.data).toHaveLength(2)
  })

  it('can filter highlights from the result', () => {
    const { result } = renderHook(() => useAllAnnotations(), { wrapper: createWrapper() })
    const highlights = (result.current.data ?? []).filter(a => a.highlight !== null)
    expect(highlights).toHaveLength(1)
    expect(highlights[0].highlight).toBe('yellow')
  })

  it('can filter notes from the result', () => {
    const { result } = renderHook(() => useAllAnnotations(), { wrapper: createWrapper() })
    const notes = (result.current.data ?? []).filter(a => a.note && a.note.trim().length > 0)
    expect(notes).toHaveLength(1)
    expect(notes[0].note).toBe('Favourite verse')
  })
})

describe('useUpsertAnnotation', () => {
  it('exposes a mutateAsync function', () => {
    const { result } = renderHook(() => useUpsertAnnotation(), { wrapper: createWrapper() })
    expect(typeof result.current.mutateAsync).toBe('function')
  })

  it('mutateAsync resolves with the saved annotation', async () => {
    const { result } = renderHook(() => useUpsertAnnotation(), { wrapper: createWrapper() })
    const annotation = await result.current.mutateAsync({
      userId: 'guest',
      usfm: 'JHN.3.16',
      highlight: 'yellow',
      reference: 'John 3:16',
      verseText: 'For God so loved the world...',
    })
    expect(annotation.usfm).toBe('JHN.3.16')
    expect(annotation.highlight).toBe('yellow')
  })
})

describe('useDeleteAnnotation', () => {
  it('exposes a mutateAsync function', () => {
    const { result } = renderHook(() => useDeleteAnnotation(), { wrapper: createWrapper() })
    expect(typeof result.current.mutateAsync).toBe('function')
  })

  it('mutateAsync resolves with the deleted usfm', async () => {
    const { result } = renderHook(() => useDeleteAnnotation(), { wrapper: createWrapper() })
    const res = await result.current.mutateAsync({ userId: 'guest', usfm: 'JHN.3.16' })
    expect(res.usfm).toBe('JHN.3.16')
  })
})
