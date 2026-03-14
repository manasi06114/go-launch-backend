import { getMongoDb } from "./mongodb.js";

type FeedbackRecord = {
  requestId: string;
  launched: boolean;
  outcome: "success" | "partial" | "failure";
  notes?: string;
  correctedScores?: {
    viability?: number;
    risk?: number;
  };
  createdAt: string;
};

export class FeedbackStore {
  async append(record: Omit<FeedbackRecord, "createdAt">): Promise<void> {
    const db = await getMongoDb();
    await db.collection<FeedbackRecord>("analysis_feedback").insertOne({
      ...record,
      createdAt: new Date().toISOString()
    });
  }
}
