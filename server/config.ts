import { z } from "zod";
import "dotenv/config";

const configSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url().optional(), // Optional if using Supabase directly via other means, but usually required
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(), // Optional depending on usage
  OPENAI_API_KEY: z.string().min(1),
  ELEVENLABS_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
});

const result = configSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:", result.error.format());
  process.exit(1);
}

export const config = result.data;
