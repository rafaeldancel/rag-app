import { GoogleGenAI } from '@google/genai';
import { ENV } from './env';
function vertexClient() {
    process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true';
    process.env.GOOGLE_CLOUD_PROJECT = ENV.projectId;
    process.env.GOOGLE_CLOUD_LOCATION = ENV.location;
    return new GoogleGenAI({});
}
export async function embedTexts(texts) {
    const ai = vertexClient();
    const resp = await ai.models.embedContent({
        model: ENV.embeddingModel,
        contents: texts.map(t => ({ role: 'user', parts: [{ text: t }] })),
        config: {
            outputDimensionality: 2048,
        },
    });
    const vectors = resp.embeddings?.map(e => e.values ?? []) ?? [];
    if (vectors.length !== texts.length) {
        throw new Error(`Embedding count mismatch: got ${vectors.length}, expected ${texts.length}`);
    }
    return vectors;
}
