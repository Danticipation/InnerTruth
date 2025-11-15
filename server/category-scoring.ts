import { storage } from "./storage";
import { getCategoryById } from "./categories";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-fake-key-for-replit-ai",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

export interface CategoryScoreResult {
  score: number; // 0-100
  reasoning: string;
  keyPatterns: string[];
  progressIndicators: string[];
  areasForGrowth: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
}

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

  const recentJournals = journalEntries
    .filter(j => new Date(j.createdAt) >= cutoffDate)
    .slice(0, 10); // Max 10 journal entries

  // Get recent messages from all conversations
  let recentMessages: any[] = [];
  for (const conv of conversations.slice(0, 3)) { // Max 3 conversations
    const messages = await storage.getMessagesByConversationId(conv.id);
    const filtered = messages.filter(m => new Date(m.createdAt) >= cutoffDate);
    recentMessages.push(...filtered);
  }
  recentMessages = recentMessages
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20); // Max 20 messages

  // Build context for AI
  const journalContext = recentJournals
    .map(j => `[${new Date(j.createdAt).toLocaleDateString()}] ${j.content}`)
    .join('\n\n');

  const chatContext = recentMessages
    .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n');

  // Check if we have enough data
  const hasMinimumData = recentJournals.length >= 2 || recentMessages.length >= 5;
  if (!hasMinimumData) {
    return {
      score: 0,
      reasoning: "Insufficient data to generate a reliable score. Continue journaling and chatting to build your profile.",
      keyPatterns: [],
      progressIndicators: [],
      areasForGrowth: [],
      confidenceLevel: 'low'
    };
  }

  // Generate score using GPT-4o
  const systemPrompt = `You are an expert psychologist specializing in ${category.name}.

Your task is to analyze user journal entries and chat conversations to generate a score (0-100) that reflects their current level in this category.

CATEGORY: ${category.name}
DESCRIPTION: ${category.description}

SCORING CRITERIA:
${category.scoringCriteria}

FOCUS AREAS:
${category.chatFocusAreas.join('\n')}

Analyze the provided data and return a JSON object with:
{
  "score": <number 0-100>,
  "reasoning": "<2-3 sentences explaining the score>",
  "keyPatterns": ["<pattern 1>", "<pattern 2>", "<pattern 3>"],
  "progressIndicators": ["<positive sign 1>", "<positive sign 2>"],
  "areasForGrowth": ["<area 1>", "<area 2>", "<area 3>"],
  "confidenceLevel": "<low|medium|high>"
}

Be honest and direct. The user wants the truth, not flattery. If you see concerning patterns, include them in areasForGrowth.
Confidence level should be:
- "low" if there's insufficient data or contradictory signals
- "medium" if there's moderate data showing consistent patterns
- "high" if there's substantial data with clear, consistent patterns

Return ONLY valid JSON, no markdown formatting.`;

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
      max_tokens: 1000
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    
    // Parse JSON response
    let result: CategoryScoreResult;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Validate and clamp score
    result.score = Math.max(0, Math.min(100, result.score));

    return result;

  } catch (error) {
    console.error('Error generating category score:', error);
    throw new Error('Failed to generate category score');
  }
}

/**
 * Generate weekly summary score from daily scores
 * @param dailyScores - Array of daily scores from the past week
 */
export function calculateWeeklySummary(dailyScores: number[]): {
  weeklyScore: number;
  trend: 'improving' | 'declining' | 'stable';
  delta: number;
} {
  if (dailyScores.length === 0) {
    return { weeklyScore: 0, trend: 'stable', delta: 0 };
  }

  // Calculate average
  const weeklyScore = Math.round(
    dailyScores.reduce((sum, score) => sum + score, 0) / dailyScores.length
  );

  // Determine trend (compare first half vs second half)
  if (dailyScores.length >= 4) {
    const midpoint = Math.floor(dailyScores.length / 2);
    const firstHalf = dailyScores.slice(0, midpoint);
    const secondHalf = dailyScores.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
    
    const delta = Math.round(secondAvg - firstAvg);
    
    if (delta > 3) {
      return { weeklyScore, trend: 'improving', delta };
    } else if (delta < -3) {
      return { weeklyScore, trend: 'declining', delta };
    }
  }

  return { weeklyScore, trend: 'stable', delta: 0 };
}
