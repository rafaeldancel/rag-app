import * as admin from 'firebase-admin'
import { GoogleGenAI } from '@google/genai'
import { ENV } from './env'
import { embedTexts } from './embeddings'
import { findNearestChunks } from './firestoreSearch'

// ── Prompt Profiles ────────────────────────────────────────────────

export type PromptProfile = 'bible-study' | 'general' | 'strict'

const SYSTEM_PROMPTS: Record<PromptProfile, string> = {
  'bible-study': `You are a knowledgeable Bible study assistant.
Use the provided sources as your primary reference for scripture text.
When sources contain relevant verses or passages, quote them accurately and provide thoughtful explanation, historical context, and interpretation using your general knowledge.
If the user asks about a topic not covered in the sources, clearly state: "This topic is not covered in the ingested documents." Then provide a helpful answer from your general knowledge, clearly labeled as "[General Knowledge]".
Always include a "Sources" section listing which SOURCE numbers you used. If you supplemented with general knowledge, note that.`,

  general: `You are a helpful research assistant.
Use the provided sources as your primary reference to answer questions.
When sources are relevant, ground your answer in them and supplement with your general knowledge for explanation and context.
If the sources contain no relevant information, clearly state: "No relevant documents found." Then provide a helpful answer from your general knowledge, clearly labeled as "[General Knowledge]".
Always include a "Sources" section listing which SOURCE numbers you used.`,

  strict: `You are a helpful assistant. Answer using ONLY the provided sources.
If sources are insufficient, say what is missing and suggest what to ingest next.
Do NOT use any outside knowledge.
Always include a "Sources" section listing which SOURCE numbers you used.`,
}

// ── Types ──────────────────────────────────────────────────────────

export interface RagOptions {
  question: string
  profile?: PromptProfile
  topK?: number
}

export interface SourceRef {
  sourceNo: number
  title?: string
  uri?: string
}

export interface RagResult {
  answer: string
  sources: SourceRef[]
  profile: PromptProfile
  chunksRetrieved: number
}

// ── Vertex AI Client ───────────────────────────────────────────────

function vertexClient(): GoogleGenAI {
  process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true'
  process.env.GOOGLE_CLOUD_PROJECT = ENV.projectId
  process.env.GOOGLE_CLOUD_LOCATION = ENV.location
  return new GoogleGenAI({})
}

// ── RAG Pipeline ───────────────────────────────────────────────────

export async function ragQuery(opts: RagOptions): Promise<RagResult> {
  const { question, profile = 'bible-study', topK = 6 } = opts
  const db = admin.firestore()

  // 1) Embed the user's question
  const [qVec] = await embedTexts([question])

  // 2) Retrieve nearest chunks from Firestore
  const nearest = await findNearestChunks(qVec, topK)

  // 3) Fetch parent doc metadata for citations
  const chunks: Array<{
    id: string
    text: string
    sourceUri?: string
    title?: string
  }> = []

  for (const chunk of nearest) {
    const docSnap = await db.doc(`docs/${chunk.docId}`).get()
    const doc = docSnap.data() as { sourceUri?: string; title?: string } | undefined
    chunks.push({
      id: chunk.id,
      text: chunk.text,
      sourceUri: doc?.sourceUri,
      title: doc?.title,
    })
  }

  // 4) Build context block from retrieved chunks
  const contextBlock = chunks
    .map(
      (c, i) =>
        `SOURCE ${i + 1}\nTitle: ${c.title || 'Untitled'}\nURI: ${c.sourceUri || 'unknown'}\nText:\n${c.text}`
    )
    .join('\n\n---\n\n')

  // 5) Select system prompt based on profile
  const system = SYSTEM_PROMPTS[profile]

  // 6) Call Gemini with grounded context
  const ai = vertexClient()
  const resp = await ai.models.generateContent({
    model: ENV.chatModel,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `SYSTEM:\n${system}\n\nCONTEXT:\n${contextBlock}\n\nQUESTION:\n${question}`,
          },
        ],
      },
    ],
  })

  // 7) Return structured result
  return {
    answer: resp.text ?? '',
    sources: chunks.map((c, i) => ({
      sourceNo: i + 1,
      title: c.title,
      uri: c.sourceUri,
    })),
    profile,
    chunksRetrieved: chunks.length,
  }
}
