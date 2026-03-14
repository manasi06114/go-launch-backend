import { getMongoDb } from "../../data/mongodb.js";
import { VectorRecord, VectorStore } from "./vectorStore.js";

type PersistedVectorRecord = VectorRecord & { createdAt: string };

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    aNorm += a[i] * a[i];
    bNorm += b[i] * b[i];
  }

  if (aNorm === 0 || bNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

export class MongoVectorStore implements VectorStore {
  async upsert(records: VectorRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const db = await getMongoDb();
    const collection = db.collection<PersistedVectorRecord>("document_vectors");

    const operations = records.map((record) => ({
      updateOne: {
        filter: { id: record.id },
        update: {
          $set: {
            ...record,
            createdAt: new Date().toISOString()
          }
        },
        upsert: true
      }
    }));

    await collection.bulkWrite(operations);
  }

  async query(embedding: number[], topK: number, filter?: Record<string, string>): Promise<VectorRecord[]> {
    const db = await getMongoDb();
    const collection = db.collection<PersistedVectorRecord>("document_vectors");

    const mongoFilter =
      filter && Object.keys(filter).length > 0
        ? Object.fromEntries(Object.entries(filter).map(([k, v]) => [`metadata.${k}`, v]))
        : {};

    const candidates = await collection.find(mongoFilter).sort({ createdAt: -1 }).limit(200).toArray();

    return candidates
      .map((record) => ({ record, score: cosineSimilarity(embedding, record.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ record }) => ({
        id: record.id,
        embedding: record.embedding,
        metadata: record.metadata
      }));
  }
}
