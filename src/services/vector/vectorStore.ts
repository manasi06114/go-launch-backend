export type VectorRecord = {
  id: string;
  embedding: number[];
  metadata: Record<string, string>;
};

export interface VectorStore {
  upsert(records: VectorRecord[]): Promise<void>;
  query(embedding: number[], topK: number, filter?: Record<string, string>): Promise<VectorRecord[]>;
}
