export const ENV = {
  projectId: process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'logos-91c8e',
  location: process.env.FUNCTION_REGION ?? 'us-central1',
  embeddingModel: process.env.EMBEDDING_MODEL || 'gemini-embedding-001',
  chatModel: process.env.CHAT_MODEL || 'gemini-2.5-flash',
}
