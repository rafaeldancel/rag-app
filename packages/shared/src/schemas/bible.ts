import { z } from 'zod'

// ─── Version registry ─────────────────────────────────────────────────────────

/** YouVersion version IDs for the translations the app supports. */
export const BIBLE_VERSIONS = {
  BSB: 3034, // Berean Standard Bible — modern, free
  NIV: 111, // New International Version 2011
  WEB: 206, // World English Bible — public domain
} as const

export type BibleVersionKey = keyof typeof BIBLE_VERSIONS

// ─── Input schemas ────────────────────────────────────────────────────────────

export const GetBooksInputSchema = z.object({
  /** YouVersion version ID. Defaults to ESV (59). */
  versionId: z.number().int().positive().default(BIBLE_VERSIONS.ESV),
})

export const GetVotdInputSchema = z.object({
  /** YouVersion version ID. Defaults to ESV (59). */
  versionId: z.number().int().positive().default(BIBLE_VERSIONS.ESV),
})

export const GetChapterInputSchema = z.object({
  /** USFM book code — e.g. "JHN", "GEN", "1KI" */
  book: z.string().min(2).max(5),
  chapter: z.number().int().min(1),
  /** YouVersion version ID. Defaults to ESV (59). */
  versionId: z.number().int().positive().default(BIBLE_VERSIONS.ESV),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

export const BibleBookSchema = z.object({
  /** USFM book code — e.g. "GEN", "JHN" */
  usfm: z.string(),
  /** Human-readable name — e.g. "Genesis", "John" */
  name: z.string(),
  abbreviation: z.string(),
  chapterCount: z.number().int().min(1),
  /** "OT" | "NT" | "DC" */
  canon: z.string(),
})

export const BibleVerseSchema = z.object({
  /** Verse number within the chapter. */
  number: z.number(),
  /** Full USFM address — e.g. "JHN.3.16" */
  usfm: z.string(),
  text: z.string(),
})

export const BibleChapterSchema = z.object({
  /** Human-readable reference — e.g. "John 3" */
  reference: z.string(),
  /** USFM book code — e.g. "JHN" */
  book: z.string(),
  chapter: z.number(),
  versionId: z.number(),
  verses: z.array(BibleVerseSchema),
  /** Translation copyright notice required by YouVersion terms. */
  copyright: z.string(),
})

export const VotdSchema = z.object({
  /** Human-readable reference — e.g. "John 3:16" */
  reference: z.string(),
  text: z.string(),
  /** Full USFM address — used to link to the Bible reader. */
  usfm: z.string(),
  /** USFM book code — e.g. "JHN" */
  book: z.string(),
  chapter: z.number(),
  copyright: z.string(),
})

export const DailyPrayerSchema = z.object({
  text: z.string(),
  /** The VOTD reference this prayer is based on. */
  basedOn: z.string(),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type GetBooksInput = z.infer<typeof GetBooksInputSchema>
export type GetVotdInput = z.infer<typeof GetVotdInputSchema>
export type GetChapterInput = z.infer<typeof GetChapterInputSchema>
export type BibleBook = z.infer<typeof BibleBookSchema>
export type BibleVerse = z.infer<typeof BibleVerseSchema>
export type BibleChapter = z.infer<typeof BibleChapterSchema>
export type Votd = z.infer<typeof VotdSchema>
export type DailyPrayer = z.infer<typeof DailyPrayerSchema>
