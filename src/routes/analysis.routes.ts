import { Router } from "express";
import { analysisRequestSchema, feedbackSchema } from "../schemas/analysis.schema.js";
import { AnalysisPipeline } from "../services/pipeline/analysisPipeline.js";
import { FeedbackStore } from "../data/feedbackStore.js";
import { ReportStore } from "../data/reportStore.js";

const router = Router();
const pipeline = new AnalysisPipeline();
const feedbackStore = new FeedbackStore();
const reportStore = new ReportStore();

router.post("/report", async (req, res, next) => {
  try {
    const payload = analysisRequestSchema.parse(req.body);
    const report = await pipeline.run(payload);
    await reportStore.save(payload, report);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
});

router.get("/reports", async (_req, res, next) => {
  try {
    const reports = await reportStore.listRecent(100);
    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
});

router.get("/report/:requestId", async (req, res, next) => {
  try {
    const report = await reportStore.getByRequestId(req.params.requestId);

    if (!report) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
});

router.post("/feedback", async (req, res, next) => {
  try {
    const payload = feedbackSchema.parse(req.body);
    await feedbackStore.append(payload);
    res.status(202).json({ message: "Feedback recorded" });
  } catch (error) {
    next(error);
  }
});

export { router as analysisRouter };
