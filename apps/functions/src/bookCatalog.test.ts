import { describe, it, expect } from 'vitest'
import { lookupBook, formatAPA, BOOK_CATALOG } from './bookCatalog'

describe('lookupBook', () => {
  it('returns an entry for a known author + title key', () => {
    const entry = lookupBook('craig', 'reasonable-faith')
    expect(entry).not.toBeNull()
    expect(entry?.fullTitle).toBe('Reasonable Faith: Christian Truth and Apologetics')
    expect(entry?.authorFormatted).toBe('Craig, W. L.')
    expect(entry?.year).toBe('2008')
    expect(entry?.publisher).toBe('Crossway')
  })

  it('returns null for an unknown key', () => {
    expect(lookupBook('unknown', 'nonexistent-book')).toBeNull()
  })

  it('returns null when only the author matches', () => {
    expect(lookupBook('craig', 'no-such-title')).toBeNull()
  })

  it('returns null when only the title matches', () => {
    expect(lookupBook('nobody', 'reasonable-faith')).toBeNull()
  })

  // ── Tier 0: Logic & Science ────────────────────────────────────────────────

  it('returns a Google Books URL for modern apologetics works', () => {
    const entry = lookupBook('dawkins', 'god-delusion')
    expect(entry).not.toBeNull()
    expect(entry?.url).toContain('books.google.com')
    // URL is encoded with encodeURIComponent — decode before asserting readable title
    expect(decodeURIComponent(entry?.url ?? '')).toContain('The God Delusion')
  })

  // ── Tier 1: History & Provenance ──────────────────────────────────────────

  it('returns an ancient CE year for historical sources', () => {
    const entry = lookupBook('josephus', 'antiquities-of-the-jews')
    expect(entry).not.toBeNull()
    expect(entry?.year).toBe('c. 93 CE')
    expect(entry?.authorFormatted).toBe('Josephus, F.')
  })

  it('returns a Gutenberg URL for public-domain classical works', () => {
    const entry = lookupBook('tacitus', 'annals-of-imperial-rome')
    expect(entry?.url).toContain('gutenberg.org')
  })

  // ── Tier 2: Ethics & Meaning ──────────────────────────────────────────────

  it('returns entry for existentialist works (Nietzsche)', () => {
    const entry = lookupBook('nietzsche', 'thus-spoke-zarathustra')
    expect(entry).not.toBeNull()
    expect(entry?.url).toContain('gutenberg.org')
    expect(entry?.year).toBe('1885')
  })

  it("returns entry for Frankl (Man's Search for Meaning)", () => {
    const entry = lookupBook('frankl', 'mans-search-for-meaning')
    expect(entry).not.toBeNull()
    expect(entry?.year).toBe('1959')
  })
})

describe('formatAPA', () => {
  it('follows the "Author (Year). Title. Publisher." pattern', () => {
    const entry = {
      fullTitle: 'Test Book',
      authorFormatted: 'Smith, J.',
      year: '2000',
      publisher: 'Test Press',
    }
    expect(formatAPA(entry)).toBe('Smith, J. (2000). Test Book. Test Press.')
  })

  it('formats a real catalog entry correctly', () => {
    const entry = lookupBook('craig', 'reasonable-faith')!
    expect(formatAPA(entry)).toBe(
      'Craig, W. L. (2008). Reasonable Faith: Christian Truth and Apologetics. Crossway.'
    )
  })

  it('formats an ancient work with CE year correctly', () => {
    const entry = lookupBook('josephus', 'antiquities-of-the-jews')!
    const apa = formatAPA(entry)
    expect(apa).toContain('Josephus, F.')
    expect(apa).toContain('c. 93 CE')
    expect(apa).toContain('Antiquities of the Jews')
  })
})

describe('BOOK_CATALOG integrity', () => {
  it('contains entries across all three source tiers', () => {
    // Tier 0 — Logic & Science
    expect(BOOK_CATALOG['craig_reasonable-faith']).toBeDefined()
    expect(BOOK_CATALOG['dawkins_god-delusion']).toBeDefined()
    // Tier 1 — History & Provenance
    expect(BOOK_CATALOG['wright_resurrection-son-of-god']).toBeDefined()
    expect(BOOK_CATALOG['josephus_antiquities-of-the-jews']).toBeDefined()
    // Tier 2 — Ethics & Meaning
    expect(BOOK_CATALOG['frankl_mans-search-for-meaning']).toBeDefined()
    expect(BOOK_CATALOG['nietzsche_thus-spoke-zarathustra']).toBeDefined()
  })

  it('every entry has all required fields', () => {
    for (const [key, entry] of Object.entries(BOOK_CATALOG)) {
      expect(entry.fullTitle, `${key}: missing fullTitle`).toBeTruthy()
      expect(entry.authorFormatted, `${key}: missing authorFormatted`).toBeTruthy()
      expect(entry.year, `${key}: missing year`).toBeTruthy()
      expect(entry.publisher, `${key}: missing publisher`).toBeTruthy()
    }
  })

  it('every entry with a URL points to books.google.com or gutenberg.org or a known domain', () => {
    const allowedDomains = [
      'books.google.com',
      'gutenberg.org',
      'biblegateway.com',
      'wikipedia.org',
    ]
    for (const [key, entry] of Object.entries(BOOK_CATALOG)) {
      if (entry.url) {
        const matched = allowedDomains.some(d => entry.url!.includes(d))
        expect(matched, `${key}: URL "${entry.url}" uses an unexpected domain`).toBe(true)
      }
    }
  })
})
