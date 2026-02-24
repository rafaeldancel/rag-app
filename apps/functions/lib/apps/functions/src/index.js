import * as admin from 'firebase-admin';
import { onCall, onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { ENV } from './env';
import { embedTexts } from './embeddings';
import { batchStoreChunks } from './firestoreSearch';
import { chunkText } from './chunking';
import { ragQuery } from './rag';
import { appRouter } from './trpc/router';
admin.initializeApp();
const db = admin.firestore();
// ── Chat (RAG Pipeline) ───────────────────────────────────────────
export const chat = onCall({ cors: true, region: ENV.location }, async (req) => {
    const question = String(req.data?.question || '').trim();
    const profile = req.data?.profile || 'bible-study';
    if (!question)
        throw new Error('Missing question');
    const result = await ragQuery({ question, profile });
    return {
        answer: result.answer,
        sources: result.sources,
        profile: result.profile,
        chunksRetrieved: result.chunksRetrieved,
    };
});
// ── Ingest from URL ────────────────────────────────────────────────
export const ingestFromApi = onCall({ cors: true, region: 'us-central1' }, async (req) => {
    if (!req.auth)
        throw new Error('Unauthorized - must be logged in');
    const url = String(req.data?.url || '');
    if (!url)
        throw new Error('Missing url');
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`Fetch failed: ${res.status}`);
    const raw = await res.text();
    const docRef = await db.collection('docs').add({
        sourceType: 'api',
        sourceUri: url,
        title: url,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const chunks = chunkText(raw);
    const vectors = await embedTexts(chunks);
    await batchStoreChunks(docRef.id, chunks.map((text, i) => ({ text, vector: vectors[i] })));
    return { docId: docRef.id, chunkCount: chunks.length };
});
// ── Ingest from Cloud Storage ──────────────────────────────────────
export { ingestFromGcs } from './gcsIngest';
// ── tRPC HTTP handler ──────────────────────────────────────────────
const youversionApiKey = defineSecret('YOUVERSION_API_KEY');
export const api = onRequest({ cors: true, region: ENV.location, secrets: [youversionApiKey] }, async (req, res) => {
    const host = req.headers.host ?? 'localhost';
    const url = `${req.protocol}://${host}${req.originalUrl}`;
    const fetchReq = new Request(url, {
        method: req.method,
        headers: new Headers(req.headers),
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body),
    });
    const response = await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: fetchReq,
        router: appRouter,
        createContext: () => ({}),
    });
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
});
