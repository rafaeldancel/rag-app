import { z } from 'zod'

// ─── Input schemas ────────────────────────────────────────────────────────────

export const ListDiaryEntriesInputSchema = z.object({
  userId: z.string(),
})

export const CreateDiaryEntryInputSchema = z.object({
  userId: z.string(),
  title: z.string().min(1).max(200),
  text: z.string().min(1).max(5000),
})

export const UpdateDiaryEntryInputSchema = z.object({
  userId: z.string(),
  id: z.string(),
  title: z.string().min(1).max(200),
  text: z.string().min(1).max(5000),
})

export const DeleteDiaryEntryInputSchema = z.object({
  userId: z.string(),
  id: z.string(),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

export const AIInsightSchema = z.object({
  text: z.string(),
  verseRef: z.string().optional(),
  verseText: z.string().optional(),
})

export const DiaryEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  aiInsight: AIInsightSchema.nullable(),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ListDiaryEntriesInput = z.infer<typeof ListDiaryEntriesInputSchema>
export type CreateDiaryEntryInput = z.infer<typeof CreateDiaryEntryInputSchema>
export type UpdateDiaryEntryInput = z.infer<typeof UpdateDiaryEntryInputSchema>
export type DeleteDiaryEntryInput = z.infer<typeof DeleteDiaryEntryInputSchema>
export type AIInsight = z.infer<typeof AIInsightSchema>
export type DiaryEntry = z.infer<typeof DiaryEntrySchema>
