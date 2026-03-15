import { Router } from "express";
import { analysisRequestSchema, feedbackSchema, reportChatSchema } from "../schemas/analysis.schema.js";
import { AnalysisPipeline } from "../services/pipeline/analysisPipeline.js";
import { FeedbackStore } from "../data/feedbackStore.js";
import { ReportStore } from "../data/reportStore.js";
import { ChatStore } from "../data/chatStore.js";
import { LlmService } from "../services/ai/llm.service.js";
import { PitchDeckBuilder } from "../services/report/pitchDeckBuilder.js";

const router = Router();
const pipeline = new AnalysisPipeline();
const feedbackStore = new FeedbackStore();
const reportStore = new ReportStore();
const chatStore = new ChatStore();
const llmService = new LlmService();
const pitchDeckBuilder = new PitchDeckBuilder();

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

router.get("/pitch-deck/:requestId", async (req, res, next) => {
  try {
    const report = await reportStore.getByRequestId(req.params.requestId);

    if (!report) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    const deck = await pitchDeckBuilder.build(report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${deck.fileName}\"`);
    res.status(200).send(Buffer.from(deck.bytes));
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

router.get("/chat/:requestId", async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const messages = await chatStore.getConversation(req.params.requestId, userId);
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post("/chat", async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const payload = reportChatSchema.parse(req.body);
    const report = await reportStore.getByRequestId(payload.requestId);

    if (!report) {
      res.status(404).json({ message: "Report not found" });
      return;
    }

    const history = await chatStore.getConversation(payload.requestId, userId);
    const reportContext = [
      `Product: ${report.idea.productName}`,
      `One-liner: ${report.idea.oneLiner}`,
      `Industry: ${report.idea.industry}`,
      `Executive summary: ${report.executiveSummary}`,
      `Recommendation: ${report.scoring.recommendation}`,
      `Viability score: ${report.scoring.overallViabilityScore}`,
      `Market score: ${report.market.demandScore}`,
      `Risk score: ${report.risk.riskScore}`,
      `Top risks: ${report.risk.topRisks.join("; ")}`,
      `Action plan: ${report.actionPlan.join(" ")}`
    ].join("\n");

    const answer = await llmService.answerReportChat({
      reportContext,
      history,
      question: payload.message
    });

    const updated = await chatStore.appendMessages(payload.requestId, userId, [
      { role: "user", content: payload.message, createdAt: new Date().toISOString() },
      { role: "assistant", content: answer, createdAt: new Date().toISOString() }
    ]);

    res.status(200).json({
      answer,
      messages: updated
    });
  } catch (error) {
    next(error);
  }
});

export { router as analysisRouter };
