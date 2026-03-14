import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default("go_launch_ai"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("text-embedding-004"),
  SEARCH_LIMIT: z.coerce.number().default(5),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(15000),
  ALLOWED_ORIGIN: z.string().default("*")
});

export const env = envSchema.parse(process.env);
