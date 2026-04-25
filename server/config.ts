import { z } from "zod";
import "dotenv/config";

const configSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url().optional(), // Optional if using Supabase directly via other means, but usually required
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(), // Optional depending on usage
  SUPABASE_JWT_AUD: z.string().optional(),
  // OpenAI: set OPENAI_API_KEY. Ollama: set OPENAI_API_BASE_URL (OPENAI_API_KEY optional, defaults to "ollama")
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_API_BASE_URL: z.string().url().optional(),
  AI_MODEL: z.string().default("gpt-4o"), // Base model for JSON endpoints (memory, journal, scoring, analytics)
  AI_CHAT_MODEL: z.string().optional(), // Chat model (defaults to AI_MODEL). For Ollama: use roast model name for chat.
  ELEVENLABS_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
});

const result = configSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:", result.error.format());
  process.exit(1);
}

const data = result.data;

// Validate: SUPABASE_URL is required outside test mode.
if (data.NODE_ENV !== "test" && !data.SUPABASE_URL) {
  console.error("❌ SUPABASE_URL is required outside test mode.");
  process.exit(1);
}

// Validate: when using OpenAI (no base URL), API key is required outside test mode.
if (data.NODE_ENV !== "test" && !data.OPENAI_API_BASE_URL && !data.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is required when not using Ollama. Set OPENAI_API_BASE_URL for Ollama mode.");
  process.exit(1);
}

export const config = data;
