import * as admin from 'firebase-admin'

/**
 * Enforces a sliding-window rate limit using a Firestore counter document.
 *
 * @param key       Unique identifier (e.g. `chat:uid` or `ingest:uid`)
 * @param max       Maximum number of calls allowed within the window
 * @param windowMs  Window size in milliseconds (e.g. 86_400_000 for 24 h)
 * @throws          Error with HTTP-429-style message when limit is exceeded
 */
export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<void> {
  const db = admin.firestore()
  const ref = db.doc(`rateLimits/${encodeURIComponent(key)}`)
  const now = Date.now()

  await db.runTransaction(async tx => {
    const snap = await tx.get(ref)
    const data = snap.data() as { count: number; windowStart: number } | undefined

    if (!data || now - data.windowStart >= windowMs) {
      // First call or window has expired — start fresh
      tx.set(ref, { count: 1, windowStart: now })
      return
    }

    if (data.count >= max) {
      const resetIn = Math.ceil((data.windowStart + windowMs - now) / 60_000)
      throw new Error(`Rate limit exceeded. Try again in ${resetIn} minute(s).`)
    }

    tx.update(ref, { count: data.count + 1 })
  })
}
