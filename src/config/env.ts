import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("uploads"),
  PUBLIC_BASE_URL: z.string().default("http://localhost:4000"),
  CRON_SECRET: z.string().min(8).default("albatha-dev-cron-secret-change-me"),
});

export const env = envSchema.parse(process.env);
