import { Router } from "express";
import { analysisRouter } from "./analysis.routes.js";
import { authRouter } from "./auth.routes.js";
import { authenticateRequest } from "../middlewares/authenticate.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/api/v1/auth", authRouter);
router.use("/api/v1/analysis", authenticateRequest, analysisRouter);

export { router };
