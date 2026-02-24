import * as admin from 'firebase-admin'
import { router, publicProcedure } from '../trpc'
import {
  UpsertAnnotationInputSchema,
  GetAnnotationsInputSchema,
  ListAnnotationsInputSchema,
  DeleteAnnotationInputSchema,
  AnnotationSchema,
} from '@repo/shared'

// ─── Router ───────────────────────────────────────────────────────────────────

export const annotationsRouter = router({
  /**
   * Create or update a verse annotation (highlight + note).
   * Stored at: users/{userId}/annotations/{usfm}
   * createdAt is set only on first write; reference is stored if provided.
   */
  upsert: publicProcedure
    .input(UpsertAnnotationInputSchema)
    .output(AnnotationSchema)
    .mutation(async ({ input }) => {
      const db = admin.firestore()
      const docId = input.usfm.replace(/\./g, '_') // "JHN_3_16"
      const ref = db.doc(`users/${input.userId}/annotations/${docId}`)

      const existing = (await ref.get()).data()
      const now = Date.now()

      const update: Record<string, unknown> = {
        usfm: input.usfm,
        updatedAt: now,
      }
      // Preserve createdAt from first write
      if (!existing?.createdAt) update.createdAt = now
      if (input.highlight !== undefined) update.highlight = input.highlight
      if (input.note !== undefined) update.note = input.note
      if (input.reference !== undefined) update.reference = input.reference
      if (input.verseText !== undefined) update.verseText = input.verseText

      await ref.set(update, { merge: true })

      const snap = await ref.get()
      const data = snap.data()!

      return AnnotationSchema.parse({
        usfm: data.usfm ?? input.usfm,
        highlight: data.highlight ?? null,
        note: data.note ?? null,
        reference: data.reference ?? null,
        verseText: data.verseText ?? null,
        createdAt: data.createdAt ?? now,
      })
    }),

  /**
   * Get all annotations for a given book + chapter.
   */
  getForChapter: publicProcedure
    .input(GetAnnotationsInputSchema)
    .output(AnnotationSchema.array())
    .query(async ({ input }) => {
      const db = admin.firestore()
      const prefix = `${input.book}.${input.chapter}.`

      const snap = await db
        .collection(`users/${input.userId}/annotations`)
        .where('usfm', '>=', prefix)
        .where('usfm', '<', prefix + '\uffff')
        .get()

      return snap.docs.map(d => {
        const data = d.data()
        return AnnotationSchema.parse({
          usfm: data.usfm ?? '',
          highlight: data.highlight ?? null,
          note: data.note ?? null,
          reference: data.reference ?? null,
          verseText: data.verseText ?? null,
          createdAt: data.createdAt ?? 0,
        })
      })
    }),

  /**
   * List all annotations for a user, ordered by newest first.
   */
  listAll: publicProcedure
    .input(ListAnnotationsInputSchema)
    .output(AnnotationSchema.array())
    .query(async ({ input }) => {
      const db = admin.firestore()

      const snap = await db
        .collection(`users/${input.userId}/annotations`)
        .orderBy('createdAt', 'desc')
        .get()

      return snap.docs.map(d => {
        const data = d.data()
        return AnnotationSchema.parse({
          usfm: data.usfm ?? '',
          highlight: data.highlight ?? null,
          note: data.note ?? null,
          reference: data.reference ?? null,
          verseText: data.verseText ?? null,
          createdAt: data.createdAt ?? 0,
        })
      })
    }),

  /**
   * Delete a single annotation by USFM address.
   */
  delete: publicProcedure
    .input(DeleteAnnotationInputSchema)
    .output(DeleteAnnotationInputSchema.pick({ usfm: true }))
    .mutation(async ({ input }) => {
      const db = admin.firestore()
      const docId = input.usfm.replace(/\./g, '_')
      await db.doc(`users/${input.userId}/annotations/${docId}`).delete()
      return { usfm: input.usfm }
    }),
})
