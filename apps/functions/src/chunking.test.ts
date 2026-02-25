import { describe, it, expect } from 'vitest'
import { chunkText } from './chunking'

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    const result = chunkText('Hello world.')
    expect(result).toHaveLength(1)
    expect(result[0]).toBe('Hello world.')
  })

  it('combines short paragraphs into one chunk when under maxChars', () => {
    const text = 'Short one.\n\nShort two.\n\nShort three.'
    const result = chunkText(text, 1200)
    expect(result).toHaveLength(1)
    expect(result[0]).toContain('Short one')
    expect(result[0]).toContain('Short two')
    expect(result[0]).toContain('Short three')
  })

  it('splits into multiple chunks when combined length exceeds maxChars', () => {
    const longPara = 'A'.repeat(800)
    const text = `${longPara}\n\n${longPara}`
    // Combined = 1602 chars > 1200 default limit
    const result = chunkText(text, 1200)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe(longPara)
    expect(result[1]).toBe(longPara)
  })

  it('splits at paragraph boundaries, not mid-sentence', () => {
    const text = 'Paragraph one content.\n\nParagraph two content.\n\nParagraph three content.'
    const result = chunkText(text, 40)
    // Each paragraph is ~22 chars — should be individual chunks
    expect(result.length).toBeGreaterThan(1)
    expect(result[0]).toBe('Paragraph one content.')
  })

  it('filters out empty and whitespace-only paragraphs', () => {
    const text = '\n\nActual content.\n\n   \n\nMore content.\n\n'
    const result = chunkText(text)
    expect(result.every(c => c.trim().length > 0)).toBe(true)
    expect(result).toHaveLength(1) // combined within 1200 chars
  })

  it('returns empty array for blank input', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText('   \n\n   ')).toEqual([])
  })

  it('respects a custom maxChars parameter', () => {
    const para = 'Word '.repeat(20).trim() // ~99 chars
    const text = `${para}\n\n${para}\n\n${para}`
    const result = chunkText(text, 150) // 2 paragraphs fit, 3rd spills
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('places an oversized single paragraph in its own chunk', () => {
    const giant = 'X'.repeat(2000)
    const small = 'small text'
    const text = `${small}\n\n${giant}`
    const result = chunkText(text, 1200)
    // 'small text' accumulates first, then the giant para triggers a flush
    expect(result.length).toBe(2)
    expect(result[1]).toBe(giant)
  })
})
