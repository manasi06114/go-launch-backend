import { VectorRecord, VectorStore } from "./vectorStore.js";

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

export class InMemoryVectorStore implements VectorStore {
  private readonly store: VectorRecord[] = [];

  async upsert(records: VectorRecord[]): Promise<void> {
    this.store.push(...records);
  }

  async query(embedding: number[], topK: number, filter?: Record<string, string>): Promise<VectorRecord[]> {
    const filtered =
      filter && Object.keys(filter).length > 0
        ? this.store.filter((record) => Object.entries(filter).every(([k, v]) => record.metadata[k] === v))
        : this.store;

    return [...filtered]
      .map((record) => ({ record, score: cosineSimilarity(embedding, record.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((r) => r.record);
  }
}
