import { z } from 'zod'

// ─── Shared field validators ───────────────────────────────────────────────────

/** Firebase UID — no forward slashes to prevent Firestore path injection. */
const UserIdSchema = z
  .string()
  .min(1)
  .max(128)
  .refine(s => !s.includes('/'), 'Invalid user ID')

// ─── Input schemas ────────────────────────────────────────────────────────────

export const ListDiaryEntriesInputSchema = z.object({
  userId: UserIdSchema,
})

export const CreateDiaryEntryInputSchema = z.object({
  userId: UserIdSchema,
  title: z.string().min(1).max(200),
  text: z.string().min(1).max(5000),
})

export const UpdateDiaryEntryInputSchema = z.object({
  userId: UserIdSchema,
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(200),
  text: z.string().min(1).max(5000),
})

export const DeleteDiaryEntryInputSchema = z.object({
  userId: UserIdSchema,
  id: z.string().min(1).max(128),
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
