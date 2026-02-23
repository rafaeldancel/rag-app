import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { App } from './App'

// Mock firebase to avoid real API calls in tests
vi.mock('./firebase', () => ({
  chatCallable: vi.fn(),
  ingestCallable: vi.fn(),
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
