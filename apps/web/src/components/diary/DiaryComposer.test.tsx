import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DiaryComposer } from './DiaryComposer'

const mockEntry = {
  id: 'entry-1',
  title: 'Old Title',
  text: 'Old body text',
  createdAt: 0,
  userId: 'guest',
  aiInsight: null,
}

const baseProps = {
  open: true,
  isSaving: false,
  onClose: vi.fn(),
  onSave: vi.fn(),
}

describe('DiaryComposer', () => {
  it('renders nothing when open=false', () => {
    const { container } = render(<DiaryComposer {...baseProps} open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows "New Entry" heading when editing is null', () => {
    render(<DiaryComposer {...baseProps} editing={null} />)
    expect(screen.getByText('New Entry')).toBeInTheDocument()
  })

  it('shows "Edit Entry" heading when an existing entry is passed', () => {
    render(<DiaryComposer {...baseProps} editing={mockEntry} />)
    expect(screen.getByText('Edit Entry')).toBeInTheDocument()
  })

  it('prefills inputs with the existing entry values', () => {
    render(<DiaryComposer {...baseProps} editing={mockEntry} />)
    expect(screen.getByDisplayValue('Old Title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Old body text')).toBeInTheDocument()
  })

  it('Save button is disabled when both fields are empty', () => {
    render(<DiaryComposer {...baseProps} editing={null} />)
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled()
  })

  it('Save button is disabled when only title is filled', () => {
    render(<DiaryComposer {...baseProps} editing={null} />)
    fireEvent.change(screen.getByPlaceholderText(/give it a title/i), {
      target: { value: 'Some title' },
    })
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled()
  })

  it('Save button is enabled when both title and text are filled', () => {
    render(<DiaryComposer {...baseProps} editing={null} />)
    fireEvent.change(screen.getByPlaceholderText(/give it a title/i), {
      target: { value: 'Some title' },
    })
    fireEvent.change(screen.getByPlaceholderText(/what's on your heart/i), {
      target: { value: 'Some text' },
    })
    expect(screen.getByRole('button', { name: /^save$/i })).not.toBeDisabled()
  })

  it('calls onSave with trimmed title and text when Save is clicked', () => {
    const onSave = vi.fn()
    render(<DiaryComposer {...baseProps} onSave={onSave} editing={null} />)
    fireEvent.change(screen.getByPlaceholderText(/give it a title/i), {
      target: { value: '  My Title  ' },
    })
    fireEvent.change(screen.getByPlaceholderText(/what's on your heart/i), {
      target: { value: '  My body text  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onSave).toHaveBeenCalledWith('My Title', 'My body text')
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<DiaryComposer {...baseProps} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Save button is disabled while isSaving=true', () => {
    render(<DiaryComposer {...baseProps} isSaving={true} editing={mockEntry} />)
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('shows saving indicator text while isSaving=true', () => {
    render(<DiaryComposer {...baseProps} isSaving={true} />)
    expect(screen.getByText(/saving and generating/i)).toBeInTheDocument()
  })
})
