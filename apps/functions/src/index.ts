import * as admin from 'firebase-admin'
import { createHash } from 'crypto'
import { onCall, onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { ENV } from './env'
import { embedTexts } from './embeddings'
import { batchStoreChunks } from './firestoreSearch'
import { chunkText } from './chunking'
import { ragQuery, type PromptProfile } from './rag'
import { checkRateLimit } from './rateLimit'
import { appRouter } from './trpc/router'

admin.initializeApp()
const db = admin.firestore()

// ── URL validation (SSRF guard) ───────────────────────────────────

/**
 * Validates an ingest URL, rejecting non-HTTP(S) schemes and
 * private/metadata network targets to prevent SSRF attacks.
 */
function validateIngestUrl(raw: string): URL {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Invalid URL format')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed')
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block known metadata and loopback endpoints
  const BLOCKED_HOSTS = [
    'metadata.google.internal',
    'metadata.goog',
    '169.254.169.254', // GCP/AWS link-local metadata
    '127.0.0.1',
    'localhost',
    '::1',
    '0.0.0.0',
  ]
  if (BLOCKED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h))) {
    throw new Error('URL target is not allowed')
  }

  // Block RFC 1918 private IP ranges
  if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname)) {
    throw new Error('URL target is not allowed')
  }

  return parsed
}

// ── Chat (RAG Pipeline) ───────────────────────────────────────────

export const chat = onCall({ cors: true, region: ENV.location }, async req => {
  const question = String(req.data?.question || '').trim()
  const validProfiles: PromptProfile[] = ['bible-study', 'general', 'strict']
  const rawProfile = String(req.data?.profile || '')
  const profile: PromptProfile = validProfiles.includes(rawProfile as PromptProfile)
    ? (rawProfile as PromptProfile)
    : 'bible-study'

  if (!question) throw new Error('Missing question')

  // 50 RAG queries per 24 h per caller (uid if authed, else anonymous pool)
  const rateLimitKey = `chat:${req.auth?.uid ?? 'anonymous'}`
  await checkRateLimit(rateLimitKey, 50, 86_400_000)

  const result = await ragQuery({ question, profile })

  return {
    answer: result.answer,
    sources: result.sources,
    profile: result.profile,
    chunksRetrieved: result.chunksRetrieved,
  }
})

// ── Ingest from URL ────────────────────────────────────────────────

export const ingestFromApi = onCall({ cors: true, region: 'us-central1' }, async req => {
  if (!req.auth) throw new Error('Unauthorized - must be logged in')

  // 10 ingestions per 24 h per authenticated user
  await checkRateLimit(`ingest:${req.auth.uid}`, 10, 86_400_000)

  const url = String(req.data?.url || '')
  if (!url) throw new Error('Missing url')

  // Validate URL — rejects private/metadata targets and non-HTTP(S) schemes
  const validatedUrl = validateIngestUrl(url)

  // Derive a stable docId from the URL so the same source is never ingested twice
  const docId = createHash('sha256').update(url).digest('hex').slice(0, 20)
  const docRef = db.doc(`docs/${docId}`)
  const existing = await docRef.get()

  if (existing.exists) {
    const chunkCount = (await docRef.collection('chunks').count().get()).data().count
    return { docId, chunkCount, cached: true }
  }

  // Fetch with a 30 s timeout to prevent hanging the function
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)
  let res: Response
  try {
    res = await fetch(validatedUrl.href, { signal: controller.signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new Error('URL fetch timed out after 30 s')
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)

  // Only accept text-based content — reject images, binaries, etc.
  const contentType = res.headers.get('content-type') ?? ''
  const ALLOWED_TYPES = ['text/', 'application/json', 'application/xml', 'application/xhtml']
  if (!ALLOWED_TYPES.some(t => contentType.includes(t))) {
    throw new Error(
      `Unsupported content type: ${contentType}. Only text documents can be ingested.`
    )
  }

  const raw = await res.text()

  // Reject documents over 5 MB to avoid runaway embedding costs
  const MAX_BYTES = 5 * 1024 * 1024
  if (raw.length > MAX_BYTES) {
    throw new Error('Document too large (max 5 MB)')
  }

  await docRef.set({
    sourceType: 'api',
    sourceUri: url,
    title: url,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  const chunks = chunkText(raw)

  // Embed — delete the doc header if this fails so no orphan exists
  let vectors: number[][]
  try {
    vectors = await embedTexts(chunks)
  } catch (err) {
    await docRef.delete()
    throw err
  }

  if (vectors.length !== chunks.length) {
    await docRef.delete()
    throw new Error(`Embedding count mismatch: expected ${chunks.length}, got ${vectors.length}`)
  }

  // Batch write — delete the doc header on any failure to keep storage consistent
  try {
    const chunkItems = chunks.map((text: string, i: number) => ({ text, vector: vectors[i] }))
    const BATCH_MAX = 400
    for (let i = 0; i < chunkItems.length; i += BATCH_MAX) {
      await batchStoreChunks(docId, chunkItems.slice(i, i + BATCH_MAX), i)
    }
  } catch (err) {
    await docRef.delete()
    throw err
  }

  return { docId, chunkCount: chunks.length }
})

// ── Ingest from Cloud Storage ──────────────────────────────────────

export { ingestFromGcs } from './gcsIngest'

// ── tRPC HTTP handler ──────────────────────────────────────────────

const youversionApiKey = defineSecret('YOUVERSION_API_KEY')

export const api = onRequest(
  { cors: true, region: ENV.location, secrets: [youversionApiKey] },
  async (req, res) => {
    const host = req.headers.host ?? 'localhost'
    const url = `${req.protocol}://${host}${req.originalUrl}`

    const fetchReq = new Request(url, {
      method: req.method,
      headers: new Headers(req.headers as Record<string, string>),
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body),
    })

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: fetchReq,
      router: appRouter,
      createContext: () => ({}),
    })

    res.status(response.status)
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(await response.text())
  }
)
