import { Router } from "express";
import { analysisRouter } from "./analysis.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/api/v1/analysis", analysisRouter);

export { router };
