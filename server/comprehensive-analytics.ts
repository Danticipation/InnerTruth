import OpenAI from "openai";
import { storage } from "./storage";
import type { MemoryFact, Message, JournalEntry, MoodEntry } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface ComprehensiveProfile {
  summary: string;
  coreTraits: {
    big5: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      emotionalStability: number;
    };
    archetype: string;
    dominantTraits: string[];
  };
  behavioralPatterns: string[];
  emotionalPatterns: string[];
  relationshipDynamics: string[];
  copingMechanisms: string[];
  growthAreas: string[];
  strengths: string[];
  blindSpots: string[];
  valuesAndBeliefs: string[];
  therapeuticInsights: string[];
  statistics: {
    totalConversations: number;
    totalJournalEntries: number;
    totalMoodEntries: number;
    totalMemoryFacts: number;
    averageMoodScore: number;
    journalStreak: number;
    mostCommonEmotions: string[];
    mostActiveCategories: string[];
    engagementScore: number;
  };
}

export class ComprehensiveAnalytics {
  async generatePersonalityProfile(userId: string): Promise<ComprehensiveProfile | null> {
    try {
      // Gather ALL data sources
      const conversations = await storage.getConversationsByUserId(userId);
      const journalEntries = await storage.getJournalEntriesByUserId(userId);
      const moodEntries = await storage.getMoodEntriesByUserId(userId);
      const memoryFacts = await storage.getMemoryFactsByUserId(userId);
      
      // Collect all messages from conversations
      let allMessages: Message[] = [];
      for (const conv of conversations) {
        const msgs = await storage.getMessagesByConversationId(conv.id);
        allMessages = allMessages.concat(msgs);
      }

      // Calculate statistics
      const statistics = this.calculateStatistics(
        conversations,
        journalEntries,
        moodEntries,
        memoryFacts
      );

      // If not enough data, return null
      if (allMessages.length < 10 && journalEntries.length < 3) {
        return null;
      }

      // Prepare comprehensive context for AI analysis
      const profile = await this.analyzeWithAI(
        allMessages,
        journalEntries,
        moodEntries,
        memoryFacts,
        statistics
      );

      return profile;
    } catch (error) {
      console.error("Error generating comprehensive profile:", error);
      return null;
    }
  }

