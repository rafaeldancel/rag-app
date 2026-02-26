import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { App } from './App'

// Mock firebase to avoid real API calls in tests
vi.mock('./firebase', () => ({
  chatCallable: vi.fn(),
  ingestCallable: vi.fn(),
}))

// Mock tRPC so TodayPage/BiblePage/DiaryPage don't need a real provider
vi.mock('./lib/trpc', () => ({
  trpc: {
    bible: {
      getVOTD: {
        useQuery: vi.fn(() => ({ data: undefined, isLoading: true, isError: false })),
      },
      getDailyPrayer: {
        useQuery: vi.fn(() => ({ data: undefined, isLoading: true, isError: false })),
      },
      getBooks: {
        useQuery: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
      },
      getChapter: {
        useQuery: vi.fn(() => ({ data: undefined, isLoading: true, isError: false })),
      },
    },
    diary: {
      list: {
        useQuery: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
      },
      create: {
        useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
      },
      update: {
        useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
      },
      delete: {
        useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
      },
    },
    annotations: {
      getForChapter: {
        useQuery: vi.fn(() => ({ data: [], isLoading: false })),
      },
      listAll: {
        useQuery: vi.fn(() => ({ data: [], isLoading: false })),
      },
      upsert: {
        useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
      },
      delete: {
        useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
      },
    },
    useUtils: vi.fn(() => ({
      diary: { list: { invalidate: vi.fn() } },
      annotations: {
        getForChapter: { invalidate: vi.fn() },
        listAll: { invalidate: vi.fn() },
      },
    })),
  },
  trpcClient: {},
}))

describe('App', () => {
  it('renders the bottom navigation', () => {
    render(<App />)
    expect(screen.getByRole('navigation', { name: /bottom navigation/i })).toBeInTheDocument()
  })

  it('renders the Today nav link', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /today/i })).toBeInTheDocument()
  })

  it('renders the Bible nav link', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /bible/i })).toBeInTheDocument()
  })

  it('renders the AI trigger button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /open ai assistant/i })).toBeInTheDocument()
  })

  it('renders the Today page by default', () => {
    render(<App />)
    expect(screen.getByText(/day streak/i)).toBeInTheDocument()
  })
})
