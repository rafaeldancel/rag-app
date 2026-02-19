export const ENV = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  vectorIndexResourceName: process.env.VECTOR_INDEX_RESOURCE_NAME!,
  vectorEndpointResourceName: process.env.VECTOR_ENDPOINT_RESOURCE_NAME!,
  embeddingModel: process.env.EMBEDDING_MODEL || 'gemini-embedding-001',
  chatModel: process.env.CHAT_MODEL || 'gemini-2.5-flash',
}
