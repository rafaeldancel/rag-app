import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DiaryEntryCard } from './DiaryEntryCard'

const baseProps = {
  title: 'My First Entry',
  body: 'Today was a meaningful day of quiet reflection.',
  dateTime: 'Feb 25, 12:00 PM',
}

describe('DiaryEntryCard', () => {
  it('renders the entry title', () => {
    render(<DiaryEntryCard {...baseProps} />)
    expect(screen.getByText('My First Entry')).toBeInTheDocument()
  })

  it('renders the body text', () => {
    render(<DiaryEntryCard {...baseProps} />)
    expect(screen.getByText('Today was a meaningful day of quiet reflection.')).toBeInTheDocument()
  })

  it('renders the formatted date', () => {
    render(<DiaryEntryCard {...baseProps} />)
    expect(screen.getByText('Feb 25, 12:00 PM')).toBeInTheDocument()
  })

  it('calls onEdit when the edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<DiaryEntryCard {...baseProps} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: /edit entry/i }))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('calls onDelete when the delete button is clicked', () => {
    const onDelete = vi.fn()
    render(<DiaryEntryCard {...baseProps} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: /delete entry/i }))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('renders the Mentor Insight section when aiInsight is provided', () => {
    const aiInsight = {
      text: 'God is walking with you through this.',
      verseRef: 'Isa 41:10',
      verseText: 'Do not fear, for I am with you.',
    }
    render(<DiaryEntryCard {...baseProps} aiInsight={aiInsight} />)
    expect(screen.getByText('God is walking with you through this.')).toBeInTheDocument()
    expect(screen.getByText('Isa 41:10')).toBeInTheDocument()
    expect(screen.getByText('Do not fear, for I am with you.')).toBeInTheDocument()
  })

  it('renders the Mentor Insight label when aiInsight is provided', () => {
    const aiInsight = { text: 'God is with you.', verseRef: 'Isa 41:10' }
    render(<DiaryEntryCard {...baseProps} aiInsight={aiInsight} />)
    expect(screen.getByText(/mentor insight/i)).toBeInTheDocument()
  })

  it('does not render Mentor Insight section when aiInsight is null', () => {
    render(<DiaryEntryCard {...baseProps} aiInsight={null} />)
    expect(screen.queryByText(/mentor insight/i)).not.toBeInTheDocument()
  })

  it('does not render Mentor Insight section when aiInsight is undefined', () => {
    render(<DiaryEntryCard {...baseProps} />)
    expect(screen.queryByText(/mentor insight/i)).not.toBeInTheDocument()
  })

  it('renders a mood pill when mood prop is provided', () => {
    render(<DiaryEntryCard {...baseProps} mood="Grateful" />)
    expect(screen.getByText('Grateful')).toBeInTheDocument()
  })
})
