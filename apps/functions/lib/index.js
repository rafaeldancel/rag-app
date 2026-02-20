var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  chat: () => chat,
  ingestFromApi: () => ingestFromApi,
  ingestFromGcs: () => ingestFromGcs
});
module.exports = __toCommonJS(index_exports);
var admin3 = __toESM(require("firebase-admin"));
var import_https = require("firebase-functions/v2/https");
var import_genai2 = require("@google/genai");

// src/env.ts
var ENV = {
  projectId: process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? "logos-91c8e",
  location: process.env.FUNCTION_REGION ?? "us-central1",
  embeddingModel: process.env.EMBEDDING_MODEL || "gemini-embedding-001",
  chatModel: process.env.CHAT_MODEL || "gemini-2.5-flash"
};

// src/embeddings.ts
var import_genai = require("@google/genai");
function vertexClient() {
  process.env.GOOGLE_GENAI_USE_VERTEXAI = "true";
  process.env.GOOGLE_CLOUD_PROJECT = ENV.projectId;
  process.env.GOOGLE_CLOUD_LOCATION = ENV.location;
  return new import_genai.GoogleGenAI({});
}
async function embedTexts(texts) {
  const ai = vertexClient();
  const resp = await ai.models.embedContent({
    model: ENV.embeddingModel,
    contents: texts.map((t) => ({ role: "user", parts: [{ text: t }] })),
    config: {
      outputDimensionality: 2048
    }
  });
  const vectors = resp.embeddings?.map((e) => e.values ?? []) ?? [];
  if (vectors.length !== texts.length) {
    throw new Error(`Embedding count mismatch: got ${vectors.length}, expected ${texts.length}`);
  }
  return vectors;
}

// src/firestoreSearch.ts
var admin = __toESM(require("firebase-admin"));
var import_firestore = require("firebase-admin/firestore");
function getDb() {
  return admin.firestore();
}
async function batchStoreChunks(docId, chunks) {
  const db2 = getDb();
  const batch = db2.batch();
  chunks.forEach((chunk, i) => {
    const chunkId = String(i).padStart(4, "0");
    const ref = db2.doc(`docs/${docId}/chunks/${chunkId}`);
    batch.set(ref, {
      text: chunk.text,
      tokenCountApprox: Math.ceil(chunk.text.length / 4),
      embedding: import_firestore.FieldValue.vector(chunk.vector),
      docId
    });
  });
  await batch.commit();
}
async function findNearestChunks(queryVector, k = 8) {
  const db2 = getDb();
  const chunksRef = db2.collectionGroup("chunks");
  const snapshot = await chunksRef.findNearest("embedding", import_firestore.FieldValue.vector(queryVector), {
    limit: k,
    distanceMeasure: "COSINE"
  }).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    text: doc.data().text,
    docId: doc.data().docId
  }));
}

// src/chunking.ts
function chunkText(text, maxChars = 1200) {
  const paras = text.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > maxChars) {
      if (buf) chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}

${p}` : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

// src/gcsIngest.ts
var admin2 = __toESM(require("firebase-admin"));
var import_storage = require("firebase-functions/v2/storage");
var import_storage2 = require("@google-cloud/storage");
var storage = new import_storage2.Storage();
var ingestFromGcs = (0, import_storage.onObjectFinalized)(
  {
    region: "us-central1",
    bucket: "logos-91c8e-rag-docs"
  },
  async (event) => {
    const db2 = admin2.firestore();
    const filePath = event.data.name;
    const bucketName = event.data.bucket;
    if (!filePath.match(/\.(txt|md|json)$/)) {
      console.log(`Skipping unsupported file type: ${filePath}`);
      return;
    }
    const file = storage.bucket(bucketName).file(filePath);
    const [contents] = await file.download();
    const raw = contents.toString("utf-8");
    const docRef = await db2.collection("docs").add({
      sourceType: "gcs",
      sourceUri: `gs://${bucketName}/${filePath}`,
      title: filePath.split("/").pop() ?? filePath,
      createdAt: admin2.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin2.firestore.FieldValue.serverTimestamp()
    });
    const chunks = chunkText(raw);
    const vectors = await embedTexts(chunks);
    await batchStoreChunks(
      docRef.id,
      chunks.map((text, i) => ({ text, vector: vectors[i] }))
    );
    console.log(`Ingested ${chunks.length} chunks from ${filePath}`);
  }
);

// src/index.ts
admin3.initializeApp();
var db = admin3.firestore();
function vertexClient2() {
  process.env.GOOGLE_GENAI_USE_VERTEXAI = "true";
  process.env.GOOGLE_CLOUD_PROJECT = ENV.projectId;
  process.env.GOOGLE_CLOUD_LOCATION = ENV.location;
  return new import_genai2.GoogleGenAI({});
}
var chat = (0, import_https.onCall)({ cors: true, region: ENV.location }, async (req) => {
  const question = String(req.data?.question || "").trim();
  if (!question) throw new Error("Missing question");
  const [qVec] = await embedTexts([question]);
  const nearestChunks = await findNearestChunks(qVec, 6);
  const chunks = [];
  for (const chunk of nearestChunks) {
    const docSnap = await db.doc(`docs/${chunk.docId}`).get();
    const doc = docSnap.data();
    chunks.push({
      id: chunk.id,
      text: chunk.text,
      sourceUri: doc?.sourceUri,
      title: doc?.title
    });
  }
  const ai = vertexClient2();
  const contextBlock = chunks.slice(0, 6).map(
    (c, i) => `SOURCE ${i + 1}
Title: ${c.title || "Untitled"}
URI: ${c.sourceUri || "unknown"}
Text:
${c.text}`
  ).join("\n\n---\n\n");
  const system = `You are a helpful assistant. Answer using ONLY the provided sources when possible.
If sources are insufficient, say what is missing and suggest what to ingest next.
Always include a "Sources" section that lists which SOURCE numbers you used.`;
  const resp = await ai.models.generateContent({
    model: ENV.chatModel,
    contents: [
      {
        role: "user",
        parts: [
          { text: `SYSTEM:
${system}

CONTEXT:
${contextBlock}

QUESTION:
${question}` }
        ]
      }
    ]
  });
  return {
    answer: resp.text ?? "",
    sources: chunks.map((c, i) => ({
      sourceNo: i + 1,
      title: c.title,
      uri: c.sourceUri
    }))
  };
});
var ingestFromApi = (0, import_https.onCall)({ cors: true, region: "us-central1" }, async (req) => {
  const url = String(req.data?.url || "");
  if (!req.auth) {
    throw new Error("Unauthorized - must be logged in");
  }
  if (!url) throw new Error("Missing url");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const raw = await res.text();
  const docRef = await db.collection("docs").add({
    sourceType: "api",
    sourceUri: url,
    title: url,
    createdAt: admin3.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin3.firestore.FieldValue.serverTimestamp()
  });
  const chunks = chunkText(raw);
  const vectors = await embedTexts(chunks);
  await batchStoreChunks(
    docRef.id,
    chunks.map((text, i) => ({ text, vector: vectors[i] }))
  );
  return { docId: docRef.id, chunkCount: chunks.length };
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  chat,
  ingestFromApi,
  ingestFromGcs
});
