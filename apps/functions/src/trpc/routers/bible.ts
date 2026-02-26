import { TRPCError } from '@trpc/server'
import { GoogleGenAI } from '@google/genai'
import { router, publicProcedure } from '../trpc'
import {
  GetBooksInputSchema,
  GetVotdInputSchema,
  GetChapterInputSchema,
  BibleBookSchema,
  VotdSchema,
  BibleChapterSchema,
  DailyPrayerSchema,
  type BibleVerse,
} from '@repo/shared'
import { ENV } from '../../env'

// ─── Constants ────────────────────────────────────────────────────────────────

const YOUVERSION_BASE = 'https://api.youversion.com/v1'

/**
 * Curated rotating Verse of the Day list.
 * The VOTD endpoint is not included in the free developer plan, so we rotate
 * through a hand-picked set of well-known scriptures by week of year.
 */
const CURATED_VERSES = [
  'JHN.3.16',
  'PSA.23.1',
  'ROM.8.28',
  'PHP.4.13',
  'JER.29.11',
  'ISA.40.31',
  'PRO.3.5',
  'MAT.6.33',
  'PSA.46.1',
  'JHN.14.6',
  'MAT.11.28',
  'GAL.5.22',
  'ROM.5.8',
  'PSA.119.105',
  'EPH.2.8',
  'HEB.11.1',
  'ISA.41.10',
  '1CO.10.13',
  'MAT.5.16',
  'ROM.12.2',
  'PHP.4.7',
  'PSA.37.4',
  'JHN.10.10',
  'HEB.13.8',
  'PRO.22.6',
  'MAT.28.19',
  'EPH.6.10',
  'PSA.139.14',
  '1PE.5.7',
  'ROM.3.23',
  'JHN.1.1',
  'GEN.1.1',
  'REV.21.4',
  'ISA.53.5',
  'MAT.22.37',
  'JHN.15.13',
  'PHP.1.6',
  'ROM.1.16',
  'PSA.91.1',
  'ISA.26.3',
  'JHN.8.32',
  '2TI.3.16',
  'HEB.4.12',
  'PSA.27.1',
  'ROM.10.9',
  'PHP.4.19',
  'COL.3.23',
  '1JN.4.19',
  'ROM.8.38',
  'PSA.34.8',
  'MAT.6.9',
  'JHN.16.33',
]

/** Maps USFM book codes to human-readable names for the VOTD reference line. */
const BOOK_NAMES: Record<string, string> = {
  GEN: 'Genesis',
  EXO: 'Exodus',
  LEV: 'Leviticus',
  NUM: 'Numbers',
  DEU: 'Deuteronomy',
  JOS: 'Joshua',
  JDG: 'Judges',
  RUT: 'Ruth',
  '1SA': '1 Samuel',
  '2SA': '2 Samuel',
  '1KI': '1 Kings',
  '2KI': '2 Kings',
  '1CH': '1 Chronicles',
  '2CH': '2 Chronicles',
  EZR: 'Ezra',
  NEH: 'Nehemiah',
  EST: 'Esther',
  JOB: 'Job',
  PSA: 'Psalm',
  PRO: 'Proverbs',
  ECC: 'Ecclesiastes',
  SNG: 'Song of Solomon',
  ISA: 'Isaiah',
  JER: 'Jeremiah',
  LAM: 'Lamentations',
  EZK: 'Ezekiel',
  DAN: 'Daniel',
  HOS: 'Hosea',
  JOL: 'Joel',
  AMO: 'Amos',
  OBA: 'Obadiah',
  JON: 'Jonah',
  MIC: 'Micah',
  NAM: 'Nahum',
  HAB: 'Habakkuk',
  ZEP: 'Zephaniah',
  HAG: 'Haggai',
  ZEC: 'Zechariah',
  MAL: 'Malachi',
  MAT: 'Matthew',
  MRK: 'Mark',
  LUK: 'Luke',
  JHN: 'John',
  ACT: 'Acts',
  ROM: 'Romans',
  '1CO': '1 Corinthians',
  '2CO': '2 Corinthians',
  GAL: 'Galatians',
  EPH: 'Ephesians',
  PHP: 'Philippians',
  COL: 'Colossians',
  '1TH': '1 Thessalonians',
  '2TH': '2 Thessalonians',
  '1TI': '1 Timothy',
  '2TI': '2 Timothy',
  TIT: 'Titus',
  PHM: 'Philemon',
  HEB: 'Hebrews',
  JAM: 'James',
  '1PE': '1 Peter',
  '2PE': '2 Peter',
  '1JN': '1 John',
  '2JN': '2 John',
  '3JN': '3 John',
  JUD: 'Jude',
  REV: 'Revelation',
}

/** Maps YouVersion canon strings to short codes. */
const CANON_MAP: Record<string, string> = {
  old_testament: 'OT',
  new_testament: 'NT',
  deuterocanon: 'DC',
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.YOUVERSION_API_KEY
  if (!key) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'YouVersion API key is not configured.',
    })
  }
  return key
}

/** Returns the current week of year (0–51) to rotate VOTD. */
function getWeekOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
  return Math.floor(dayOfYear / 7) % CURATED_VERSES.length
}

/** Parses a USFM address like "JHN.3.16" into its components. */
function parseUsfm(usfm: string): { book: string; chapter: number; verse?: number } {
  const [book, ch, vs] = usfm.split('.')
  return { book, chapter: parseInt(ch ?? '1'), verse: vs ? parseInt(vs) : undefined }
}

/**
 * Builds a human-readable reference from a USFM address.
 * "JHN.3.16" → "John 3:16", "PSA.23.1" → "Psalm 23:1"
 */
