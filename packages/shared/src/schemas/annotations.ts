import { z } from 'zod'

// ─── Shared types ─────────────────────────────────────────────────────────────

export const HighlightColorSchema = z.enum(['yellow', 'red', 'blue', 'green']).nullable()

// ─── Input schemas ────────────────────────────────────────────────────────────

export const UpsertAnnotationInputSchema = z.object({
  userId: z
    .string()
    .min(1)
    .max(128)
    .refine(s => !s.includes('/'), 'Invalid user ID'),
  /** Full USFM address — e.g. "JHN.3.16" */
  usfm: z.string().regex(/^[A-Z0-9]{2,4}\.\d{1,3}(\.\d{1,3})?$/, 'Invalid USFM format'),
  highlight: HighlightColorSchema.optional(),
  note: z.string().max(2000).optional(),
  /** Human-readable reference, e.g. "John 3:16" */
  reference: z.string().optional(),
  /** The verse text itself, for display in Diary tabs */
  verseText: z.string().optional(),
})

export const GetAnnotationsInputSchema = z.object({
  userId: z
    .string()
    .min(1)
    .max(128)
    .refine(s => !s.includes('/'), 'Invalid user ID'),
  /** USFM book code — e.g. "JHN" */
  book: z.string().regex(/^[A-Z0-9]{2,4}$/, 'Invalid USFM book code'),
  chapter: z.number().int().min(1).max(150),
})

export const ListAnnotationsInputSchema = z.object({
  userId: z
    .string()
    .min(1)
    .max(128)
    .refine(s => !s.includes('/'), 'Invalid user ID'),
})

export const DeleteAnnotationInputSchema = z.object({
  userId: z
    .string()
    .min(1)
    .max(128)
    .refine(s => !s.includes('/'), 'Invalid user ID'),
  /** Full USFM address — e.g. "JHN.3.16" */
  usfm: z.string().regex(/^[A-Z0-9]{2,4}\.\d{1,3}(\.\d{1,3})?$/, 'Invalid USFM format'),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

export const AnnotationSchema = z.object({
  usfm: z.string(),
  highlight: HighlightColorSchema,
  note: z.string().nullable(),
  reference: z.string().nullable(),
  verseText: z.string().nullable(),
  createdAt: z.number(),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type HighlightColor = z.infer<typeof HighlightColorSchema>
export type UpsertAnnotationInput = z.infer<typeof UpsertAnnotationInputSchema>
export type GetAnnotationsInput = z.infer<typeof GetAnnotationsInputSchema>
export type ListAnnotationsInput = z.infer<typeof ListAnnotationsInputSchema>
export type DeleteAnnotationInput = z.infer<typeof DeleteAnnotationInputSchema>
export type Annotation = z.infer<typeof AnnotationSchema>
