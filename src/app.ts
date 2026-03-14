import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { router } from "./routes/index.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.ALLOWED_ORIGIN === "*" ? true : env.ALLOWED_ORIGIN
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(requestIdMiddleware);
  app.use(pinoHttp({ logger }));
  app.use(morgan("combined"));

  app.use(router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
