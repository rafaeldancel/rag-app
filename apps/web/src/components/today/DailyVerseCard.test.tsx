import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DailyVerseCard } from './DailyVerseCard'

const baseProps = {
  reference: 'John 3:16',
  text: 'For God so loved the world that he gave his one and only Son.',
}

describe('DailyVerseCard', () => {
  it('renders the verse reference', () => {
    render(<DailyVerseCard {...baseProps} />)
    expect(screen.getByText('John 3:16')).toBeInTheDocument()
  })

  it('renders the verse text', () => {
    render(<DailyVerseCard {...baseProps} />)
    expect(
      screen.getByText('For God so loved the world that he gave his one and only Son.')
    ).toBeInTheDocument()
  })

  it('renders a "Read Chapter" button', () => {
    render(<DailyVerseCard {...baseProps} />)
    expect(screen.getByRole('button', { name: /read chapter/i })).toBeInTheDocument()
  })

  it('calls onReadChapter when the button is clicked', () => {
    const onReadChapter = vi.fn()
    render(<DailyVerseCard {...baseProps} onReadChapter={onReadChapter} />)
    fireEvent.click(screen.getByRole('button', { name: /read chapter/i }))
    expect(onReadChapter).toHaveBeenCalledOnce()
  })

  it('does not throw when onReadChapter is not provided', () => {
    render(<DailyVerseCard {...baseProps} />)
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: /read chapter/i }))
    ).not.toThrow()
  })
})
