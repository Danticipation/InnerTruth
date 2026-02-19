/**
 * Shared AI client for OpenAI and Ollama (OpenAI-compatible API).
 * - Chat: uses AI_CHAT_MODEL (roast persona when using Ollama)
 * - JSON endpoints: uses AI_MODEL (base model for structured output)
 */
import OpenAI from "openai";
import { config } from "../config";

const apiKey = config.OPENAI_API_BASE_URL
  ? (config.OPENAI_API_KEY ?? "ollama")
  : config.OPENAI_API_KEY!;

export const aiClient = new OpenAI({
  apiKey,
  baseURL: config.OPENAI_API_BASE_URL,
});

/** Base model for JSON endpoints (memory, journal insights, category scoring, analytics) */
export function getJsonModel(): string {
  return config.AI_MODEL;
}

/** Chat model - roast persona when AI_CHAT_MODEL is set, otherwise same as base */
export function getChatModel(): string {
  return config.AI_CHAT_MODEL ?? config.AI_MODEL;
}

/** Whether we're using Ollama (OpenAI-compatible local API) */
export function isOllamaMode(): boolean {
  return !!config.OPENAI_API_BASE_URL;
}
