import * as admin from 'firebase-admin'
import { onObjectFinalized } from 'firebase-functions/v2/storage'
import { Storage } from '@google-cloud/storage'
import { createRequire } from 'module'
import { chunkText } from './chunking'
import { embedTexts } from './embeddings'
import { batchStoreChunks } from './firestoreSearch'

// createRequire lets us load the pdf-parse internal module directly, bypassing
// its startup self-test which breaks on Node 22 (module.parent is deprecated).

const storage = new Storage()

// ── Metadata extraction from filename ──────────────────────────────

interface DocMetadata {
  tier: string
  category: string
  author: string
  title: string
}

function parseFilename(filePath: string): DocMetadata {
  const filename = (filePath.split('/').pop() ?? filePath)
    .replace('.pdf', '')
    .replace('.txt', '')
    .replace('.md', '')
    .replace('.json', '')
  const parts = filename.split('_')

  if (parts.length >= 4) {
    return {
      tier: parts[0],
      category: parts[1],
      author: parts[2],
      title: parts.slice(3).join(' '),
    }
  }

  // Fallback for files that don't follow the convention
  return {
    tier: 'unclassified',
    category: 'general',
    author: 'unknown',
    title: filename,
  }
}

// ── PDF text extraction ────────────────────────────────────────────

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const _require = createRequire(import.meta.url)
  const pdfParse = _require('pdf-parse/lib/pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
  const data = await pdfParse(buffer)
  return data.text
}

// ── Batch helper for large documents ───────────────────────────────

async function batchEmbed(texts: string[], batchSize = 20): Promise<number[][]> {
  const allVectors: number[][] = []
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const vectors = await embedTexts(batch)
    allVectors.push(...vectors)
    console.log(
      `Embedded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`
    )
  }
  return allVectors
}

// ── Cloud Storage trigger ──────────────────────────────────────────

export const ingestFromGcs = onObjectFinalized(
  {
    region: 'us-central1',
    bucket: 'logos-91c8e-rag-docs',
    timeoutSeconds: 540,
    memory: '1GiB',
  },
  async event => {
    const db = admin.firestore()
    const filePath = event.data.name
    const bucketName = event.data.bucket

    if (!filePath.match(/\.(txt|md|json|pdf)$/)) {
      console.log(`Skipping unsupported file type: ${filePath}`)
      return
    }

    console.log(`Starting ingestion: ${filePath}`)

    const file = storage.bucket(bucketName).file(filePath)
    const [contents] = await file.download()

    // Extract text based on file type
    let raw: string
    if (filePath.endsWith('.pdf')) {
      raw = await extractTextFromPdf(contents)
    } else {
      raw = contents.toString('utf-8')
    }

    if (!raw.trim()) {
      console.error(`No text extracted from ${filePath}`)
      return
    }

    // Parse metadata from filename
    const meta = parseFilename(filePath)

    const docRef = await db.collection('docs').add({
      sourceType: 'gcs',
      sourceUri: `gs://${bucketName}/${filePath}`,
      title: meta.title,
      author: meta.author,
      tier: meta.tier,
      category: meta.category,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const chunks = chunkText(raw)
    console.log(`Chunked ${filePath} into ${chunks.length} chunks`)

    // Embed in batches to avoid API rate limits
    const vectors = await batchEmbed(chunks)

    // Store in batches of 400 (Firestore limit is 500 per batch)
    for (let i = 0; i < chunks.length; i += 400) {
      const batchChunks = chunks.slice(i, i + 400).map((text, j) => ({
        text,
        vector: vectors[i + j],
      }))
      await batchStoreChunks(docRef.id, batchChunks, i)
      console.log(`Stored batch ${Math.floor(i / 400) + 1}/${Math.ceil(chunks.length / 400)}`)
    }

    console.log(`Ingested ${chunks.length} chunks from ${filePath} [${meta.category}/${meta.tier}]`)
  }
)
