# Bible Data Implementation — Code Trace & Validation

## Overview

We wired live Bible data into the Logos app end-to-end: from the YouVersion Platform API → Firebase Cloud Functions (tRPC) → React frontend. This doc walks through every layer so you can validate the work.

---

## 1. Shared Schemas — `packages/shared/src/schemas/bible.ts`

This is the single source of truth for all types shared between the backend and frontend.

### Bible version registry

```ts
export const BIBLE_VERSIONS = {
  BSB: 3034, // Berean Standard Bible — modern, free
  NIV: 111, // New International Version 2011
  WEB: 206, // World English Bible — public domain
}
```

> **Why these?** YouVersion's free developer plan only licenses public domain / freely-licensed translations. ESV (59), NASB (100) returned 403 Forbidden. We confirmed BSB, NIV, and WEB all return 200.

### Input schemas (what the frontend sends to the backend)

```ts
GetBooksInputSchema  → { versionId: number }
GetVotdInputSchema   → { versionId: number }
GetChapterInputSchema → { book: string, chapter: number, versionId: number }
```

### Response schemas (what the backend returns to the frontend)

```ts
BibleBookSchema → { usfm, name, abbreviation, chapterCount, canon }
BibleVerseSchema → { number, usfm, text }
BibleChapterSchema → { reference, book, chapter, versionId, verses[], copyright }
VotdSchema → { reference, text, usfm, book, chapter, copyright }
DailyPrayerSchema → { text, basedOn }
```

---

## 2. Backend Router — `apps/functions/src/trpc/routers/bible.ts`

The tRPC router exposes 4 procedures, all sitting behind the `bible.` namespace.

### Authentication

```ts
// Correct header — discovered by reading the API error response:
// "Failed to resolve API Key variable request.header.x-yvp-app-key"
headers: { 'x-yvp-app-key': process.env.YOUVERSION_API_KEY }
```

> The API key is stored in Google Secret Manager as `YOUVERSION_API_KEY` and injected at runtime by Firebase. **Common mistake:** the key was initially set to the command string itself, not the actual key value.

### `bible.getBooks`

```
GET https://api.youversion.com/v1/bibles/{versionId}/books
```

Returns all 66 books with chapter counts, names, and OT/NT grouping.

**Field mapping:**

```ts
usfm         ← b.id            // "GEN", "JHN"
name         ← b.title         // "Genesis", "John"
abbreviation ← b.abbreviation  // "Gen", "Jn"
chapterCount ← b.chapters.length
canon        ← CANON_MAP[b.canon]
// "old_testament" → "OT", "new_testament" → "NT"
```

### `bible.getVOTD`

```
GET https://api.youversion.com/v1/bibles/{versionId}/passages/{usfm}
```

> The YouVersion VOTD endpoint (`/verse-of-the-days/...`) is **not included** in the free developer plan — it returned 404 for all date formats tested. Instead, we maintain a curated list of 52 well-known scriptures that rotates weekly.

```ts
const CURATED_VERSES = ['JHN.3.16', 'PSA.23.1', 'ROM.8.28', ...]
// Picks by: Math.floor(dayOfYear / 7) % CURATED_VERSES.length
```

The chosen USFM is fetched as a single-verse passage. Response `content` is plain text — HTML tags stripped with `.replace(/<[^>]+>/g, '')`.

### `bible.getChapter`

```
GET https://api.youversion.com/v1/bibles/{versionId}/passages/{book}.{chapter}?format=html
```

Returns a full chapter as structured verse objects.

**HTML parsing:** YouVersion wraps verse numbers in `class="yv-vlbl"` spans:

```html
<span class="yv-v" v="1"></span><span class="yv-vlbl">1</span>verse text...
```

We split on the label spans to extract individual verse text:

```ts
html.split(/<span[^>]*class="yv-vlbl"[^>]*>(\d+)<\/span>/)
// → [preamble, "1", "verse text...", "2", "more text...", ...]
```

### `bible.getDailyPrayer`

Fetches today's curated verse (same as VOTD), then passes it to Gemini (`flash-2.0`) with a contemplative prayer prompt. Uses Vertex AI via `@google/genai`.

---

## 3. Cloud Function Entry — `apps/functions/src/index.ts`

The `api` Cloud Function exposes the entire tRPC router over HTTP:

