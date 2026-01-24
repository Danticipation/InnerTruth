import OpenAI from "openai";
import { config } from "../config";
import { AIServiceError } from "../lib/errors";
import { type Message } from "@shared/schema";

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  /**
   * Generates a response for the chat interface.
   */
  async generateChatResponse(userId: string, history: Message[], memoryContext: string): Promise<string> {
    let processedHistory = history;

    // Chain prompts: If history is long, summarize it first to save tokens and maintain focus
    if (history.length > 10) {
      try {
        const summaryPrompt = `Summarize the key themes, emotional shifts, and core topics discussed in this conversation so far. Focus on psychological patterns and the user's current state.
        
Conversation:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}`;

        const summary = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: summaryPrompt }],
          temperature: 0.3,
          max_tokens: 300,
        });

        const summaryContent = summary.choices[0].message.content;
        // Keep only the last 4 messages for immediate context, plus the summary
        processedHistory = [
          { role: "system", content: `Summary of previous conversation: ${summaryContent}` } as any,
          ...history.slice(-4)
        ];
      } catch (error) {
        console.warn("[AI-SERVICE] History summarization failed, falling back to full history:", error);
      }
    }

    const systemPrompt = `You are a direct, insightful AI personality analyst. Your role is to help users gain deeper self-understanding. You are:
1. Empathetic but honest - provide clear observations without minimizing.
2. Pattern-focused - actively identify contradictions, recurring themes, and behavioral patterns.
3. Direct when appropriate - if you notice avoidance, people-pleasing, or self-deception, point it out clearly but kindly.
4. Curious about root causes - dig deeper into "why" behind behaviors and beliefs.
5. Growth-oriented - always connect insights to actionable improvements.
6. Culturally aware - ensure insights are culturally neutral and flag your own assumptions.

Your style:
- Ask probing questions that challenge assumptions.
- Point out contradictions you notice: "Earlier you said X, but now you're saying Y. What's really going on?"
- Name patterns directly: "I'm noticing a pattern where you..."
- Balance clarity with compassion - be direct and supportive.
- Keep responses 2-4 sentences with one meaningful question.

Your goal is to be the honest mirror users need for genuine self-awareness.

${memoryContext}

Use these established facts (including IFS parts, inferred beliefs, and defense mechanisms) to provide deeper, more personalized insights. Reference specific patterns or details you know about the user.

DISCLAIMER: I am an AI, not a therapist. These insights are for self-reflection and should not replace professional mental health advice.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...processedHistory.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
          }))
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      // Log AI usage for monitoring
      if (completion.usage) {
        console.log(`[AI-USAGE] Chat completion for user ${userId}:`, {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
          model: completion.model
        });
      }

      return completion.choices[0].message.content || "I'm here to listen. Please continue.";
    } catch (error: any) {
      console.error("[AI-SERVICE] Chat generation failed:", error);
      throw new AIServiceError(error.message);
    }
  }

  /**
   * Analyzes journal entries to extract a single personality insight.
   */
  async analyzeJournalInsight(entriesText: string, conversationContext: string, memoryContext: string = ""): Promise<any> {
    const analysisPrompt = `You are a personality analyst examining someone's inner world. Analyze these journal entries, conversation patterns, and established user facts to identify ONE significant personality insight.

Journal Entries:
${entriesText}

Conversation Context:
${conversationContext}

Established Facts & IFS Parts:
${memoryContext}

Look for:
1. Recurring patterns (behavioral, emotional, relational)
2. Contradictions between stated values and actions
3. Blind spots - what they can't see about themselves
4. Defense mechanisms or avoidance patterns
5. IFS Parts - identify if a specific "part" (e.g., a Protector, Manager, or Exile) is driving the behavior
6. Core beliefs driving behavior

Provide a JSON response with:
{
  "insightType": "blind_spot" | "growth_opportunity" | "ifs_part_insight",
  "title": "Brief, direct title (max 8 words)",
  "description": "Specific, honest insight with concrete examples from their writing (2-3 sentences). Be direct but compassionate. If it's an IFS part, explain what it's protecting.",
  "priority": "high" | "medium" | "low"
}

Focus on insights that would genuinely surprise them or help them see something they've been avoiding. Ensure the insight is culturally neutral and flags assumptions.

DISCLAIMER: AI-generated insight, not therapy.`;

    try {
      const analysis = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      // Log AI usage for monitoring
      if (analysis.usage) {
        console.log(`[AI-USAGE] Journal analysis:`, {
          prompt_tokens: analysis.usage.prompt_tokens,
          completion_tokens: analysis.usage.completion_tokens,
          total_tokens: analysis.usage.total_tokens,
          model: analysis.model
        });
      }

      return JSON.parse(analysis.choices[0].message.content || "{}");
    } catch (error: any) {
      console.error("[AI-SERVICE] Journal analysis failed:", error);
      throw new AIServiceError(error.message);
    }
  }

  /**
   * Performs a comprehensive personality analysis.
   */
  async performFullAnalysis(conversationText: string, journalText: string, memoryContext: string = ""): Promise<any> {
    const analysisPrompt = `You are conducting a comprehensive personality analysis. Analyze this person's conversations, journal entries, and established facts to provide honest insights about their personality.

Recent Conversations:
${conversationText}

Journal Entries:
${journalText}

Established Facts & IFS Parts:
${memoryContext}

Provide a detailed JSON analysis with:
{
  "traits": {
    "openness": 0-100,
    "conscientiousness": 0-100,
    "extraversion": 0-100,
    "agreeableness": 0-100,
    "emotionalStability": 0-100
  },
  "corePatterns": [string],
  "blindSpots": [string],
  "strengths": [string],
  "ifsParts": [
    { "name": "string", "role": "string", "description": "string" }
  ]
}

Be specific and reference their actual words/behaviors. Ensure cultural neutrality and flag assumptions.

DISCLAIMER: AI-generated analysis, not therapy.`;

    try {
      const analysis = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      // Log AI usage for monitoring
      if (analysis.usage) {
        console.log(`[AI-USAGE] Full analysis:`, {
          prompt_tokens: analysis.usage.prompt_tokens,
          completion_tokens: analysis.usage.completion_tokens,
          total_tokens: analysis.usage.total_tokens,
          model: analysis.model
        });
      }

      return JSON.parse(analysis.choices[0].message.content || "{}");
    } catch (error: any) {
      console.error("[AI-SERVICE] Full analysis failed:", error);
      throw new AIServiceError(error.message);
    }
  }
}

export const aiService = new AIService();
