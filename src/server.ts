import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeMongo, connectMongo } from "./data/mongodb.js";

const app = createApp();

async function bootstrap() {
  await connectMongo();

  const server = app.listen(env.PORT, () => {
    logger.info(`GoLaunch backend listening on port ${env.PORT}`);
  });

  const shutdown = async () => {
    logger.info("Shutting down server...");
    server.close(async () => {
      await closeMongo();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start backend");
  process.exit(1);
});
