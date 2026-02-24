import { z } from 'zod';
// ─── Shared types ─────────────────────────────────────────────────────────────
export const HighlightColorSchema = z.enum(['yellow', 'blue', 'green']).nullable();
// ─── Input schemas ────────────────────────────────────────────────────────────
export const UpsertAnnotationInputSchema = z.object({
    userId: z.string(),
    /** Full USFM address — e.g. "JHN.3.16" */
    usfm: z.string(),
    highlight: HighlightColorSchema.optional(),
    note: z.string().max(2000).optional(),
    /** Human-readable reference, e.g. "John 3:16" */
    reference: z.string().optional(),
    /** The verse text itself, for display in Diary tabs */
    verseText: z.string().optional(),
});
export const GetAnnotationsInputSchema = z.object({
    userId: z.string(),
    /** USFM book code — e.g. "JHN" */
    book: z.string(),
    chapter: z.number().int().min(1),
});
export const ListAnnotationsInputSchema = z.object({
    userId: z.string(),
});
export const DeleteAnnotationInputSchema = z.object({
    userId: z.string(),
    /** Full USFM address — e.g. "JHN.3.16" */
    usfm: z.string(),
});
// ─── Response schemas ─────────────────────────────────────────────────────────
export const AnnotationSchema = z.object({
    usfm: z.string(),
    highlight: HighlightColorSchema,
    note: z.string().nullable(),
    reference: z.string().nullable(),
    verseText: z.string().nullable(),
    createdAt: z.number(),
});
