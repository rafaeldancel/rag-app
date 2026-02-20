"use strict";
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
var admin2 = __toESM(require("firebase-admin"));
var import_https = require("firebase-functions/v2/https");
var import_genai2 = require("@google/genai");

// src/env.ts
var ENV = {
  projectId: process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? "logos-91c8e",
  location: process.env.FUNCTION_REGION ?? "us-central1",
  vectorIndexResourceName: process.env.VECTOR_INDEX_RESOURCE_NAME,
  vectorEndpointResourceName: process.env.VECTOR_ENDPOINT_RESOURCE_NAME,
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
    contents: texts.map((t) => ({ role: "user", parts: [{ text: t }] }))
  });
  const vectors = resp.embeddings?.map((e) => e.values ?? []) ?? [];
  if (vectors.length !== texts.length) {
    throw new Error(`Embedding count mismatch: got ${vectors.length}, expected ${texts.length}`);
  }
  return vectors;
}

// src/auth.ts
var import_google_auth_library = require("google-auth-library");
async function getAuthClient() {
  const auth = new import_google_auth_library.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  return auth.getClient();
}
async function getAccessToken() {
  const client = await getAuthClient();
  const tokenResp = await client.getAccessToken();
  if (!tokenResp.token) throw new Error("No access token");
  return tokenResp.token;
}

// src/vectorSearch.ts
async function upsertDatapoints(datapoints) {
  const token = await getAccessToken();
  const url = `https://${ENV.location}-aiplatform.googleapis.com/v1/${ENV.vectorIndexResourceName}:upsertDatapoints`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ datapoints })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`upsertDatapoints failed: ${res.status} ${body}`);
  }
}
async function findNeighbors(queryVector, k = 8) {
  const token = await getAccessToken();
  const publicDomain = "2087810271.us-central1-251918570661.vdb.vertexai.goog";
  const url = `https://${publicDomain}/v1/${ENV.vectorEndpointResourceName}:findNeighbors`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      deployedIndexId: process.env.VECTOR_DEPLOYED_INDEX_ID,
      queries: [
        {
          datapoint: { featureVector: queryVector },
          neighborCount: k
        }
      ]
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`findNeighbors failed: ${res.status} ${body}`);
  }
  const json = await res.json();
  return json.nearestNeighbors?.[0]?.neighbors ?? [];
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
var admin = __toESM(require("firebase-admin"));
var import_storage = require("firebase-functions/v2/storage");
var import_storage2 = require("@google-cloud/storage");
var storage = new import_storage2.Storage();
var ingestFromGcs = (0, import_storage.onObjectFinalized)(
  {
    region: "us-central1",
    bucket: "logos-91c8e-rag-docs"
  },
  async (event) => {
    const db2 = admin.firestore();
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const chunks = chunkText(raw);
    const vectors = await embedTexts(chunks);
    const batch = db2.batch();
    const datapoints = chunks.map((text, i) => {
      const chunkId = String(i).padStart(4, "0");
      const datapointId = `${docRef.id}_${chunkId}`;
      batch.set(docRef.collection("chunks").doc(chunkId), {
        text,
        vectorDatapointId: datapointId,
        tokenCountApprox: Math.ceil(text.length / 4)
      });
      return {
        datapointId,
        featureVector: vectors[i],
        restricts: [{ namespace: "docId", allowList: [docRef.id] }]
      };
    });
    await batch.commit();
    await upsertDatapoints(datapoints);
    console.log(`Ingested ${chunks.length} chunks from ${filePath}`);
  }
);

// src/index.ts
admin2.initializeApp();
var db = admin2.firestore();
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
  const neighbors = await findNeighbors(qVec, 8);
  const chunkRefs = neighbors.map((n) => n.datapoint?.datapointId).filter(Boolean);
  const chunks = [];
  for (const id of chunkRefs) {
    const [docId, chunkId] = String(id).split("_", 2);
    const snap = await db.doc(`docs/${docId}/chunks/${chunkId}`).get();
    if (!snap.exists) continue;
    const chunk = snap.data();
    const docSnap = await db.doc(`docs/${docId}`).get();
    const doc = docSnap.data();
    chunks.push({ id, text: chunk.text, sourceUri: doc?.sourceUri, title: doc?.title });
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
      uri: c.sourceUri,
      datapointId: c.id
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
    createdAt: admin2.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin2.firestore.FieldValue.serverTimestamp()
  });
  const chunks = chunkText(raw);
  const vectors = await embedTexts(chunks);
  const batch = db.batch();
  const datapoints = chunks.map((text, i) => {
    const chunkId = String(i).padStart(4, "0");
    const datapointId = `${docRef.id}_${chunkId}`;
    batch.set(docRef.collection("chunks").doc(chunkId), {
      text,
      vectorDatapointId: datapointId,
      tokenCountApprox: Math.ceil(text.length / 4)
    });
    return {
      datapointId,
      featureVector: vectors[i],
      restricts: [{ namespace: "docId", allowList: [docRef.id] }]
    };
  });
  await batch.commit();
  await upsertDatapoints(datapoints);
  return { docId: docRef.id, chunkCount: chunks.length };
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  chat,
  ingestFromApi,
  ingestFromGcs
});
