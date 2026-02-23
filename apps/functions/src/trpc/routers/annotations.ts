import * as admin from 'firebase-admin'
import { router, publicProcedure } from '../trpc'
import {
  UpsertAnnotationInputSchema,
  GetAnnotationsInputSchema,
  AnnotationSchema,
} from '@repo/shared'

// ─── Router ───────────────────────────────────────────────────────────────────

export const annotationsRouter = router({
  /**
   * Create or update a verse annotation (highlight + note).
   * Stored at: users/{userId}/annotations/{usfm}
   */
  upsert: publicProcedure
    .input(UpsertAnnotationInputSchema)
    .output(AnnotationSchema)
    .mutation(async ({ input }) => {
      const db = admin.firestore()
      const docId = input.usfm.replace(/\./g, '_') // "JHN_3_16"
      const ref = db.doc(`users/${input.userId}/annotations/${docId}`)

      const update: Record<string, unknown> = {
        usfm: input.usfm,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
      if (input.highlight !== undefined) update.highlight = input.highlight
      if (input.note !== undefined) update.note = input.note

      await ref.set(update, { merge: true })

      const snap = await ref.get()
      const data = snap.data()!

      return AnnotationSchema.parse({
        usfm: data.usfm ?? input.usfm,
        highlight: data.highlight ?? null,
        note: data.note ?? null,
      })
    }),

  /**
   * Get all annotations for a given book + chapter.
   * Returns a record keyed by USFM address (e.g. "JHN.3.16").
   */
  getForChapter: publicProcedure
    .input(GetAnnotationsInputSchema)
    .output(AnnotationSchema.array())
    .query(async ({ input }) => {
      const db = admin.firestore()
      // Query annotations whose usfm starts with "BOOK.CHAPTER."
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
        })
      })
    }),
})
