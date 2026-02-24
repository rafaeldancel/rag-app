import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
function getDb() {
    return admin.firestore();
}
export async function batchStoreChunks(docId, chunks, startIndex = 0) {
    const db = getDb();
    const batch = db.batch();
    chunks.forEach((chunk, i) => {
        const chunkId = String(startIndex + i).padStart(4, '0');
        const ref = db.doc(`docs/${docId}/chunks/${chunkId}`);
        batch.set(ref, {
            text: chunk.text,
            tokenCountApprox: Math.ceil(chunk.text.length / 4),
            embedding: FieldValue.vector(chunk.vector),
            docId,
        });
    });
    await batch.commit();
}
export async function findNearestChunks(queryVector, k = 8) {
    const db = getDb();
    const chunksRef = db.collectionGroup('chunks');
    const snapshot = await chunksRef
        .findNearest('embedding', FieldValue.vector(queryVector), {
        limit: k,
        distanceMeasure: 'COSINE',
    })
        .get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        docId: doc.data().docId,
    }));
}
