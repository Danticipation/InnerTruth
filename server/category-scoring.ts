import { storage } from "./storage";
import { getCategoryById } from "./categories";
import OpenAI from "openai";

// Initialize OpenAI client - prioritize direct API for unfiltered access
const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
if (!apiKey) {
  console.error("ERROR: No OpenAI API key configured. Set either OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY");
  throw new Error("OpenAI API key not configured");
}

const openai = new OpenAI({
  apiKey,
  // Only use baseURL if using Replit integration (AI_INTEGRATIONS_OPENAI_API_KEY)
  baseURL: process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

export interface CategoryScoreResult {
  score: number; // 0-100
  reasoning: string;
  keyPatterns: string[];
  progressIndicators: string[];
  areasForGrowth: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
  evidenceSnippets: { source: string; excerpt: string; date: string }[];
  dynamicNudge?: string; // User-specific nudge based on score and category
}

// JSON Schema for structured output
const SCORE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    score: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Overall score for this category (0-100)"
    },
    reasoning: {
      type: "string",
      description: "2-3 sentences explaining the score"
    },
    keyPatterns: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 5,
      description: "Observable behavioral or emotional patterns"
    },
    progressIndicators: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 3,
      description: "Positive signs of growth or improvement"
    },
    areasForGrowth: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 4,
      description: "Areas needing attention or development"
    },
    confidenceLevel: {
      type: "string",
      enum: ["low", "medium", "high"],
      description: "Confidence in this assessment based on data quality and quantity"
    },
    evidenceSnippets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source: { type: "string", description: "journal or chat" },
          excerpt: { type: "string", description: "Relevant quote or paraphrase" },
          date: { type: "string", description: "ISO date string" }
        },
        required: ["source", "excerpt", "date"],
        additionalProperties: false
      },
      minItems: 0,
      maxItems: 5,
      description: "Supporting evidence from user's journal and chat"
    },
    dynamicNudge: {
      type: "string",
      description: "A personalized, probing question or nudge based on the user's score and patterns to encourage deeper reflection."
    }
  },
  required: ["score", "reasoning", "keyPatterns", "progressIndicators", "areasForGrowth", "confidenceLevel", "evidenceSnippets", "dynamicNudge"],
  additionalProperties: false
};

/**
 * Generate a category score for a user based on recent activity
 * @param userId - User ID
 * @param categoryId - Category ID to score
 * @param lookbackDays - Number of days to analyze (default 7)
 */
export async function generateCategoryScore(
  userId: string,
  categoryId: string,
  lookbackDays: number = 7
): Promise<CategoryScoreResult> {
  const category = getCategoryById(categoryId);
  if (!category) {
    throw new Error(`Category not found: ${categoryId}`);
  }

  // Fetch recent user data
  const journalEntries = await storage.getJournalEntriesByUserId(userId);
  const conversations = await storage.getConversationsByUserId(userId);

  // Filter to recent data (last N days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

  // IMPORTANT: Filter by date FIRST, then slice to limit
  // This ensures we're only analyzing recent data within the lookback window
  const recentJournals = journalEntries
    .filter(j => new Date(j.createdAt) >= cutoffDate)
    .slice(0, 10); // Max 10 journal entries (already filtered by date)

  // Get recent messages from all conversations (Batch fetch to avoid N+1)
  const convIds = conversations.slice(0, 3).map(c => c.id);
  const allMessages = await (storage as any).getMessagesByConversationIds(convIds, userId);
  
  let recentMessages = allMessages
    .filter((m: any) => new Date(m.createdAt) >= cutoffDate)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20); // Max 20 messages

  // Build context for AI
  const journalContext = recentJournals
    .map(j => `[${new Date(j.createdAt).toLocaleDateString()}] ${j.content}`)
    .join('\n\n');

  const chatContext = recentMessages
    .map((m: any) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n');

  // Check if we have enough data (count only user messages, not assistant responses)
  const userMessageCount = recentMessages.filter((m: any) => m.role === 'user').length;
  const hasMinimumData = recentJournals.length >= 2 || userMessageCount >= 5;
  if (!hasMinimumData) {
    return {
      score: 0,
      reasoning: "Insufficient data to generate a reliable score. Continue journaling and chatting to build your profile.",
      keyPatterns: [],
      progressIndicators: [],
      areasForGrowth: [],
      confidenceLevel: 'low',
      evidenceSnippets: []
    };
  }

  // Generate score using GPT-4o with structured output
  const systemPrompt = `You are an expert psychologist specializing in ${category.name}.

Analyze user journal entries and chat conversations to generate a score (0-100) that reflects their current level in this category.

CATEGORY: ${category.name}
DESCRIPTION: ${category.description}

SCORING CRITERIA:
${category.scoringCriteria}

FOCUS AREAS:
${category.chatFocusAreas.join('\n')}

FEW-SHOT EXAMPLES:
Example 1 (High Score):
Score: 85
Reasoning: User demonstrates consistent boundary setting and clear communication even during high-stress work conflicts.
Patterns: Assertive "I" statements, proactive repair attempts.
Nudge: "You've mastered assertive communication at work; how might you bring that same clarity to your relationship with your sibling?"

Example 2 (Low Score):
Score: 35
Reasoning: User frequently suppresses needs to avoid conflict, leading to built-up resentment and passive-aggressive outbursts.
Patterns: People-pleasing, avoidance of direct confrontation.
Nudge: "I noticed you stayed silent when your boss added to your plate. What's the smallest 'no' you could practice this week?"

Be honest and direct. The user wants the truth, not flattery. If you see concerning patterns, include them in areasForGrowth.

In evidenceSnippets, include 2-5 specific quotes or paraphrases from the journal/chat that support your analysis.

In dynamicNudge, provide a personalized, probing question or nudge based on the user's score and patterns. Use these potential prompts for inspiration:
${category.journalPrompts.join('\n')}

Confidence level should be:
- "low" if there's insufficient data or contradictory signals
- "medium" if there's moderate data showing consistent patterns
- "high" if there's substantial data with clear, consistent patterns`;

  const userPrompt = `=== JOURNAL ENTRIES (last ${lookbackDays} days) ===
${journalContext || '(No recent journal entries)'}

=== CHAT CONVERSATIONS (last ${lookbackDays} days) ===
${chatContext || '(No recent chat messages)'}

Generate a ${category.name} score based on this data.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "category_score_analysis",
          strict: true,
          schema: SCORE_RESPONSE_SCHEMA
        }
      }
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    
    // Parse structured JSON response
    const result: CategoryScoreResult = JSON.parse(responseText);

    // Validate and clamp score
    result.score = Math.max(0, Math.min(100, result.score));

    // Confidence Gate: If confidence is low, provide a fallback reasoning and don't trust the score
    if (result.confidenceLevel === 'low') {
      result.reasoning = "We're starting to see some patterns, but need more data for a definitive assessment. Keep sharing your thoughts to sharpen this insight.";
      // We keep the score but the UI should ideally handle 'low' confidence visually
    }

    return result;

  } catch (error) {
    console.error('Error generating category score:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate category score: ${error.message}`);
    }
    throw new Error('Failed to generate category score');
  }
}

