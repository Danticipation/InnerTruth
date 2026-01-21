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
    const systemPrompt = `You are a direct, insightful AI personality analyst. Your role is to help users gain deeper self-understanding. You are:
1. Empathetic but honest - provide clear observations without minimizing
2. Pattern-focused - actively identify contradictions, recurring themes, and behavioral patterns
3. Direct when appropriate - if you notice avoidance, people-pleasing, or self-deception, point it out clearly but kindly
4. Curious about root causes - dig deeper into "why" behind behaviors and beliefs
5. Growth-oriented - always connect insights to actionable improvements

Your style:
- Ask probing questions that challenge assumptions
- Point out contradictions you notice: "Earlier you said X, but now you're saying Y. What's really going on?"
- Name patterns directly: "I'm noticing a pattern where you..."
- Balance clarity with compassion - be direct and supportive
- Keep responses 2-4 sentences with one meaningful question

Your goal is to be the honest mirror users need for genuine self-awareness.

${memoryContext}

Use these established facts to provide deeper, more personalized insights. Reference specific patterns or details you know about the user.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          }))
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      return completion.choices[0].message.content || "I'm here to listen. Please continue.";
    } catch (error: any) {
      console.error("[AI-SERVICE] Chat generation failed:", error);
      throw new AIServiceError(error.message);
    }
  }

  /**
   * Analyzes journal entries to extract a single personality insight.
   */
  async analyzeJournalInsight(entriesText: string, conversationContext: string): Promise<any> {
    const analysisPrompt = `You are a personality analyst examining someone's inner world. Analyze these journal entries and conversation patterns to identify ONE significant personality insight.

Journal Entries:
${entriesText}${conversationContext}

Look for:
1. Recurring patterns (behavioral, emotional, relational)
2. Contradictions between stated values and actions
3. Blind spots - what they can't see about themselves
4. Defense mechanisms or avoidance patterns
5. Strengths they underutilize
6. Core beliefs driving behavior

Provide a JSON response with:
{
  "insightType": "blind_spot" or "growth_opportunity",
  "title": "Brief, direct title (max 8 words)",
  "description": "Specific, honest insight with concrete examples from their writing (2-3 sentences). Be direct but compassionate.",
  "priority": "high" | "medium" | "low"
}

Focus on insights that would genuinely surprise them or help them see something they've been avoiding.`;

    try {
      const analysis = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      return JSON.parse(analysis.choices[0].message.content || "{}");
    } catch (error: any) {
      console.error("[AI-SERVICE] Journal analysis failed:", error);
      throw new AIServiceError(error.message);
    }
  }

  /**
   * Performs a comprehensive personality analysis.
   */
  async performFullAnalysis(conversationText: string, journalText: string): Promise<any> {
    const analysisPrompt = `You are conducting a comprehensive personality analysis. Analyze this person's conversations and journal entries to provide honest insights about their personality.

Recent Conversations:
${conversationText}

Journal Entries:
${journalText}

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
  "strengths": [string]
}

Be specific and reference their actual words/behaviors.`;

    try {
      const analysis = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      return JSON.parse(analysis.choices[0].message.content || "{}");
    } catch (error: any) {
      console.error("[AI-SERVICE] Full analysis failed:", error);
      throw new AIServiceError(error.message);
    }
  }
}

export const aiService = new AIService();
