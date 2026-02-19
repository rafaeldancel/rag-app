import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { App } from './App'

// Mock firebase to avoid real API calls in tests
vi.mock('./firebase', () => ({
  chatCallable: vi.fn(),
  ingestCallable: vi.fn(),
}))

describe('App', () => {
  it('renders the RAG App heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('RAG App')
  })

  it('renders the RAG Chat heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('RAG Chat')
  })

  it('renders the chat input', () => {
    render(<App />)
    expect(screen.getByPlaceholderText('Ask a question…')).toBeInTheDocument()
  })

  it('renders the send button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })
})
