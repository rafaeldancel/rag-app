"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertDatapoints = upsertDatapoints;
exports.findNeighbors = findNeighbors;
const auth_1 = require("./auth");
const env_1 = require("./env");
async function upsertDatapoints(datapoints) {
    const token = await (0, auth_1.getAccessToken)();
    const url = `https://${env_1.ENV.location}-aiplatform.googleapis.com/v1/${env_1.ENV.vectorIndexResourceName}:upsertDatapoints`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ datapoints }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`upsertDatapoints failed: ${res.status} ${body}`);
    }
}
async function findNeighbors(queryVector, k = 8) {
    const token = await (0, auth_1.getAccessToken)();
    const url = `https://${env_1.ENV.location}-aiplatform.googleapis.com/v1/${env_1.ENV.vectorEndpointResourceName}:findNeighbors`;
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
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`findNeighbors failed: ${res.status} ${body}`);
    }
    const json = await res.json();
    return json.nearestNeighbors?.[0]?.neighbors ?? [];
}