function usfmToReference(usfm: string): string {
  const { book, chapter, verse } = parseUsfm(usfm)
  const name = BOOK_NAMES[book] ?? book
  return verse ? `${name} ${chapter}:${verse}` : `${name} ${chapter}`
}

/**
 * Parses YouVersion HTML passage content into verse objects.
 * HTML structure: <span class="yv-vlbl">N</span>verse text...
 */
function parseVerses(html: string, book: string, chapter: number): BibleVerse[] {
  // Split on verse number label spans — the captured group gives the verse number.
  const parts = html.split(/<span[^>]*class="yv-vlbl"[^>]*>(\d+)<\/span>/)
  const verses: BibleVerse[] = []

  for (let i = 1; i < parts.length; i += 2) {
    const number = parseInt(parts[i])
    const text = (parts[i + 1] ?? '')
      .replace(/<[^>]+>/g, '') // strip all remaining HTML tags
      .replace(/\s+/g, ' ')
      .trim()
    if (!isNaN(number) && text) {
      verses.push({ number, usfm: `${book}.${chapter}.${number}`, text })
    }
  }

  return verses
}

/** Authenticated fetch wrapper for the YouVersion Platform API. */
async function youversionFetch(path: string): Promise<unknown> {
  const url = `${YOUVERSION_BASE}${path}`

  // 10 s timeout — prevents the Cloud Function hanging on a slow upstream
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)

  let res: Response
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'x-yvp-app-key': getApiKey(),
        Accept: 'application/json',
      },
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Bible API request timed out.',
      })
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    // Log full upstream details server-side only; send a generic message to the client
    const body = await res.text().catch(() => '(unreadable)')
    console.error(`[YouVersion] ${res.status} ${url}\nBody: ${body}`)
    throw new TRPCError({
      code: res.status === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR',
      message: res.status === 404 ? 'Bible passage not found.' : 'Failed to fetch Bible passage.',
    })
  }

  return res.json()
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const bibleRouter = router({
  /**
   * Returns all books in a Bible version with their chapter counts.
   * Cached for 7 days on the client — book structure never changes.
   */
  getBooks: publicProcedure
    .input(GetBooksInputSchema)
    .output(BibleBookSchema.array())
    .query(async ({ input }) => {
      const data = (await youversionFetch(`/bibles/${input.versionId}/books`)) as {
        data?: Array<{
          id?: string
          title?: string
          abbreviation?: string
          canon?: string
          chapters?: Array<unknown>
        }>
      }

      return (data.data ?? []).map(b =>
        BibleBookSchema.parse({
          usfm: b.id ?? '',
          name: b.title ?? BOOK_NAMES[b.id ?? ''] ?? b.id ?? '',
          abbreviation: b.abbreviation ?? b.id ?? '',
          chapterCount: b.chapters?.length ?? 1,
          canon: CANON_MAP[b.canon ?? ''] ?? 'OT',
        })
      )
    }),

  /**
   * Returns today's Verse of the Day from a curated rotating list.
   * (The YouVersion VOTD endpoint requires a separate plan tier.)
   */
  getVOTD: publicProcedure
    .input(GetVotdInputSchema)
    .output(VotdSchema)
    .query(async ({ input }) => {
      const usfm = CURATED_VERSES[getWeekOfYear()]
      const { book, chapter } = parseUsfm(usfm)

      const data = (await youversionFetch(`/bibles/${input.versionId}/passages/${usfm}`)) as {
        id?: string
        content?: string
        copyright?: string
      }

      return VotdSchema.parse({
        reference: usfmToReference(usfm),
        text: (data.content ?? '')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
        usfm,
        book,
        chapter,
        copyright: data.copyright ?? '',
      })
    }),

  /**
   * Returns a full chapter as an array of verse objects.
   */
  getChapter: publicProcedure
    .input(GetChapterInputSchema)
    .output(BibleChapterSchema)
    .query(async ({ input }) => {
      const { book, chapter, versionId } = input

      const data = (await youversionFetch(
        `/bibles/${versionId}/passages/${book}.${chapter}?format=html`
      )) as { id?: string; content?: string; copyright?: string }

      if (!data.content) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Chapter not found.' })
      }

      const verses = parseVerses(data.content, book, chapter)

      if (verses.length === 0) {
        console.error(
          '[YouVersion] parseVerses returned 0 verses. Raw content (first 300):',
          data.content.slice(0, 300)
        )
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to parse chapter verses — YouVersion HTML structure may have changed.',
        })
      }

      return BibleChapterSchema.parse({
        reference: usfmToReference(`${book}.${chapter}`),
        book,
        chapter,
        versionId,
        verses,
        copyright: data.copyright ?? '',
      })
    }),

  /**
   * Generates a contemplative prayer based on today's curated verse using Gemini.
   */
  getDailyPrayer: publicProcedure
    .input(GetVotdInputSchema)
    .output(DailyPrayerSchema)
    .query(async ({ input }) => {
      const usfm = CURATED_VERSES[getWeekOfYear()]
      const reference = usfmToReference(usfm)

      const data = (await youversionFetch(`/bibles/${input.versionId}/passages/${usfm}`)) as {
        content?: string
      }

      const verseText = (data.content ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      const ai = new GoogleGenAI({ vertexai: true, project: ENV.projectId, location: ENV.location })
      const prompt = [
        `Scripture: "${verseText}" — ${reference}`,
        '',
        'Write a brief, personal, and non-preachy prayer (3–4 sentences) for quiet reflection.',
        'Do not open with a greeting. Start directly with the prayer.',
        'Tone: honest, contemplative, grounded — not performative.',
      ].join('\n')

      const response = await ai.models.generateContent({
        model: ENV.chatModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })

      return DailyPrayerSchema.parse({
        text: response.text ?? '',
        basedOn: reference,
      })
    }),
})
