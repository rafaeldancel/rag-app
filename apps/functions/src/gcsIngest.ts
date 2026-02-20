import * as admin from 'firebase-admin'
import { onObjectFinalized } from 'firebase-functions/v2/storage'
import { Storage } from '@google-cloud/storage'
import { chunkText } from './chunking'
import { embedTexts } from './embeddings'
import { upsertDatapoints } from './vectorSearch'

const storage = new Storage()

export const ingestFromGcs = onObjectFinalized(
  {
    region: 'us-central1',
    bucket: 'logos-91c8e-rag-docs',
  },
  async event => {
    const db = admin.firestore()
    const filePath = event.data.name
    const bucketName = event.data.bucket

    if (!filePath.match(/\.(txt|md|json)$/)) {
      console.log(`Skipping unsupported file type: ${filePath}`)
      return
    }

    const file = storage.bucket(bucketName).file(filePath)
    const [contents] = await file.download()
    const raw = contents.toString('utf-8')

    const docRef = await db.collection('docs').add({
      sourceType: 'gcs',
      sourceUri: `gs://${bucketName}/${filePath}`,
      title: filePath.split('/').pop() ?? filePath,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const chunks = chunkText(raw)
    const vectors = await embedTexts(chunks)
    const batch = db.batch()

    const datapoints = chunks.map((text: string, i: number) => {
      const chunkId = String(i).padStart(4, '0')
      const datapointId = `${docRef.id}_${chunkId}`
      batch.set(docRef.collection('chunks').doc(chunkId), {
        text,
        vectorDatapointId: datapointId,
        tokenCountApprox: Math.ceil(text.length / 4),
      })
      return {
        datapointId,
        featureVector: vectors[i],
        restricts: [{ namespace: 'docId', allowList: [docRef.id] }],
      }
    })

    await batch.commit()
    await upsertDatapoints(datapoints)
    console.log(`Ingested ${chunks.length} chunks from ${filePath}`)
  }
)