/**
 * Generate and persist a category score to the database
 * @param userId - User ID
 * @param categoryId - Category ID to score
 * @param periodType - 'daily' or 'weekly'
 * @param lookbackDays - Number of days to analyze (default 7)
 */
export async function generateAndPersistCategoryScore(
  userId: string,
  categoryId: string,
  periodType: 'daily' | 'weekly' = 'daily',
  lookbackDays: number = 7
): Promise<CategoryScoreResult & { scoreId: string }> {
  // Generate the score
  const scoreResult = await generateCategoryScore(userId, categoryId, lookbackDays);

  // Don't persist if insufficient data (score would be 0)
  if (scoreResult.score === 0 && scoreResult.confidenceLevel === 'low') {
    throw new Error(scoreResult.reasoning);
  }

  // Determine period boundaries
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setHours(0, 0, 0, 0);
  
  if (periodType === 'weekly') {
    const dayOfWeek = periodStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    periodStart.setDate(periodStart.getDate() - daysToMonday);
  }

  const periodEnd = new Date(periodStart);
  if (periodType === 'daily') {
    periodEnd.setDate(periodEnd.getDate() + 1);
  } else {
    periodEnd.setDate(periodEnd.getDate() + 7);
  }

  // Check for existing score with exact (user, category, periodType, periodStart) match
  // This prevents duplicates even with different lookbackDays
  const allScores = await storage.getCategoryScores(userId, categoryId, periodType, 1);
  const existingScore = allScores.find(score => 
    new Date(score.periodStart).getTime() === periodStart.getTime()
  );

  if (existingScore) {
    // Return existing score data with all fields from scoreResult
    return {
      score: existingScore.score,
      reasoning: existingScore.reasoning || scoreResult.reasoning,
      keyPatterns: existingScore.keyPatterns || scoreResult.keyPatterns,
      progressIndicators: existingScore.progressIndicators || scoreResult.progressIndicators,
      areasForGrowth: existingScore.areasForGrowth || scoreResult.areasForGrowth,
      confidenceLevel: (existingScore.confidenceLevel as any) || scoreResult.confidenceLevel,
      evidenceSnippets: (existingScore.evidenceSnippets as any) || scoreResult.evidenceSnippets,
      dynamicNudge: existingScore.dynamicNudge || scoreResult.dynamicNudge,
      scoreId: existingScore.id
    };
  }

  // Calculate contributors metadata
  const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const journalEntries = await storage.getJournalEntriesByUserId(userId);
  const conversations = await storage.getConversationsByUserId(userId);
  
  const recentJournalCount = journalEntries.filter(j => 
    new Date(j.createdAt) >= cutoffDate
  ).length;

  // Count only user messages (not assistant responses)
  let userMessageCount = 0;
  for (const conv of conversations.slice(0, 3)) {
    const messages = await storage.getMessagesByConversationId(conv.id, userId);
    userMessageCount += messages.filter(m => 
      m.role === 'user' && new Date(m.createdAt) >= cutoffDate
    ).length;
  }

  // Persist to database
  const persistedScore = await storage.createCategoryScore({
    userId,
    categoryId,
    periodType,
    periodStart,
    periodEnd,
    score: scoreResult.score,
    delta: null,
    reasoning: scoreResult.reasoning,
    keyPatterns: scoreResult.keyPatterns,
    progressIndicators: scoreResult.progressIndicators,
    areasForGrowth: scoreResult.areasForGrowth,
    confidenceLevel: scoreResult.confidenceLevel,
    evidenceSnippets: scoreResult.evidenceSnippets as any,
    dynamicNudge: scoreResult.dynamicNudge,
    contributors: {
      journalCount: recentJournalCount,
      messageCount: userMessageCount,
      lookbackDays
    }
  });

  return { ...scoreResult, scoreId: persistedScore.id };
}

export { calculateWeeklySummary } from "./lib/analytics-utils";
