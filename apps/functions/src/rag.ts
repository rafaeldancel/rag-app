import * as admin from 'firebase-admin'
import { GoogleGenAI } from '@google/genai'
import { ENV } from './env'
import { embedTexts } from './embeddings'
import { findNearestChunks } from './firestoreSearch'
import { lookupBook, formatAPA } from './bookCatalog'

// ── Prompt Profiles ────────────────────────────────────────────────

export type PromptProfile = 'bible-study' | 'general' | 'strict'

const CITATION_INSTRUCTION = `CITATIONS: Cite sources inline using author last name and year: (Craig, 2008) or (Josephus, c. 93 CE). Do NOT add a separate "Sources" section — sources are displayed in the UI automatically.`

// Guardrail applied to the bible-study profile.
// Medical questions are redirected to empathy + scripture — never answered directly.
const MEDICAL_GUARDRAIL = `MEDICAL GUARDRAIL: If the user's message involves medical symptoms, diagnoses, treatments, medications, mental health crises, or any healthcare guidance:
1. Open your response with this exact line:
   "[Out of Scope] Medical questions are outside what I'm designed to help with. Please consult a qualified healthcare professional or, in an emergency, call emergency services."
2. Follow immediately with genuine empathy — acknowledge the difficulty of what they are facing in 1–2 warm sentences.
3. Then offer 1–2 comforting Bible verses directly relevant to their situation (e.g., healing, fear, suffering, God's nearness in pain, hope, peace). Introduce them naturally and cite inline as (Author, Year).
4. Do NOT answer the medical question itself, suggest remedies, interpret symptoms, or recommend any course of action beyond seeking professional care.`

const SYSTEM_PROMPTS: Record<PromptProfile, string> = {
  'bible-study': `You are Logos — a trusted Bible study and Christian faith assistant.

Your purpose is to help users explore scripture, deepen their faith, understand Christian theology and apologetics, and find spiritual guidance.

PRIMARY BEHAVIOR:
- Use the provided sources as your primary reference. Quote scripture accurately and cite inline.
- When sources contain relevant passages, provide thoughtful explanation, historical context, and interpretation.
- You may freely draw on your broader knowledge to explain, contextualize, or supplement the sources — no need to label or caveat this.

${MEDICAL_GUARDRAIL}

${CITATION_INSTRUCTION}`,

  general: `You are a helpful research assistant.
Use the provided sources as your primary reference to answer questions.
When sources are relevant, ground your answer in them and supplement with your general knowledge for explanation and context.
You may freely use your broader knowledge — no need to label or flag it.

${CITATION_INSTRUCTION}`,

  strict: `You are a helpful assistant. Answer using ONLY the provided sources.
If sources are insufficient, say what is missing and suggest what to ingest next.
Do NOT use any outside knowledge.
${CITATION_INSTRUCTION}`,
}

// ── Types ──────────────────────────────────────────────────────────

export interface RagOptions {
  question: string
  profile?: PromptProfile
  topK?: number
}

export interface SourceRef {
  sourceNo: number
  /** Raw slug title from Firestore */
  title?: string
  /** gs:// URI — internal only */
  uri?: string
  /** Full book/work title, e.g. "Reasonable Faith" */
  fullTitle?: string
  /** APA-formatted author string, e.g. "Craig, W. L." */
  authorFormatted?: string
  /** Publication year, e.g. "2008" or "c. 93 CE" */
  year?: string
  publisher?: string
  /** Public URL for reading/previewing the source */
  url?: string
  /** Complete APA citation string */
  apa?: string
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

  // 3) Fetch parent doc metadata and enrich with catalog
  const chunks: Array<{
    id: string
    text: string
    docId: string
    sourceUri?: string
    title?: string
    author?: string
    fullTitle?: string
    authorFormatted?: string
    year?: string
    publisher?: string
    url?: string
    apa?: string
  }> = []

  for (const chunk of nearest) {
    const docSnap = await db.doc(`docs/${chunk.docId}`).get()
    const doc = docSnap.data() as
      | {
          sourceUri?: string
          title?: string
          author?: string
        }
      | undefined

    const catalog = doc?.author && doc?.title ? lookupBook(doc.author, doc.title) : null

    chunks.push({
      id: chunk.id,
      text: chunk.text,
      docId: chunk.docId,
      sourceUri: doc?.sourceUri,
      title: doc?.title,
      author: doc?.author,
      fullTitle: catalog?.fullTitle,
      authorFormatted: catalog?.authorFormatted,
      year: catalog?.year,
      publisher: catalog?.publisher,
      url: catalog?.url,
      apa: catalog ? formatAPA(catalog) : undefined,
    })
  }

  // 4) Deduplicate by docId so one book = one SOURCE number
  const seenDocIds = new Set<string>()
  const uniqueDocs: typeof chunks = []
  for (const chunk of chunks) {
    if (!seenDocIds.has(chunk.docId)) {
      seenDocIds.add(chunk.docId)
      uniqueDocs.push(chunk)
    }
  }
  const docIdToSourceNo = new Map(uniqueDocs.map((d, i) => [d.docId, i + 1]))

  // 5) Build context block — all chunks, grouped under their source number
  const contextBlock = chunks
    .map(c => {
      const sourceNo = docIdToSourceNo.get(c.docId)!
      const citation = c.apa ?? `${c.author ?? 'Unknown'}, ${c.title ?? 'Untitled'}`
      return `SOURCE ${sourceNo}\nCitation: ${citation}\nText:\n${c.text}`
    })
    .join('\n\n---\n\n')

  // 6) Call Gemini with grounded context
  const ai = vertexClient()
  const resp = await ai.models.generateContent({
    model: ENV.chatModel,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `SYSTEM:\n${SYSTEM_PROMPTS[profile]}\n\nCONTEXT:\n${contextBlock}\n\nQUESTION:\n${question}`,
          },
        ],
      },
    ],
  })

  // 7) Build deduplicated SourceRef list for the frontend
  const sources: SourceRef[] = uniqueDocs.map((d, i) => ({
    sourceNo: i + 1,
    title: d.title,
    uri: d.sourceUri,
    fullTitle: d.fullTitle,
    authorFormatted: d.authorFormatted,
    year: d.year,
    publisher: d.publisher,
    url: d.url,
    apa: d.apa,
  }))

  return {
    answer: resp.text ?? '',
    sources,
    profile,
    chunksRetrieved: chunks.length,
  }
}
