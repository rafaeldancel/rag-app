import { getAccessToken } from './auth'
import { ENV } from './env'

type Datapoint = {
  datapointId: string
  featureVector: number[]
  restricts?: Array<{ namespace: string; allowList: string[] }>
}

export async function upsertDatapoints(datapoints: Datapoint[]) {
  const token = await getAccessToken()
  const url = `https://${ENV.location}-aiplatform.googleapis.com/v1/${ENV.vectorIndexResourceName}:upsertDatapoints`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ datapoints }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`upsertDatapoints failed: ${res.status} ${body}`)
  }
}

export async function findNeighbors(queryVector: number[], k = 8) {
  const token = await getAccessToken()
  const url = `https://${ENV.location}-aiplatform.googleapis.com/v1/${ENV.vectorEndpointResourceName}:findNeighbors`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deployedIndexId: process.env.VECTOR_DEPLOYED_INDEX_ID,
      queries: [
        {
          datapoint: { featureVector: queryVector },
          neighborCount: k,
        },
      ],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`findNeighbors failed: ${res.status} ${body}`)
  }
  const json = await res.json()
  return json.nearestNeighbors?.[0]?.neighbors ?? []
}
