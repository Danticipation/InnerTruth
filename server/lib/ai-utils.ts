/**
 * Utilities for AI response parsing, especially for Ollama which may not
 * reliably support response_format and can return JSON wrapped in markdown.
 */
export function parseJsonWithFallback<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;

  let cleaned = raw.trim();

  // Strip markdown code blocks
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try extracting first { ... } or [ ... ]
    const braceMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]) as T;
      } catch {
        // fall through to fallback
      }
    }
  }

  return fallback;
}

/** Append JSON instruction for Ollama when response_format may be ignored */
export function withJsonInstruction(prompt: string): string {
  return `${prompt}\n\nIMPORTANT: Respond with ONLY valid JSON. No other text, no markdown, no explanation.`;
}
