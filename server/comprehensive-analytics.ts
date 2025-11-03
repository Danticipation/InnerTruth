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
    "EXACTLY 8-12 ITEMS REQUIRED",
    "Specific, observable behavior pattern 1 with concrete examples from their data",
    "Pattern 2 with evidence...",
    "Each pattern must be unique and cite specific examples",
    "Be VERY specific, not generic - personalize to this individual"
  ],
  
  "emotionalPatterns": [
    "EXACTLY 8-12 ITEMS REQUIRED",
    "How they process and express emotions - specific patterns with examples",
    "Emotional triggers and reactions observed in their data",
    "Each pattern should be detailed and evidence-based"
  ],
  
  "relationshipDynamics": [
    "EXACTLY 8-12 ITEMS REQUIRED",
    "How they relate to others - attachment style, boundaries, conflicts",
    "Patterns in friendships, romantic relationships, family dynamics",
    "Each insight must be specific to them, not generic relationship advice"
  ],
  
  "copingMechanisms": [
    "EXACTLY 8-12 ITEMS REQUIRED",
    "How they handle stress, anxiety, conflict - cite specific examples",
    "Defense mechanisms they use (both healthy and unhealthy)",
    "Each mechanism should reference actual behaviors from their data"
  ],
  
  "growthAreas": [
    "EXACTLY 8-12 ITEMS REQUIRED - THIS IS MANDATORY",
    "Specific areas for development with actionable, personalized insights",
    "What's blocking their growth - be specific and evidence-based",
    "Each growth area should feel like it was written just for them"
  ],
  
  "strengths": [
    "EXACTLY 8-12 ITEMS REQUIRED",
    "Underutilized or unrecognized strengths with specific evidence",
    "Natural talents and capabilities they might not fully appreciate",
    "Each strength should be backed by examples from their data"
  ],
  
  "blindSpots": [
    "EXACTLY 8-12 ITEMS REQUIRED",
    "What they genuinely can't see about themselves - be specific",
    "Contradictions between self-perception and reality",
    "Each blind spot should be personalized with supporting evidence"
  ],
  
  "valuesAndBeliefs": [
    "EXACTLY 8-12 ITEMS REQUIRED",
    "Core values that drive their decisions - cite examples",
    "Belief systems and worldview evident in their writing/conversations",
    "Each value/belief should be specific to their unique perspective"
  ],
  
  "therapeuticInsights": [
    "EXACTLY 8-12 ITEMS REQUIRED - THIS IS CRITICAL",
    "Deep psychological insights a therapist would notice after months of sessions",
    "Unconscious patterns, inner conflicts, developmental roots",
    "Each insight should be profound, specific, and evidence-based",
    "This is where you reveal what they REALLY need to know about themselves"
  ]
}

CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
1. MANDATORY: Each array MUST contain EXACTLY 8-12 items. No exceptions.
2. Be EXTREMELY SPECIFIC - cite actual examples from their data every time
3. Don't give generic advice - everything must be uniquely personalized to THIS individual
4. Be brutally honest and direct - they want "scary accurate" truth, not platitudes
5. Look for contradictions, patterns across time, and subtle psychological themes
6. This should feel like 5+ years of intensive therapy condensed into insights
7. Quality AND Quantity: Each insight must be both detailed AND there must be 8-12 of them
8. The summary should be comprehensive (3-4 paragraphs minimum), integrative, deeply insightful
9. Make their jaw drop - reveal things about themselves they didn't consciously know
10. Use evidence from ALL data sources (conversations, journals, moods, facts) to support each insight`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 6000,  // Increased for comprehensive output
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0].message.content || "{}");
      
      // Validate and enforce that we got the required depth (8-12 items per category)
      const arrayFields = [
        'behavioralPatterns', 
        'emotionalPatterns', 
        'relationshipDynamics', 
        'copingMechanisms',
        'growthAreas',
        'strengths',
        'blindSpots',
        'valuesAndBeliefs',
        'therapeuticInsights'
      ];

      const validationIssues: string[] = [];
      arrayFields.forEach(field => {
        const arr = analysis[field] || [];
        
        if (arr.length < 8) {
          validationIssues.push(`${field} has only ${arr.length} items (minimum 8 required)`);
        } else if (arr.length > 12) {
          // Truncate to 12 items and log warning
          analysis[field] = arr.slice(0, 12);
          validationIssues.push(`${field} had ${arr.length} items (truncated to 12)`);
        }
      });

      // If any category has fewer than 8 items, reject the analysis
      const criticalIssues = validationIssues.filter(issue => issue.includes('minimum'));
      if (criticalIssues.length > 0) {
        console.error('AI analysis failed validation - insufficient depth:', criticalIssues);
        throw new Error(`Analysis does not meet minimum depth requirements. ${criticalIssues.join(', ')}`);
      }

      if (validationIssues.length > 0) {
        console.warn('AI analysis validation notices:', validationIssues);
      }
      
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
