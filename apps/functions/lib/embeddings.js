"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedTexts = embedTexts;
const genai_1 = require("@google/genai");
const env_1 = require("./env");
function vertexClient() {
    process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true';
    process.env.GOOGLE_CLOUD_PROJECT = env_1.ENV.projectId;
    process.env.GOOGLE_CLOUD_LOCATION = env_1.ENV.location;
    return new genai_1.GoogleGenAI({});
}
async function embedTexts(texts) {
    const ai = vertexClient();
    const resp = await ai.models.embedContent({
        model: env_1.ENV.embeddingModel,
        contents: texts.map(t => ({ role: 'user', parts: [{ text: t }] })),
    });
    const vectors = resp.embeddings?.map(e => e.values ?? []) ?? [];
    if (vectors.length !== texts.length) {
        throw new Error(`Embedding count mismatch: got ${vectors.length}, expected ${texts.length}`);
    }
    return vectors;
}
