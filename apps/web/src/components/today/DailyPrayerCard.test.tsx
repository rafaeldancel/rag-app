import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DailyPrayerCard } from './DailyPrayerCard'

describe('DailyPrayerCard', () => {
  it('renders nothing when text is absent and not loading', () => {
    const { container } = render(<DailyPrayerCard />)
    expect(container.firstChild).toBeNull()
  })

  it('renders skeleton placeholders while loading', () => {
    const { container } = render(<DailyPrayerCard isLoading />)
    // Skeleton renders divs with the animate-pulse class
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('does not render prayer text while loading', () => {
    render(<DailyPrayerCard isLoading text="Lord, grant me peace." />)
    expect(screen.queryByText('Lord, grant me peace.')).not.toBeInTheDocument()
  })

  it('renders the prayer text', () => {
    render(<DailyPrayerCard text="Lord, grant me peace." basedOn="Psalm 23:1" />)
    expect(screen.getByText('Lord, grant me peace.')).toBeInTheDocument()
  })

  it('renders the basedOn scripture reference', () => {
    render(<DailyPrayerCard text="Lord, grant me peace." basedOn="Psalm 23:1" />)
    expect(screen.getByText(/psalm 23:1/i)).toBeInTheDocument()
  })

  it('shows "Say Amen" button initially with aria-pressed=false', () => {
    render(<DailyPrayerCard text="Lord, grant me peace." basedOn="Psalm 23:1" />)
    const btn = screen.getByRole('button', { name: /say amen/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggles to "Amen" with aria-pressed=true after clicking', () => {
    render(<DailyPrayerCard text="Lord, grant me peace." basedOn="Psalm 23:1" />)
    fireEvent.click(screen.getByRole('button', { name: /say amen/i }))
    const btn = screen.getByRole('button', { name: /^amen$/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles back to "Say Amen" on a second click', () => {
    render(<DailyPrayerCard text="Lord, grant me peace." basedOn="Psalm 23:1" />)
    fireEvent.click(screen.getByRole('button', { name: /say amen/i }))
    fireEvent.click(screen.getByRole('button', { name: /^amen$/i }))
    expect(screen.getByRole('button', { name: /say amen/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })
})
