"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestFromGcs = void 0;
const admin = __importStar(require("firebase-admin"));
const storage_1 = require("firebase-functions/v2/storage");
const storage_2 = require("@google-cloud/storage");
const chunking_1 = require("./chunking");
const embeddings_1 = require("./embeddings");
const vectorSearch_1 = require("./vectorSearch");
const db = admin.firestore();
const storage = new storage_2.Storage();
exports.ingestFromGcs = (0, storage_1.onObjectFinalized)({ region: 'us-central1' }, async (event) => {
    const filePath = event.data.name;
    const bucketName = event.data.bucket;
    if (!filePath.match(/\.(txt|md|json)$/)) {
        console.log(`Skipping unsupported file type: ${filePath}`);
        return;
    }
    const file = storage.bucket(bucketName).file(filePath);
    const [contents] = await file.download();
    const raw = contents.toString('utf-8');
    const docRef = await db.collection('docs').add({
        sourceType: 'gcs',
        sourceUri: `gs://${bucketName}/${filePath}`,
        title: filePath.split('/').pop() ?? filePath,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const chunks = (0, chunking_1.chunkText)(raw);
    const vectors = await (0, embeddings_1.embedTexts)(chunks);
    const batch = db.batch();
    const datapoints = chunks.map((text, i) => {
        const chunkId = String(i).padStart(4, '0');
        const datapointId = `${docRef.id}_${chunkId}`;
        batch.set(docRef.collection('chunks').doc(chunkId), {
            text,
            vectorDatapointId: datapointId,
            tokenCountApprox: Math.ceil(text.length / 4),
        });
        return {
            datapointId,
            featureVector: vectors[i],
            restricts: [{ namespace: 'docId', allowList: [docRef.id] }],
        };
    });
    await batch.commit();
    await (0, vectorSearch_1.upsertDatapoints)(datapoints);
    console.log(`Ingested ${chunks.length} chunks from ${filePath}`);
});
