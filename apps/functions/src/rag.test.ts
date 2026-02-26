import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mock fns so vi.mock factories can reference them ─────────────────
// Vitest hoists vi.mock() calls above imports; vi.hoisted() ensures these
// variables are initialised before the factories run.
const { mockEmbedTexts, mockFindNearestChunks, mockGenerateContent, mockDocGet } = vi.hoisted(
  () => ({
    mockEmbedTexts: vi.fn(),
    mockFindNearestChunks: vi.fn(),
    mockGenerateContent: vi.fn(),
    mockDocGet: vi.fn(),
  })
)

// ── Module mocks ───────────────────────────────────────────────────────────

vi.mock('firebase-admin', () => ({
  // rag.ts calls admin.firestore() to get a db, then db.doc(path).get()
  firestore: () => ({ doc: () => ({ get: mockDocGet }) }),
}))

vi.mock('./embeddings', () => ({ embedTexts: mockEmbedTexts }))

vi.mock('./firestoreSearch', () => ({ findNearestChunks: mockFindNearestChunks }))

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({ models: { generateContent: mockGenerateContent } })),
}))

import { ragQuery } from './rag'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a mock Firestore DocumentSnapshot. */
function docSnap(data: Record<string, unknown> | undefined) {
  return { data: () => data }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ragQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: one chunk from a known catalog entry (craig_reasonable-faith)
    mockEmbedTexts.mockResolvedValue([[0.1, 0.2, 0.3]])
    mockFindNearestChunks.mockResolvedValue([
      { id: 'chunk-1', text: 'For God so loved the world.', docId: 'doc-1' },
    ])
    mockDocGet.mockResolvedValue(
      docSnap({ title: 'reasonable-faith', author: 'craig', sourceUri: 'gs://bucket/file.pdf' })
    )
    mockGenerateContent.mockResolvedValue({ text: 'God loves you unconditionally.' })
  })

  // ── Return shape ───────────────────────────────────────────────────────

  it('returns answer, sources, profile, and chunksRetrieved', async () => {
    const result = await ragQuery({ question: 'What is grace?' })
    expect(result.answer).toBe('God loves you unconditionally.')
    expect(result.profile).toBe('bible-study')
    expect(result.chunksRetrieved).toBe(1)
    expect(Array.isArray(result.sources)).toBe(true)
    expect(result.sources).toHaveLength(1)
  })

  it('defaults to the bible-study profile', async () => {
    const result = await ragQuery({ question: 'Tell me about faith.' })
    expect(result.profile).toBe('bible-study')
  })

  it('respects an explicit profile override', async () => {
    const result = await ragQuery({ question: 'Explain Sisyphus.', profile: 'general' })
    expect(result.profile).toBe('general')
  })

  // ── Embedding + retrieval ──────────────────────────────────────────────

  it('embeds the user question to produce a query vector', async () => {
    await ragQuery({ question: 'What is the resurrection?' })
    expect(mockEmbedTexts).toHaveBeenCalledWith(['What is the resurrection?'])
  })

  it('passes the query vector and topK to findNearestChunks', async () => {
    await ragQuery({ question: 'test' })
    expect(mockFindNearestChunks).toHaveBeenCalledWith([0.1, 0.2, 0.3], 6)
  })

  it('respects a custom topK parameter', async () => {
    await ragQuery({ question: 'test', topK: 3 })
    expect(mockFindNearestChunks).toHaveBeenCalledWith([0.1, 0.2, 0.3], 3)
  })

  // ── Source deduplication ──────────────────────────────────────────────

  it('deduplicates sources so two chunks from the same doc = 1 source', async () => {
    mockFindNearestChunks.mockResolvedValue([
      { id: 'chunk-1', text: 'First passage.', docId: 'doc-1' },
      { id: 'chunk-2', text: 'Second passage.', docId: 'doc-1' }, // same doc
      { id: 'chunk-3', text: 'Third passage.', docId: 'doc-2' },
    ])
    mockDocGet
      .mockResolvedValueOnce(docSnap({ title: 'reasonable-faith', author: 'craig' }))
      .mockResolvedValueOnce(docSnap({ title: 'reasonable-faith', author: 'craig' }))
      .mockResolvedValueOnce(docSnap({ title: 'god-delusion', author: 'dawkins' }))

    const result = await ragQuery({ question: 'test' })
    expect(result.chunksRetrieved).toBe(3) // all chunks are retrieved...
    expect(result.sources).toHaveLength(2) // ...but deduplicated to 2 unique docs
  })

  it('assigns sequential sourceNo values starting from 1', async () => {
    mockFindNearestChunks.mockResolvedValue([
      { id: 'c1', text: 'A', docId: 'doc-1' },
      { id: 'c2', text: 'B', docId: 'doc-2' },
    ])
    mockDocGet
      .mockResolvedValueOnce(docSnap({ title: 'reasonable-faith', author: 'craig' }))
      .mockResolvedValueOnce(docSnap({ title: 'god-delusion', author: 'dawkins' }))

    const result = await ragQuery({ question: 'test' })
    expect(result.sources[0].sourceNo).toBe(1)
    expect(result.sources[1].sourceNo).toBe(2)
  })

  // ── Book catalog enrichment ────────────────────────────────────────────

  it('enriches sources with book catalog data when the doc matches a known entry', async () => {
    const result = await ragQuery({ question: 'What is faith?' })
    const source = result.sources[0]
    expect(source.fullTitle).toBe('Reasonable Faith: Christian Truth and Apologetics')
    expect(source.authorFormatted).toBe('Craig, W. L.')
    expect(source.year).toBe('2008')
    expect(source.apa).toContain('Craig, W. L.')
    expect(source.url).toContain('books.google.com')
  })

  it('gracefully handles a doc not found in the book catalog', async () => {
    mockDocGet.mockResolvedValue(
      docSnap({ title: 'custom-notes', author: 'pastor-john', sourceUri: 'gs://bucket/notes.pdf' })
    )
    const result = await ragQuery({ question: 'test' })
    expect(result.sources).toHaveLength(1)
    // Catalog fields are absent — should not throw
    expect(result.sources[0].fullTitle).toBeUndefined()
    expect(result.sources[0].apa).toBeUndefined()
  })

  // ── Edge cases ────────────────────────────────────────────────────────

  it('returns empty sources and 0 chunksRetrieved when no chunks are found', async () => {
    mockFindNearestChunks.mockResolvedValue([])
    const result = await ragQuery({ question: 'something obscure' })
    expect(result.sources).toHaveLength(0)
    expect(result.chunksRetrieved).toBe(0)
    // Gemini is still called — even with no context the model responds
    expect(result.answer).toBe('God loves you unconditionally.')
  })
})
