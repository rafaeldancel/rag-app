import * as admin from 'firebase-admin'
import { TRPCError } from '@trpc/server'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import {
  ListDiaryEntriesInputSchema,
  CreateDiaryEntryInputSchema,
  UpdateDiaryEntryInputSchema,
  DeleteDiaryEntryInputSchema,
  DiaryEntrySchema,
  AIInsightSchema,
  type AIInsight,
} from '@repo/shared'
import { ENV } from '../../env'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Call Gemini to generate a mentorship insight from a diary entry. */
async function generateInsight(text: string): Promise<AIInsight | null> {
  try {
    const ai = new GoogleGenAI({ vertexai: true, project: ENV.projectId, location: ENV.location })
    const prompt = [
      'Here is a personal journal entry written by a Christian seeking to grow in faith:',
      '',
      '<journal_entry>',
      text,
      '</journal_entry>',
      '',
      'As a compassionate Christian mentor, provide a brief response (2–3 sentences) that:',
      '1. Affirms what they have shared without being preachy or generic',
      '2. Connects it to one relevant scripture passage',
      '',
      'Reply with ONLY valid JSON in this shape (no markdown):',
      '{ "text": "your insight here", "verseRef": "Book Chapter:Verse", "verseText": "short verse quote" }',
    ].join('\n')

    const response = await ai.models.generateContent({
      model: ENV.chatModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = (response.text ?? '').trim()
    // Extract the first JSON object — handles extra text or markdown fences
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON object in Gemini response')
    const parsed = JSON.parse(match[0])
    return AIInsightSchema.parse(parsed)
  } catch (err) {
    console.error('[generateInsight] failed:', err)
    return null
  }
}

/** Converts a Firestore document snapshot to a DiaryEntry. */
function toEntry(id: string, data: admin.firestore.DocumentData) {
  return DiaryEntrySchema.parse({
    id,
    title: data.title ?? '',
    text: data.text ?? '',
    createdAt: (data.createdAt as admin.firestore.Timestamp)?.toMillis() ?? Date.now(),
    updatedAt: (data.updatedAt as admin.firestore.Timestamp)?.toMillis() ?? Date.now(),
    aiInsight: data.aiInsight ?? null,
  })
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const diaryRouter = router({
  /** List all diary entries for a user, newest first. */
  list: publicProcedure
    .input(ListDiaryEntriesInputSchema)
    .output(DiaryEntrySchema.array())
    .query(async ({ input }) => {
      const db = admin.firestore()
      const snap = await db
        .collection(`users/${input.userId}/diaryEntries`)
        .orderBy('createdAt', 'desc')
        .get()

      return snap.docs.map(d => toEntry(d.id, d.data()))
    }),

  /** Create a new diary entry and generate an AI insight. */
  create: publicProcedure
    .input(CreateDiaryEntryInputSchema)
    .output(DiaryEntrySchema)
    .mutation(async ({ input }) => {
      const db = admin.firestore()
      const now = admin.firestore.FieldValue.serverTimestamp()

      const ref = await db.collection(`users/${input.userId}/diaryEntries`).add({
        title: input.title,
        text: input.text,
        aiInsight: null,
        createdAt: now,
        updatedAt: now,
      })

      const insight = await generateInsight(input.text)

      if (insight) {
        await ref.update({ aiInsight: insight })
      }

      const snap = await ref.get()
      if (!snap.exists) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to read created entry.',
        })
      }
      return toEntry(snap.id, snap.data()!)
    }),

  /** Update an existing diary entry and regenerate the AI insight. */
  update: publicProcedure
    .input(UpdateDiaryEntryInputSchema)
    .output(DiaryEntrySchema)
    .mutation(async ({ input }) => {
      const db = admin.firestore()
      const ref = db.doc(`users/${input.userId}/diaryEntries/${input.id}`)
      const existing = await ref.get()

      if (!existing.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Diary entry not found.' })
      }

      await ref.update({
        title: input.title,
        text: input.text,
        aiInsight: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      const insight = await generateInsight(input.text)
      if (insight) {
        await ref.update({ aiInsight: insight })
      }

      const snap = await ref.get()
      if (!snap.exists) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Diary entry not found after update.' })
      }
      return toEntry(snap.id, snap.data()!)
    }),

  /** Delete a diary entry. Returns the deleted entry's id. */
  delete: publicProcedure
    .input(DeleteDiaryEntryInputSchema)
    .output(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = admin.firestore()
      await db.doc(`users/${input.userId}/diaryEntries/${input.id}`).delete()
      return { id: input.id }
    }),
})
