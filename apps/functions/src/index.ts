import * as admin from 'firebase-admin'
import { onCall } from 'firebase-functions/v2/https'
import { GoogleGenAI } from '@google/genai'
import { ENV } from './env'
import { embedTexts } from './embeddings'
import { findNearestChunks, batchStoreChunks } from './firestoreSearch'
import { chunkText } from './chunking'

admin.initializeApp()
const db = admin.firestore()

function vertexClient() {
  process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true'
  process.env.GOOGLE_CLOUD_PROJECT = ENV.projectId
  process.env.GOOGLE_CLOUD_LOCATION = ENV.location
  return new GoogleGenAI({})
}

export const chat = onCall({ cors: true, region: ENV.location }, async req => {
  const question = String(req.data?.question || '').trim()
  if (!question) throw new Error('Missing question')

  // 1) embed the query
  const [qVec] = await embedTexts([question])

  // 2) vector search via Firestore native
  const nearestChunks = await findNearestChunks(qVec, 6)

  // 3) fetch parent doc metadata for citations
  const chunks: Array<{ id: string; text: string; sourceUri?: string; title?: string }> = []

  for (const chunk of nearestChunks) {
    const docSnap = await db.doc(`docs/${chunk.docId}`).get()
    const doc = docSnap.data() as { sourceUri?: string; title?: string }
    chunks.push({
      id: chunk.id,
      text: chunk.text,
      sourceUri: doc?.sourceUri,
      title: doc?.title,
    })
  }

  // 4) prompt Gemini with grounded context
  const ai = vertexClient()
  const contextBlock = chunks
    .slice(0, 6)
    .map(
      (c, i) =>
        `SOURCE ${i + 1}\nTitle: ${c.title || 'Untitled'}\nURI: ${c.sourceUri || 'unknown'}\nText:\n${c.text}`
    )
    .join('\n\n---\n\n')

  const system = `You are a helpful assistant. Answer using ONLY the provided sources when possible.
If sources are insufficient, say what is missing and suggest what to ingest next.
Always include a "Sources" section that lists which SOURCE numbers you used.`

  const resp = await ai.models.generateContent({
    model: ENV.chatModel,
    contents: [
      {
        role: 'user',
        parts: [
          { text: `SYSTEM:\n${system}\n\nCONTEXT:\n${contextBlock}\n\nQUESTION:\n${question}` },
        ],
      },
    ],
  })

  return {
    answer: resp.text ?? '',
    sources: chunks.map((c, i) => ({
      sourceNo: i + 1,
      title: c.title,
      uri: c.sourceUri,
    })),
  }
})

export const ingestFromApi = onCall({ cors: true, region: 'us-central1' }, async req => {
  const url = String(req.data?.url || '')
  if (!req.auth) {
    throw new Error('Unauthorized - must be logged in')
  }
  if (!url) throw new Error('Missing url')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const raw = await res.text()

  const docRef = await db.collection('docs').add({
    sourceType: 'api',
    sourceUri: url,
    title: url,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  const chunks = chunkText(raw)
  const vectors = await embedTexts(chunks)

  await batchStoreChunks(
    docRef.id,
    chunks.map((text: string, i: number) => ({ text, vector: vectors[i] }))
  )

  return { docId: docRef.id, chunkCount: chunks.length }
})

export { ingestFromGcs } from './gcsIngest'
