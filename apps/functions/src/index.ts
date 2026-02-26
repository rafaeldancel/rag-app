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

  // Derive a stable docId from the URL so the same source is never ingested twice
  const docId = createHash('sha256').update(url).digest('hex').slice(0, 20)
  const docRef = db.doc(`docs/${docId}`)
  const existing = await docRef.get()

  if (existing.exists) {
    const chunkCount = (await docRef.collection('chunks').count().get()).data().count
    return { docId, chunkCount, cached: true }
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const raw = await res.text()

  await docRef.set({
    sourceType: 'api',
    sourceUri: url,
    title: url,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  const chunks = chunkText(raw)
  const vectors = await embedTexts(chunks)

  const chunkItems = chunks.map((text: string, i: number) => ({ text, vector: vectors[i] }))
  const BATCH_MAX = 400
  for (let i = 0; i < chunkItems.length; i += BATCH_MAX) {
    await batchStoreChunks(docId, chunkItems.slice(i, i + BATCH_MAX), i)
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
