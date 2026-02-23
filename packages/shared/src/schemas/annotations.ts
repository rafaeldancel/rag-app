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
  /** Human-readable reference, e.g. "John 3:16" */
  reference: z.string().optional(),
})

export const GetAnnotationsInputSchema = z.object({
  userId: z.string(),
  /** USFM book code — e.g. "JHN" */
  book: z.string(),
  chapter: z.number().int().min(1),
})

export const ListAnnotationsInputSchema = z.object({
  userId: z.string(),
})

export const DeleteAnnotationInputSchema = z.object({
  userId: z.string(),
  /** Full USFM address — e.g. "JHN.3.16" */
  usfm: z.string(),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

export const AnnotationSchema = z.object({
  usfm: z.string(),
  highlight: HighlightColorSchema,
  note: z.string().nullable(),
  reference: z.string().nullable(),
  createdAt: z.number(),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type HighlightColor = z.infer<typeof HighlightColorSchema>
export type UpsertAnnotationInput = z.infer<typeof UpsertAnnotationInputSchema>
export type GetAnnotationsInput = z.infer<typeof GetAnnotationsInputSchema>
export type ListAnnotationsInput = z.infer<typeof ListAnnotationsInputSchema>
export type DeleteAnnotationInput = z.infer<typeof DeleteAnnotationInputSchema>
export type Annotation = z.infer<typeof AnnotationSchema>
