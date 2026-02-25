import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
  useDiaryEntries,
  useCreateDiaryEntry,
  useUpdateDiaryEntry,
  useDeleteDiaryEntry,
} from './useDiary'

const mockEntries = [
  {
    id: 'entry-1',
    title: 'Day 1',
    text: 'A great day',
    createdAt: 1700000000000,
    userId: 'guest',
    aiInsight: null,
  },
  {
    id: 'entry-2',
    title: 'Day 2',
    text: 'Another day',
    createdAt: 1700086400000,
    userId: 'guest',
    aiInsight: null,
  },
]

vi.mock('../lib/trpc', () => ({
  trpc: {
    diary: {
      list: {
        useQuery: vi.fn(() => ({
          data: mockEntries,
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue(mockEntries[0]),
          isPending: false,
        })),
      },
      update: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({ ...mockEntries[0], title: 'Updated' }),
          isPending: false,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue({ id: 'entry-1' }),
          isPending: false,
        })),
      },
    },
    useUtils: vi.fn(() => ({
      diary: { list: { invalidate: vi.fn() } },
    })),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDiaryEntries', () => {
  it('returns diary entries from tRPC', () => {
    const { result } = renderHook(() => useDiaryEntries(), { wrapper: createWrapper() })
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].title).toBe('Day 1')
    expect(result.current.data?.[1].title).toBe('Day 2')
  })

  it('exposes isLoading and isError flags', () => {
    const { result } = renderHook(() => useDiaryEntries(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })
})

describe('useCreateDiaryEntry', () => {
  it('exposes a mutateAsync function', () => {
    const { result } = renderHook(() => useCreateDiaryEntry(), { wrapper: createWrapper() })
    expect(typeof result.current.mutateAsync).toBe('function')
  })

  it('mutateAsync resolves with the created entry', async () => {
    const { result } = renderHook(() => useCreateDiaryEntry(), { wrapper: createWrapper() })
    const entry = await result.current.mutateAsync({
      userId: 'guest',
      title: 'Test',
      text: 'Hello',
    })
    expect(entry.id).toBe('entry-1')
    expect(entry.title).toBe('Day 1')
  })
})

describe('useUpdateDiaryEntry', () => {
  it('exposes a mutateAsync function', () => {
    const { result } = renderHook(() => useUpdateDiaryEntry(), { wrapper: createWrapper() })
    expect(typeof result.current.mutateAsync).toBe('function')
  })

  it('mutateAsync resolves with the updated entry', async () => {
    const { result } = renderHook(() => useUpdateDiaryEntry(), { wrapper: createWrapper() })
    const entry = await result.current.mutateAsync({
      userId: 'guest',
      id: 'entry-1',
      title: 'Updated',
      text: 'New text',
    })
    expect(entry.title).toBe('Updated')
  })
})

describe('useDeleteDiaryEntry', () => {
  it('exposes a mutateAsync function', () => {
    const { result } = renderHook(() => useDeleteDiaryEntry(), { wrapper: createWrapper() })
    expect(typeof result.current.mutateAsync).toBe('function')
  })

  it('mutateAsync resolves with the deleted entry id', async () => {
    const { result } = renderHook(() => useDeleteDiaryEntry(), { wrapper: createWrapper() })
    const res = await result.current.mutateAsync({ userId: 'guest', id: 'entry-1' })
    expect(res.id).toBe('entry-1')
  })
})
