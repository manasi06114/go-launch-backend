import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ message: "Validation failed", issues: err.issues });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
}
