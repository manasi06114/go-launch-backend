import { AnalysisReport, AnalysisReportCard, AnalysisRequest } from "../types/domain.js";
import { getMongoDb } from "./mongodb.js";

type PersistedReport = {
  requestId: string;
  generatedAt: string;
  input: AnalysisRequest;
  report: AnalysisReport;
};

export class ReportStore {
  async save(input: AnalysisRequest, report: AnalysisReport): Promise<void> {
    const db = await getMongoDb();
    const collection = db.collection<PersistedReport>("analysis_reports");

    await collection.updateOne(
      { requestId: report.requestId },
      {
        $set: {
          requestId: report.requestId,
          generatedAt: report.generatedAt,
          input,
          report
        }
      },
      { upsert: true }
    );
  }

  async getByRequestId(requestId: string): Promise<AnalysisReport | null> {
    const db = await getMongoDb();
    const doc = await db.collection<PersistedReport>("analysis_reports").findOne({ requestId });
    return doc?.report ?? null;
  }

  async listRecent(limit = 50): Promise<AnalysisReportCard[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection<PersistedReport>("analysis_reports")
      .find({}, { projection: { requestId: 1, generatedAt: 1, "report.idea": 1, "report.scoring": 1, "report.risk": 1 } })
      .sort({ generatedAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((doc) => ({
      requestId: doc.requestId,
      generatedAt: doc.generatedAt,
      productName: doc.report.idea.productName,
      oneLiner: doc.report.idea.oneLiner,
      recommendation: doc.report.scoring.recommendation,
      viabilityScore: doc.report.scoring.overallViabilityScore,
      riskScore: doc.report.risk.riskScore
    }));
  }
}