  private calculateStatistics(
    conversations: any[],
    journalEntries: JournalEntry[],
    moodEntries: MoodEntry[],
    memoryFacts: MemoryFact[]
  ) {
    // Calculate average mood
    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, m) => sum + m.intensity, 0) / moodEntries.length
      : 0;

    // Calculate journal streak
    const journalStreak = this.calculateStreak(journalEntries.map(j => j.createdAt));

    // Find most common emotions from mood entries
    const moodCounts = new Map<string, number>();
    moodEntries.forEach(m => {
      moodCounts.set(m.mood, (moodCounts.get(m.mood) || 0) + 1);
    });
    const mostCommonEmotions = Array.from(moodCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mood]) => mood);

    // Find most active fact categories
    const categoryCounts = new Map<string, number>();
    memoryFacts.forEach(f => {
      categoryCounts.set(f.category, (categoryCounts.get(f.category) || 0) + 1);
    });
    const mostActiveCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, Math.round(
      (conversations.length * 10) +
      (journalEntries.length * 15) +
      (moodEntries.length * 5) +
      (memoryFacts.length * 2)
    ));

    return {
      totalConversations: conversations.length,
      totalJournalEntries: journalEntries.length,
      totalMoodEntries: moodEntries.length,
      totalMemoryFacts: memoryFacts.length,
      averageMoodScore: Math.round(avgMood * 10) / 10,
      journalStreak,
      mostCommonEmotions,
      mostActiveCategories,
      engagementScore,
    };
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    const sortedDates = dates
      .map(d => new Date(d).setHours(0, 0, 0, 0))
      .sort((a, b) => b - a);

    let streak = 1;
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const dayDiff = (sortedDates[i] - sortedDates[i + 1]) / oneDayMs;
      if (dayDiff === 1) {
        streak++;
      } else if (dayDiff > 1) {
        break;
      }
    }

    return streak;
  }

  private async analyzeWithAI(
    messages: Message[],
    journals: JournalEntry[],
    moods: MoodEntry[],
    facts: MemoryFact[],
    statistics: any
  ): Promise<ComprehensiveProfile> {
    // Prepare data sections for AI
    const conversationText = messages
      .slice(-100)  // Last 100 messages
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    const journalText = journals
      .slice(-20)  // Last 20 journal entries
      .map(j => `[${new Date(j.createdAt).toLocaleDateString()}]\n${j.content}`)
      .join("\n\n---\n\n");

    const moodText = moods
      .slice(-30)  // Last 30 mood entries
      .map(m => `${m.mood} (${m.intensity}/10)${m.note ? ` - ${m.note}` : ''}`)
      .join("\n");

    // Group facts by category
    const factsByCategory = facts.reduce((acc, fact) => {
      if (!acc[fact.category]) acc[fact.category] = [];
      acc[fact.category].push(`• ${fact.factContent} (confidence: ${fact.confidence}%)`);
      return acc;
    }, {} as Record<string, string[]>);

    const factsText = Object.entries(factsByCategory)
      .map(([category, items]) => `${category.toUpperCase()}:\n${items.join("\n")}`)
      .join("\n\n");

    const analysisPrompt = `You are conducting an EXTREMELY COMPREHENSIVE personality analysis for therapeutic and self-discovery purposes. This is not a surface-level assessment - dig DEEP into every aspect of this person's psychology, behavior, and inner world.

DATA SOURCES:

=== CONVERSATIONS (Last 100 messages) ===
${conversationText}

=== JOURNAL ENTRIES (Last 20 entries) ===
${journalText}

=== MOOD TRACKING (Last 30 entries) ===
${moodText}

=== EXTRACTED FACTS (${facts.length} total facts across categories) ===
${factsText}

=== STATISTICS ===
${JSON.stringify(statistics, null, 2)}

ANALYSIS REQUIREMENTS:

Provide a deeply comprehensive JSON analysis with the following structure:

{
  "summary": "A 3-4 paragraph narrative summary that synthesizes their entire personality, like a therapist's comprehensive case formulation. Include their core struggles, patterns, growth trajectory, and essential nature.",
  
  "coreTraits": {
    "big5": {
      "openness": 0-100,
      "conscientiousness": 0-100,
      "extraversion": 0-100,
      "agreeableness": 0-100,
      "emotionalStability": 0-100
    },
    "archetype": "One concise personality archetype that captures their essence",
    "dominantTraits": ["3-5 most defining personality characteristics"]
  },
  
  "behavioralPatterns": [
    "Specific, observable behavior pattern 1 with concrete examples",
    "Pattern 2...",
    "5-10 patterns total - be VERY specific, not generic"
  ],
  
  "emotionalPatterns": [
    "How they process and express emotions - specific patterns",
    "Emotional triggers and reactions",
    "5-8 detailed emotional patterns"
  ],
  
  "relationshipDynamics": [
    "How they relate to others - attachment style, boundaries, conflicts",
    "Patterns in friendships, romantic relationships, family",
    "5-8 specific relationship insights"
  ],
  
  "copingMechanisms": [
    "How they handle stress, anxiety, conflict",
    "Defense mechanisms they use (healthy and unhealthy)",
    "5-8 coping strategies observed"
  ],
  
  "growthAreas": [
    "Specific areas for development with actionable insights",
    "What's blocking their growth",
    "8-12 detailed growth opportunities"
  ],
  
  "strengths": [
    "Underutilized or unrecognized strengths",
    "Natural talents and capabilities",
    "6-10 specific strengths with evidence"
  ],
  
  "blindSpots": [
    "What they can't see about themselves",
    "Contradictions between self-perception and reality",
    "6-10 significant blind spots"
  ],
  
  "valuesAndBeliefs": [
    "Core values that drive decisions",
    "Belief systems and worldview",
    "6-8 fundamental values/beliefs"
  ],
  
  "therapeuticInsights": [
    "Deep psychological insights a therapist would notice",
    "Unconscious patterns, inner conflicts, developmental roots",
    "8-12 profound therapeutic-level insights"
  ]
}

CRITICAL INSTRUCTIONS:
1. Be EXTREMELY SPECIFIC - cite actual examples from their data
2. Don't give generic advice - everything should be personalized
3. Be honest and direct - they want the truth, not platitudes
4. Look for contradictions, patterns across time, and subtle themes
5. This should feel like years of therapy condensed into insights
6. Each array should have MULTIPLE detailed entries (not just 2-3)
7. The summary should be comprehensive and integrative, not superficial`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0].message.content || "{}");
      
      return {
        ...analysis,
        statistics
      };
    } catch (error) {
      console.error("Error in AI analysis:", error);
      throw error;
    }
  }
}

export const comprehensiveAnalytics = new ComprehensiveAnalytics();
