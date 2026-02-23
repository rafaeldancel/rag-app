import { z } from 'zod'

// ─── Shared types ─────────────────────────────────────────────────────────────

export const HighlightColorSchema = z.enum(['yellow', 'blue', 'green']).nullable()

// ─── Input schemas ────────────────────────────────────────────────────────────

export const UpsertAnnotationInputSchema = z.object({
  userId: z.string(),
  /** Full USFM address — e.g. "JHN.3.16" */
  usfm: z.string(),
  highlight: HighlightColorSchema.optional(),
  note: z.string().max(2000).optional(),
})

export const GetAnnotationsInputSchema = z.object({
  userId: z.string(),
  /** USFM book code — e.g. "JHN" */
  book: z.string(),
  chapter: z.number().int().min(1),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

export const AnnotationSchema = z.object({
  usfm: z.string(),
  highlight: HighlightColorSchema,
  note: z.string().nullable(),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type HighlightColor = z.infer<typeof HighlightColorSchema>
export type UpsertAnnotationInput = z.infer<typeof UpsertAnnotationInputSchema>
export type GetAnnotationsInput = z.infer<typeof GetAnnotationsInputSchema>
export type Annotation = z.infer<typeof AnnotationSchema>