```ts
export const api = onRequest(
  { cors: true, region: 'us-central1', secrets: [youversionApiKey] },
  async (req, res) => {
    // Reconstruct a standard Web API Request from the Express-style req
    const url = `${req.protocol}://${req.headers.host}${req.originalUrl}`
    const fetchReq = new Request(url, { method, headers, body })

    // Hand off to tRPC's fetch adapter
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: fetchReq,
      router: appRouter,
      createContext: () => ({}),
    })

    res.status(response.status)
    response.headers.forEach((v, k) => res.setHeader(k, v))
    res.end(await response.text())
  }
)
```

**Infrastructure fixes made:**
| Problem | Fix |
|---|---|
| `ERR_MODULE_NOT_FOUND` for `./env` | Switched from `tsc` to `tsup` (CJS bundle) |
| `workspace:*` protocol in Cloud Build | Removed `@repo/shared` from deps — tsup bundles it inline |
| Peer dep conflict (TypeScript version) | Added `.npmrc` with `legacy-peer-deps=true` |
| 403 Forbidden on all requests | Granted `allUsers` the `roles/run.invoker` IAM role on Cloud Run |

---

## 4. Build Config — `apps/functions/tsup.config.ts`

```ts
export default {
  entry: ['src/index.ts'],
  format: ['cjs'], // Firebase requires CommonJS
  target: 'node22',
  noExternal: [/^@repo\//], // Bundle workspace packages inline
}
```

---

## 5. Firebase Config — `firebase.json`

```json
{
  "functions": {
    "source": "apps/functions", // ← was "functions" (wrong)
    "runtime": "nodejs22",
    "predeploy": ["pnpm --prefix \"$RESOURCE_DIR\" run build"]
  },
  "hosting": {
    "rewrites": [
      { "source": "/api/**", "function": "api" }, // ← tRPC proxy
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

---

## 6. Frontend Hooks — `apps/web/src/hooks/useBible.ts`

```ts
useVotd(versionId?)        → trpc.bible.getVOTD   (stale: 24h)
useDailyPrayer(versionId?) → trpc.bible.getDailyPrayer (stale: 24h)
useBooks(versionId?)       → trpc.bible.getBooks   (stale: 7 days)
useBibleChapter(book, chapter, versionId?) → trpc.bible.getChapter (stale: 1h)
```

All default to `BIBLE_VERSIONS.BSB` (Berean Standard Bible).

---

## 7. Today Page — `apps/web/src/pages/TodayPage.tsx`

```
useVotd()      → loading → VotdSkeleton
               → error   → "Unable to load today's verse."
               → data    → <DailyVerseCard reference text onReadChapter />

useDailyPrayer() → <DailyPrayerCard text basedOn isLoading />
```

`onReadChapter` navigates to `/bible/{book}/{chapter}` using the USFM data from VOTD.

---

## 8. Bible Page — `apps/web/src/pages/BiblePage.tsx`

**URL structure:** `/bible/:book/:chapter?v=BSB`

```
useBooks(versionId)              → powers ChapterPicker + chapter bounds
useBibleChapter(book, ch, vid)   → renders verse list
```

**Navigation:**

- Tapping the chapter label in the toolbar → opens `ChapterPicker`
- Prev/Next buttons at page bottom — cross-book boundary aware:
  - At chapter 1 → jumps to last chapter of previous book
  - At last chapter → jumps to chapter 1 of next book
  - Disabled at Genesis 1 and Revelation 22

**Translation switching:** Updates `?v=` search param → re-fetches with new version ID.

---

## 9. Chapter Picker — `apps/web/src/components/bible/ChapterPicker.tsx`

Bottom sheet with two-step UX:

**Step 1 — Book list** (grouped by OT / NT):

- Shows all 66 books fetched from `useBooks()`
- Highlights current book in primary color
- Single-chapter books navigate immediately (no step 2)

**Step 2 — Chapter grid** (5 columns):

- Shows chapter numbers 1–N from `book.chapterCount`
- Highlights current chapter

Implemented as a CSS slide-up sheet with a backdrop overlay. No external library.

---

## 10. Supporting Components

| Component         | Location                               | Purpose                                                           |
| ----------------- | -------------------------------------- | ----------------------------------------------------------------- |
| `Skeleton`        | `components/atoms/Skeleton.tsx`        | Shimmer placeholder for loading states                            |
| `DailyPrayerCard` | `components/today/DailyPrayerCard.tsx` | AI prayer card with "Say Amen" toggle                             |
| `ReaderToolbar`   | `components/bible/ReaderToolbar.tsx`   | Sticky toolbar with translation `<select>` + chapter label button |

---

## Request Flow (end-to-end)

```
Browser
  → GET api-3glp7teunq-uc.a.run.app/api/trpc/bible.getChapter?...
    → Cloud Run (api function)
      → fetchRequestHandler strips /api/trpc prefix
        → bibleRouter.getChapter({ book, chapter, versionId })
          → youversionFetch(/bibles/3034/passages/JHN.3?format=html)
            → api.youversion.com [x-yvp-app-key: ***]
              ← { id, content: "<html>...", copyright: "..." }
          ← parseVerses(html) → BibleVerse[]
        ← BibleChapterSchema validated response
      ← tRPC JSON envelope
    ← HTTP 200
  ← useBibleChapter() resolves → renders <Verse /> list
```

---

## What's Not Yet Done

- **Inline AI Insight** on Bible page (`InlineAIInsight` component — mentioned in TDD)
- **Diary page** data (MentorInsightCard, DiaryEntryCard)
- **Authentication** (Firebase Auth — users are anonymous for now)
- **Streak tracking** (hardcoded to 14 in StreakHeader)
- **Profile page** stats (hardcoded)
