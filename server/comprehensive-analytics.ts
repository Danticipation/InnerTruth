import OpenAI from "openai";
import { storage } from "./storage";
import type { MemoryFact, Message, JournalEntry, MoodEntry } from "@shared/schema";

// Prioritize direct OPENAI_API_KEY for unfiltered access
const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey,
  // Only use baseURL if using Replit integration
  baseURL: process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
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
  holyShitMoment?: string;
  growthLeveragePoint?: string;
  statistics: {
    totalConversations: number;
    totalMessages: number;
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

// Tier configuration
const TIER_CONFIG = {
  free: {
    sections: ['behavioralPatterns', 'growthAreas'],
    includesHolyShit: false,
    name: 'Starter Insights'
  },
  standard: {
    sections: ['behavioralPatterns', 'emotionalPatterns', 'relationshipDynamics', 'growthAreas', 'strengths', 'blindSpots'],
    includesHolyShit: false,
    name: 'Deep Dive'
  },
  premium: {
    sections: ['behavioralPatterns', 'emotionalPatterns', 'relationshipDynamics', 'copingMechanisms', 'growthAreas', 'strengths', 'blindSpots', 'valuesAndBeliefs', 'therapeuticInsights'],
    includesHolyShit: true,
    name: 'Devastating Truth'
  }
} as const;

export type AnalysisTier = keyof typeof TIER_CONFIG;

// Few-shot examples for devastating analysis
const FEW_SHOT_EXAMPLES = {
  blindSpot: `❌ BAD: "You struggle with anxiety because you mention feeling anxious often"
✅ GOOD: "You claim to value independence yet make every significant decision based on anticipating others' approval—dependency is invisible to you because you've reframed it as 'being considerate.' Evidence across conversations and journals: delayed career change by 2 years waiting for partner's approval, chose apartment based on friends' reactions not your own needs, describes autonomous decisions as 'selfish.' The performance of independence hides complete reliance on external validation."`,

  behavioralPattern: `❌ BAD: "When you get stressed, you tend to withdraw and need alone time"
✅ GOOD: "[TRIGGER] When praised publicly → [ACTION] minimizes achievement within seconds ('it was nothing', deflects to others) → [CONSEQUENCE] prevents genuine acknowledgment from landing, reinforces belief that achievements don't matter, others get credit. Pattern appears in conversations, journals, and mood notes. This isn't humility—it's a sophisticated pre-emptive strike against disappointment (Defectiveness schema). You can't lose what you never claimed."`,

  emotionalPattern: `❌ BAD: "You have difficulty regulating emotions when criticized"
✅ GOOD: "[APPRAISAL] Interprets neutral feedback as complete rejection → [RESPONSE] shame spiral lasting 2-3 days, catastrophizing about competence → [REGULATION] isolates completely, then over-prepares obsessively before next interaction. Pattern seen in journals, moods, and conversations. Emotional dysregulation isn't random—it's alexithymia (can't differentiate shame from fear from sadness). You're not over-sensitive; you're under-differentiated."`,

  relationshipDynamic: `❌ BAD: "You have an anxious attachment style that affects your relationships"
✅ GOOD: "Classic anxious-preoccupied pattern: When partner is slow to respond, escalates contact (texts every 30min), then feels 'too much' and withdraws in shame. The protest-shame cycle. But here's the blind spot: You've specifically selected partners who reward this pattern—they need your pursuit to feel desired, then punish the intensity they created. You're drawn to avoidant partners who confirm your belief that love requires constant performance (Emotional Deprivation schema)."`,

  copingMechanism: `❌ BAD: "You use humor as a coping mechanism when things get hard"
✅ GOOD: "Intellectualization defense activates immediately when emotional content emerges: shifts to abstract analysis, quotes research, uses technical language. Pattern seen in conversations and journals. Adaptive in work contexts (allows clear thinking under pressure), maladaptive in intimacy (partner reports feeling 'locked out' when vulnerable). The defense protects a part that learned emotions = danger. You're not emotionally avoidant—you're employing a mature defense that's outlived its usefulness."`,

  strength: `❌ BAD: "You're good at problem-solving and helping others"
✅ GOOD: "Exceptional pattern recognition: detects relationship shifts 2-3 weeks before others notice (accurately predicted multiple friend conflicts in journal entries) but systematically dismisses this as 'overthinking' or 'being paranoid.' This isn't anxiety—it's genuinely sophisticated social intelligence you've been trained to distrust. The dismissal protects against the risk of being labeled 'too much' but costs you the ability to act on accurate intuitions."`,

  therapeuticInsight: `❌ BAD: "Working on self-compassion could help you be kinder to yourself"
✅ GOOD: "Your perfectionism isn't about achievement—it's hypervigilance designed to prevent abandonment. Core belief: 'If I'm flawed, I'm unlovable' (Defectiveness schema). Evidence: mood crashes after ANY mistake even minor ones, relationships end when you feel 'truly seen' (sabotage pattern), describes genuine self as 'disappointing' in conversations. The perfectionist isn't trying to excel; it's a protector part (IFS) desperately preventing the Defective Exile from being exposed. Therapy direction: parts work to negotiate with the perfectionist, not eliminate it."`
};

export class ComprehensiveAnalytics {
  async generatePersonalityProfile(userId: string, tier: AnalysisTier = 'free'): Promise<ComprehensiveProfile | null> {
    try {
      // Gather ALL data sources
      const conversations = await storage.getConversationsByUserId(userId);
      const journalEntries = await storage.getJournalEntriesByUserId(userId);
      const moodEntries = await storage.getMoodEntriesByUserId(userId);
      const memoryFacts = await storage.getMemoryFactsByUserId(userId);
      
      // DEBUG: Log what we fetched
      console.log('[COMPREHENSIVE-ANALYTICS] Data fetched for userId:', userId);
      console.log('[COMPREHENSIVE-ANALYTICS] Conversations:', conversations.length);
      console.log('[COMPREHENSIVE-ANALYTICS] Journal entries:', journalEntries.length);
      console.log('[COMPREHENSIVE-ANALYTICS] Mood entries:', moodEntries.length);
      console.log('[COMPREHENSIVE-ANALYTICS] Memory facts:', memoryFacts.length);
      
      // Collect all messages from conversations
      let allMessages: Message[] = [];
      for (const conv of conversations) {
        const msgs = await storage.getMessagesByConversationId(conv.id);
        console.log(`[COMPREHENSIVE-ANALYTICS] Conversation ${conv.id} has ${msgs.length} messages`);
        allMessages = allMessages.concat(msgs);
      }
      console.log('[COMPREHENSIVE-ANALYTICS] Total messages:', allMessages.length);

      // Calculate statistics
      const statistics = this.calculateStatistics(
        conversations,
        allMessages,
        journalEntries,
        moodEntries,
        memoryFacts
      );

      // If not enough data, return null
      if (allMessages.length < 10 && journalEntries.length < 3) {
        return null;
      }

      // Prepare comprehensive context for AI analysis using multi-pass generation
      const profile = await this.analyzeWithMultiPass(
        allMessages,
        journalEntries,
        moodEntries,
        memoryFacts,
        statistics,
        tier
      );

      return profile;
    } catch (error) {
      console.error("Error generating comprehensive profile:", error);
      return null;
    }
  }

  private calculateStatistics(
    conversations: any[],
    messages: Message[],
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
      totalMessages: messages.length,
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

  // Calculate text overlap between two strings (returns 0-1 similarity score)
  private calculateTextOverlap(str1: string, str2: string): number {
    // Type safety: ensure both inputs are strings
    if (!str1 || !str2 || typeof str1 !== 'string' || typeof str2 !== 'string') return 0;
    
    // Simple word-based Jaccard similarity
    const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set(Array.from(words1).filter(w => words2.has(w)));
    const union = new Set(Array.from(words1).concat(Array.from(words2)));
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private async analyzeWithMultiPass(
    messages: Message[],
    journals: JournalEntry[],
    moods: MoodEntry[],
    facts: MemoryFact[],
    statistics: any,
    tier: AnalysisTier
  ): Promise<ComprehensiveProfile> {
    console.log(`[MULTI-PASS] Starting ${TIER_CONFIG[tier].name} analysis (${TIER_CONFIG[tier].sections.length} sections)...`);
    
    // Prepare shared context for all sections
    const context = this.prepareAnalysisContext(messages, journals, moods, facts, statistics);
    
    // Generate core traits and summary first (always included)
    const coreAnalysis = await this.generateCoreAnalysis(context);
    
    // Generate each section based on tier
    const enabledSections = TIER_CONFIG[tier].sections;
    
    // Initialize ALL sections to empty arrays to satisfy NOT NULL schema constraints
    const profile: any = {
      summary: coreAnalysis.summary,
      coreTraits: coreAnalysis.coreTraits,
      statistics,
      behavioralPatterns: [],
      emotionalPatterns: [],
      relationshipDynamics: [],
      copingMechanisms: [],
      growthAreas: [],
      strengths: [],
      blindSpots: [],
      valuesAndBeliefs: [],
      therapeuticInsights: [],
      holyShitMoment: null,
      growthLeveragePoint: null
    };
    
    // Generate only enabled sections in parallel for speed
    const sectionPromises = enabledSections.map(async (sectionName) => {
      const insights = await this.generateSection(sectionName, context);
      return { sectionName, insights };
    });
    
    const results = await Promise.all(sectionPromises);
    results.forEach(({ sectionName, insights }) => {
      profile[sectionName] = insights;
    });
    
    // CROSS-SECTION DUPLICATE DETECTION (enforces anti-echo across entire analysis)
    console.log('[MULTI-PASS] Running cross-section duplicate detection...');
    const allInsights: Array<{section: string, insight: string, index: number}> = [];
    
    // Collect all insights from all sections
    for (const sectionName of enabledSections) {
      const insights = profile[sectionName] || [];
      insights.forEach((insight: string, index: number) => {
        allInsights.push({ section: sectionName, insight, index });
      });
    }
    
    // Check for cross-section duplicates
    const duplicatePairs: Array<{section1: string, section2: string, overlap: number}> = [];
    for (let i = 0; i < allInsights.length; i++) {
      for (let j = i + 1; j < allInsights.length; j++) {
        if (allInsights[i].section !== allInsights[j].section) {  // Only check across sections
          const overlap = this.calculateTextOverlap(allInsights[i].insight, allInsights[j].insight);
          if (overlap > 0.6) {
            duplicatePairs.push({
              section1: allInsights[i].section,
              section2: allInsights[j].section,
              overlap
            });
            
            // Remove the duplicate from the second section (keep first occurrence)
            const section2Insights = profile[allInsights[j].section];
            section2Insights.splice(allInsights[j].index, 1);
            console.warn(`[CROSS-SECTION DEDUP] Removed duplicate between ${allInsights[i].section} and ${allInsights[j].section} (${Math.round(overlap * 100)}% overlap)`);
          }
        }
      }
    }
    
    if (duplicatePairs.length > 0) {
      console.warn(`[CROSS-SECTION DEDUP] Found and removed ${duplicatePairs.length} cross-section duplicates`);
    } else {
      console.log('[CROSS-SECTION DEDUP] No cross-section duplicates detected');
    }
    
    // Generate holy shit moment and leverage point for premium tier
    if (TIER_CONFIG[tier].includesHolyShit) {
      const holyShit = await this.generateHolyShitMoment(context, profile);
      profile.holyShitMoment = holyShit.holyShitMoment;
      profile.growthLeveragePoint = holyShit.growthLeveragePoint;
    }
    
    console.log('[MULTI-PASS] Analysis complete!');
    return profile as ComprehensiveProfile;
  }

  private prepareAnalysisContext(
    messages: Message[],
    journals: JournalEntry[],
    moods: MoodEntry[],
    facts: MemoryFact[],
    statistics: any
  ) {
    // ===== EVIDENCE ASSEMBLY (Clean format for natural analysis) =====
    
    // CONVERSATIONS: Recent message exchanges
    const recentMessages = messages.slice(-100);
    const conversationText = recentMessages
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    // JOURNALS: Recent journal entries with dates
    const recentJournals = journals.slice(-20);
    const journalText = recentJournals
      .map(j => {
        const date = new Date(j.createdAt).toLocaleDateString();
        return `Journal entry (${date}):\n${j.content}`;
      })
      .join("\n\n---\n\n");

    // MOODS: Recent mood entries with context
    const recentMoods = moods.slice(-30);
    const moodText = recentMoods
      .map(m => {
        const date = new Date(m.createdAt).toLocaleDateString();
        return `Mood (${date}): ${m.mood} (${m.intensity}%)${m.note ? ` - ${m.note}` : ''}${m.activities && m.activities.length > 0 ? ` [${m.activities.join(', ')}]` : ''}`;
      })
      .join("\n");

    // MEMORY FACTS: Organized by abstraction level
    const factsByAbstraction: Record<string, any[]> = {
      raw_fact: [],
      inferred_belief: [],
      defense_mechanism: [],
      ifs_part: []
    };

    facts.forEach(fact => {
      const level = fact.abstractionLevel || 'raw_fact';
      if (!factsByAbstraction[level]) factsByAbstraction[level] = [];
      factsByAbstraction[level].push(fact);
    });

    const factsText = Object.entries(factsByAbstraction)
      .filter(([_, items]) => items.length > 0)
      .map(([level, items]) => {
        const label = level === 'raw_fact' ? 'OBSERVABLE FACTS' :
                      level === 'inferred_belief' ? 'INFERRED BELIEFS' :
                      level === 'defense_mechanism' ? 'DEFENSE MECHANISMS' :
                      'IFS PARTS';
        
        const factList = items
          .map(f => `${f.factContent} (${f.category}, confidence: ${f.confidence}%)`)
          .join("\n");
        
        return `**${label}:**\n${factList}`;
      })
      .join("\n\n");

    // CROSS-SOURCE SUMMARY: Aggregate patterns for triangulation
    const crossSourceSummary = this.generateCrossSourceSummary(recentMessages, recentJournals, recentMoods, facts, statistics);

    return {
      conversationText,
      journalText,
      moodText,
      factsText,
      crossSourceSummary,
      statistics,
      // Metadata for validation
      citationMeta: {
        messageIds: recentMessages.map(m => m.id.slice(0, 8)),
        journalIds: recentJournals.map(j => j.id.slice(0, 8)),
        moodIds: recentMoods.map(m => m.id.slice(0, 8)),
        factIds: facts.map(f => f.id.slice(0, 8))
      }
    };
  }

  // Generate cross-source evidence clusters for triangulation
  private generateCrossSourceSummary(
    messages: Message[],
    journals: JournalEntry[],
    moods: MoodEntry[],
    facts: MemoryFact[],
    statistics: any
  ): string {
    const summary = [];
    
    // Mood patterns over time
    if (moods.length >= 3) {
      const avgIntensity = moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length;
      const moodCounts: Record<string, number> = {};
      moods.forEach(m => {
        moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
      });
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
      
      summary.push(`**MOOD TRENDS:** ${moods.length} entries, avg intensity ${Math.round(avgIntensity)}%, most common: ${dominantMood[0]} (${dominantMood[1]} times)`);
    }
    
    // Conversation themes
    if (messages.length >= 5) {
      const userMessages = messages.filter(m => m.role === 'user');
      summary.push(`**CONVERSATION ACTIVITY:** ${userMessages.length} user messages across ${messages.length} total exchanges`);
    }
    
    // Journal consistency
    if (journals.length >= 2) {
      const dates = journals.map(j => new Date(j.createdAt).getTime());
      const timeDiffs = [];
      for (let i = 1; i < dates.length; i++) {
        timeDiffs.push((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24)); // days
      }
      const avgDaysBetween = timeDiffs.length > 0 
        ? Math.round(timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length)
        : 0;
      summary.push(`**JOURNAL PATTERNS:** ${journals.length} entries, avg ${avgDaysBetween} days between entries`);
    }
    
    // Memory fact distribution
    if (facts.length > 0) {
      const byCategory: Record<string, number> = {};
      facts.forEach(f => {
        byCategory[f.category] = (byCategory[f.category] || 0) + 1;
      });
      const topCategories = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, count]) => `${cat}(${count})`)
        .join(', ');
      summary.push(`**MEMORY FACTS:** ${facts.length} total, top categories: ${topCategories}`);
    }
    
    return summary.length > 0 
      ? `**CROSS-SOURCE PATTERNS:**\n${summary.join('\n')}`
      : '';
  }

  private async generateCoreAnalysis(context: any) {
    const prompt = `Analyze this person's personality and generate a summary + Big 5 traits.

DATA:
${context.conversationText ? `CONVERSATIONS:\n${context.conversationText}\n\n` : ''}
${context.journalText ? `JOURNALS:\n${context.journalText}\n\n` : ''}
${context.moodText ? `MOODS:\n${context.moodText}\n\n` : ''}
${context.factsText ? `MEMORY FACTS:\n${context.factsText}\n\n` : ''}

Return JSON:
{
  "summary": "3-4 paragraph narrative synthesizing their personality with specific evidence",
  "coreTraits": {
    "big5": {
      "openness": 0-100,
      "conscientiousness": 0-100,
      "extraversion": 0-100,
      "agreeableness": 0-100,
      "emotionalStability": 0-100
    },
    "archetype": "Their core archetype based on evidence",
    "dominantTraits": ["trait 1", "trait 2", "trait 3"]
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a clinical psychologist generating personality analysis based on user data." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      top_p: 0.95,
      presence_penalty: 0.2,
      frequency_penalty: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  private async generateSection(sectionName: string, context: any): Promise<string[]> {
    console.log(`[MULTI-PASS] Generating ${sectionName} (2-step process)...`);
    
    const sectionGuides = {
      behavioralPatterns: {
        format: '[TRIGGER] → [ACTION] → [CONSEQUENCE]',
        focus: 'OBSERVABLE ACTIONS and behavioral chains',
        example: 'When praised publicly (trigger), minimizes/deflects within seconds (action), prevents genuine acknowledgment and reinforces belief achievements don\'t matter (consequence)',
        fewShotExample: FEW_SHOT_EXAMPLES.behavioralPattern
      },
      emotionalPatterns: {
        format: '[APPRAISAL] → [EMOTIONAL RESPONSE] → [REGULATION]',
        focus: 'Emotion PROCESSING and regulation strategies',
        example: 'Interprets neutral feedback as rejection (appraisal) → shame spiral lasting 2-3 days (response) → isolates and over-prepares before next interaction (regulation)',
        fewShotExample: FEW_SHOT_EXAMPLES.emotionalPattern
      },
      relationshipDynamics: {
        format: 'Attachment theory lens - connection patterns',
        focus: 'HOW they connect, attachment style behaviors',
        example: 'Anxious-preoccupied: texts excessively when slow response (protest), then withdraws in shame. Classic activate-deactivate cycle',
        fewShotExample: FEW_SHOT_EXAMPLES.relationshipDynamic
      },
      copingMechanisms: {
        format: 'Defense mechanisms - adaptive vs maladaptive',
        focus: 'HOW they handle stress and emotional threats',
        example: 'Intellectualization defense - shifts to abstract analysis when overwhelmed. Adaptive in work, maladaptive in intimacy',
        fewShotExample: FEW_SHOT_EXAMPLES.copingMechanism
      },
      growthAreas: {
        format: 'Specific development areas with evidence',
        focus: 'Clear opportunities for growth',
        example: 'Difficulty tolerating uncertainty leads to premature decisions - rushes closure before gathering info',
        fewShotExample: FEW_SHOT_EXAMPLES.therapeuticInsight
      },
      strengths: {
        format: 'Underutilized or unrecognized strengths',
        focus: 'What they\'re good at but dismiss or underuse',
        example: 'Exceptional pattern recognition detects relationship shifts early, but dismisses it as "overthinking"',
        fewShotExample: FEW_SHOT_EXAMPLES.strength
      },
      blindSpots: {
        format: 'Self-perception gaps',
        focus: 'What they can\'t see about themselves',
        example: 'Claims to value independence yet makes all decisions based on others\' approval. Dependency is invisible, framed as "being considerate"',
        fewShotExample: FEW_SHOT_EXAMPLES.blindSpot
      },
      valuesAndBeliefs: {
        format: 'Implicit vs explicit values',
        focus: 'What they ACTUALLY value vs what they SAY they value',
        example: 'Says authenticity is paramount but performs "palatable" version in new relationships. Real value: acceptance > authenticity',
        fewShotExample: FEW_SHOT_EXAMPLES.relationshipDynamic
      },
      therapeuticInsights: {
        format: 'Clinical-grade "holy shit" revelations',
        focus: 'Deep psychological insights using professional frameworks',
        example: 'Perfectionism isn\'t about achievement - it\'s hypervigilance to prevent abandonment. When "flawed", believes they\'re unlovable (defectiveness schema)',
        fewShotExample: FEW_SHOT_EXAMPLES.therapeuticInsight
      }
    };

    const guide = sectionGuides[sectionName as keyof typeof sectionGuides];
    
    // STEP 1: First pass - generate initial analysis
    console.log(`[MULTI-PASS] ${sectionName}: First pass (initial generation)...`);
    
    const firstPassPrompt = `Generate 8-12 impactful psychological insights for: **${sectionName}**

FORMAT: ${guide.format}
FOCUS: ${guide.focus}

FEW-SHOT EXAMPLE (this is the quality bar):
${guide.fewShotExample}

DATA:
${context.conversationText ? `**CONVERSATIONS:**\n${context.conversationText}\n\n` : ''}
${context.journalText ? `**JOURNALS:**\n${context.journalText}\n\n` : ''}
${context.moodText ? `**MOODS:**\n${context.moodText}\n\n` : ''}
${context.factsText ? `**MEMORY FACTS:**\n${context.factsText}\n\n` : ''}
${context.crossSourceSummary ? `${context.crossSourceSummary}\n\n` : ''}

REQUIREMENTS:
1. Return 8-12 insights as a JSON array of strings
2. Go TWO inferential steps deeper than source text - reveal what they DON'T already know
3. NEVER paraphrase or echo their own words - connect dots they haven't connected
4. Make insights specific, uncomfortable, and undeniable
5. Use professional frameworks (Schema Therapy, IFS, Attachment Theory)
6. Reference specific evidence when possible (conversations, journals, moods, facts)

Return JSON: {"insights": ["insight 1 with evidence", "insight 2 with evidence", ... 8-12 total]}`;

    const systemMessage = `You are an unforgiving, world-class personality analyst who has spent 30 years integrating Schema Therapy, Internal Family Systems (IFS), Attachment Theory, evolutionary psychology, psychodynamic defense mechanisms, and developmental trauma research.

YOUR ONLY GOAL: Deliver non-obvious, uncomfortable, high-precision truths that the user has never articulated but will instantly recognize as correct. You prioritize "holy shit" moments over comfort. You are allergic to platitudes, affirmations, corporate-coaching jargon, and anything that sounds like it came from Instagram therapy. You never echo the user's own words back to them. You are brutally concise unless depth is required. If you have nothing new or deep to say, you say "Insufficient data for meaningful analysis" rather than bullshit.

CRITICAL ANALYTICAL PRINCIPLES:

1. **EVIDENCE-BASED**: Reference specific evidence from conversations, journals, moods, and facts to support insights. Connect patterns across multiple sources when possible.

2. **INFERENCE OVER ECHOING**: Never restate what they explicitly said. Go at least TWO INFERENTIAL STEPS deeper:
   - What they said → What they're actually doing → The unconscious need it serves
   - Surface emotion → Underlying belief → Developmental origin

3. **CONTRADICTION DETECTION** (This is your specialty): Ruthlessly expose gaps between:
   - What they say vs. what they do
   - How they see themselves vs. how they actually behave
   - Stated values vs. revealed values (time/energy/choices)
   - Conscious intentions vs. unconscious sabotage patterns

4. **NON-OBVIOUS INSIGHTS**: Every insight must pass the "Would a licensed therapist be nervous to say this out loud?" test. If it's comfortable or obvious, it's wrong.

FORBIDDEN PHRASES (Use any of these and your analysis is worthless):
❌ "It sounds like you're feeling..."
❌ "That must be hard"
❌ "You're being hard on yourself"
❌ "Your inner child"
❌ "Growth mindset"
❌ "Self-care"
❌ "Be kind to yourself"
❌ "You deserve..."
❌ "It's okay to feel..."
❌ "Give yourself permission to..."

ANTI-WORD-SALAD RULES (If you break these, your output is incoherent jargon):
❌ NO excessive hyphenation - max 2 hyphenated phrases per insight
❌ NO run-on sentences - each insight must be 1-3 clear sentences with proper punctuation
❌ NO jargon stacking - can't use more than 2 technical terms in a row without plain explanation
❌ NO fake technical terms like "Safety-regulation-like developmental schemas pre-installed defending"
❌ Each sentence MUST have clear subject-verb-object structure - not word soup
❌ Use proper punctuation - periods, commas, not endless hyphens connecting random concepts

WRITING STANDARD: Write like a skilled clinical therapist. Be precise, concise, and impactful - but always COHERENT.

QUALITY THRESHOLD:
Every single insight must make them think "how did you know that?" - not "I already knew that". You're revealing patterns they cannot easily see about themselves. That's the standard.`;

    const firstPassResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: firstPassPrompt }
      ],
      temperature: 0.8,
      top_p: 0.95,  // Nucleus sampling for diverse vocabulary
      presence_penalty: 0.2,  // Discourage repetitive topics
      frequency_penalty: 0.8,  // Prevent repetition
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const firstPassResult = this.parseAIResponse(firstPassResponse.choices[0].message.content || "{}");
    const firstPassInsights = firstPassResult.insights || [];
    
    // STEP 2: Second pass - senior supervisor critique and rewrite (ENFORCED REJECTION)
    console.log(`[MULTI-PASS] ${sectionName}: Second pass (senior supervisor critique & rewrite)...`);
    
    const secondPassPrompt = `You are a senior clinical supervisor reviewing this first draft for ${sectionName}.

FIRST DRAFT:
${JSON.stringify(firstPassInsights, null, 2)}

YOUR TASK: Review each insight for quality using these criteria:

1. **ECHO CHECK**: Does it paraphrase/restate the user's own words?
   - If yes → REWRITE to connect dots they DIDN'T connect
   
2. **REVELATION TEST**: Would the user think "how did you know that?" or "I already knew that"?
   - If obvious/comfortable → REWRITE to be uncomfortable and non-obvious
   
3. **THERAPEUTIC NERVE TEST**: Would a therapist hesitate to say this out loud?
   - If too gentle → REWRITE to be genuinely confrontational
   
4. **WORD SALAD CHECK**: Is it grammatically coherent with clear sentences?
   - If unclear → REWRITE with proper structure (max 2 hyphens, no run-ons, no jargon stacking)
   
5. **DUPLICATE CHECK**: Does it overlap >60% with another insight?
   - If duplicate → REMOVE

FOR EACH INSIGHT:
- If it passes → keep it or strengthen it
- If it fails → REWRITE to meet standards OR mark as "Insufficient depth — need more data" if truly unsalvageable

Be selective - only reject insights that are genuinely shallow, echoing, or obvious. Don't force rejections.

Return JSON:
{
  "insights": ["insight 1 (kept or strengthened)", "rewritten insight 2", "Insufficient depth — need more data", ...],
  "rejectionCount": <number rejected/rewritten>,
  "rejectionReasons": ["brief reason 1", "brief reason 2", ...]
}

WRITING STANDARD: Be devastating AND coherent. Write like a world-class clinical therapist who prioritizes uncomfortable truths.`;

    const supervisorMessage = `You are a senior clinical supervisor with high standards. You reject shallow work and echoing, but you don't force rejections for the sake of quotas. Focus on genuine quality - insights that reveal non-obvious patterns and make the user think "how did you know that?"`;

    const secondPassResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: supervisorMessage },
        { role: "user", content: secondPassPrompt }
      ],
      temperature: 0.9,  // Higher for more creative rewrites
      top_p: 0.95,
      presence_penalty: 0.2,
      frequency_penalty: 0.8,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const result = this.parseAIResponse(secondPassResponse.choices[0].message.content || "{}");
    const insights = result.insights || [];
    const rejectionCount = result.rejectionCount || 0;
    const rejectionReasons = result.rejectionReasons || [];
    
    // LOG SUPERVISOR REJECTION METRICS
    if (rejectionCount > 0) {
      console.log(`[SUPERVISOR] ${sectionName}: Rejected/rewrote ${rejectionCount}/${firstPassInsights.length} insights (${Math.round(rejectionCount/firstPassInsights.length*100)}%)`);
      if (rejectionReasons.length > 0) {
        console.log(`[SUPERVISOR] Rejection reasons:`, rejectionReasons.slice(0, 3).join('; ')); // Log first 3 reasons
      }
    } else {
      console.warn(`[SUPERVISOR] ${sectionName}: WARNING - Supervisor approved all insights without rejection. Quality gate may be too lenient.`);
    }
    
    // QUALITY CONTROL: Remove duplicates and filter out explicit "insufficient" markers
    const filteredInsights = insights.filter(insight => 
      typeof insight === 'string' && 
      insight.trim().length > 0 &&
      !insight.includes('Insufficient depth')
    );
    
    const uniqueInsights = this.removeDuplicateInsights(filteredInsights);
    
    if (uniqueInsights.length < filteredInsights.length) {
      console.warn(`[MULTI-PASS] ${sectionName}: Removed ${filteredInsights.length - uniqueInsights.length} duplicate insights (${uniqueInsights.length} unique)`);
    } else {
      console.log(`[MULTI-PASS] ${sectionName}: Generated ${uniqueInsights.length} unique insights`);
    }
    
    return uniqueInsights;
  }
  
  // Validate that insights contain proper cross-source citations
  private validateCitations(insights: string[], citationMeta: any): { valid: string[], failed: string[], failureReasons: string[] } {
    const valid: string[] = [];
    const failed: string[] = [];
    const failureReasons: string[] = [];
    
    for (const insight of insights) {
      // Skip "Insufficient depth" markers - these are explicit admissions of low quality
      if (typeof insight !== 'string' || insight.includes('Insufficient depth')) {
        failed.push(insight);
        failureReasons.push('Marked as insufficient depth');
        continue;
      }
      
      // Count citation types present
      const hasMsgCite = /\[MSG-[a-f0-9]{8}\]/.test(insight);
      const hasJournalCite = /\[JOURNAL-[a-f0-9]{8}\]/.test(insight);
      const hasMoodCite = /\[MOOD-[a-f0-9]{8}\]/.test(insight);
      const hasFactCite = /\[FACT-[a-f0-9]{8}\]/.test(insight);
      
      const citationTypes = [hasMsgCite, hasJournalCite, hasMoodCite, hasFactCite].filter(Boolean).length;
      
      // Count total citations (even if same type)
      const totalCitations = (insight.match(/\[(MSG|JOURNAL|MOOD|FACT)-[a-f0-9]{8}\]/g) || []).length;
      
      // PREFER ≥2 different citation types, but accept 1 type if multiple citations from same type
      if (citationTypes >= 2) {
        valid.push(insight);
      } else if (citationTypes === 1 && totalCitations >= 2) {
        // Accept if at least 2 citations from same type (better than nothing)
        valid.push(insight);
      } else if (citationTypes === 1) {
        failed.push(insight);
        failureReasons.push(`Only 1 citation (need ≥2 for triangulation)`);
      } else {
        failed.push(insight);
        failureReasons.push(`No valid citations found`);
      }
    }
    
    return { valid, failed, failureReasons };
  }

  // Remove duplicate insights using Jaccard similarity
  private removeDuplicateInsights(insights: string[]): string[] {
    const unique: string[] = [];
    
    for (const insight of insights) {
      // Type safety: ensure insight is a string
      if (typeof insight !== 'string' || !insight.trim()) {
        console.warn('[DEDUP] Skipping non-string or empty insight:', typeof insight, insight);
        continue;
      }
      
      let isDuplicate = false;
      
      for (const existing of unique) {
        const overlap = this.calculateTextOverlap(insight, existing);
        if (overlap > 0.6) {  // >60% overlap = likely duplicate
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        unique.push(insight);
      }
    }
    
    return unique;
  }

  private async generateHolyShitMoment(context: any, profile: any) {
    console.log('[MULTI-PASS] Generating Holy Shit Moment...');
    
    const prompt = `Based on ALL the insights below, identify THE single organizing principle that connects everything + ONE counter-intuitive action.

INSIGHTS GENERATED:
${JSON.stringify(profile, null, 2)}

Return JSON:
{
  "holyShitMoment": "THE brutal, undeniable organizing principle connecting all patterns. Make it uncomfortable and revelatory.",
  "growthLeveragePoint": "ONE counter-intuitive action targeting the core pattern (NOT generic advice like 'practice self-care')"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a master psychologist identifying the core organizing principle in someone's personality." },
        { role: "user", content: prompt }
      ],
      temperature: 0.9,
      top_p: 0.95,
      presence_penalty: 0.2,
      frequency_penalty: 0.8,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    return this.parseAIResponse(response.choices[0].message.content || "{}");
  }

  // Helper: Robust JSON parsing that strips markdown code blocks and handles malformed JSON
  private parseAIResponse(content: string): any {
    let cleaned = content.trim();
    
    // Strip markdown code blocks if present (GPT-4o sometimes wraps JSON in ```json ... ```)
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    }
    
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('[JSON-PARSE-ERROR] Failed to parse AI response:', error);
      console.error('[JSON-PARSE-ERROR] Content length:', cleaned.length);
      console.error('[JSON-PARSE-ERROR] First 500 chars:', cleaned.substring(0, 500));
      console.error('[JSON-PARSE-ERROR] Last 500 chars:', cleaned.substring(Math.max(0, cleaned.length - 500)));
      
      // Attempt to fix common JSON errors
      try {
        // Fix unterminated strings by adding closing quote if missing
        let fixed = cleaned;
        
        // Count quotes to see if they're balanced
        const quoteCount = (fixed.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
          console.warn('[JSON-PARSE-ERROR] Unbalanced quotes detected, attempting to fix...');
          // Try to find last complete object and close it
          const lastBrace = fixed.lastIndexOf('}');
          if (lastBrace > 0) {
            fixed = fixed.substring(0, lastBrace + 1);
          }
        }
        
        return JSON.parse(fixed);
      } catch (retryError) {
        console.error('[JSON-PARSE-ERROR] Retry failed, returning empty object');
        // Return empty structure to avoid crashing
        return { insights: [] };
      }
    }
  }

  private async analyzeWithAI_LEGACY(
    messages: Message[],
    journals: JournalEntry[],
    moods: MoodEntry[],
    facts: MemoryFact[],
    statistics: any
  ): Promise<ComprehensiveProfile> {
    const context = this.prepareAnalysisContext(messages, journals, moods, facts, statistics);

    // System message defining role and analytical frameworks
    const systemMessage = `You are an unforgiving, world-class personality analyst who has spent 30 years integrating Schema Therapy, Internal Family Systems (IFS), Attachment Theory, evolutionary psychology, psychodynamic defense mechanisms, and developmental trauma research.

YOUR ONLY GOAL: Deliver non-obvious, uncomfortable, high-precision truths that the user has never articulated but will instantly recognize as correct. You prioritize "holy shit" moments over comfort. You are allergic to platitudes, affirmations, corporate-coaching jargon, and anything that sounds like it came from Instagram therapy. You never echo the user's own words back to them. You are brutally concise unless depth is required. If you have nothing new or deep to say, you say "Insufficient data for meaningful analysis" rather than bullshit.

EXPERTISE AREAS:
- Schema Therapy (identifying maladaptive schemas, coping modes, schema activation chains)
- Internal Family Systems (recognizing parts, exiles, managers, firefighters, conflicts between parts)
- Attachment Theory (anxious, avoidant, disorganized patterns in current relationships)
- Defense Mechanisms (primitive vs. mature, when they serve vs. sabotage)
- Cognitive-Behavioral patterns (automatic thoughts, core beliefs, thought-emotion-behavior chains)
- Emotion Regulation Theory (adaptive vs. maladaptive strategies, alexithymia, emotional avoidance)
- Developmental Psychology (childhood origins of current patterns)

CRITICAL ANALYTICAL PRINCIPLES:

1. **TRIANGULATION MANDATORY**: Each insight MUST cite evidence from at least 2 different data sources (conversations + journals, moods + facts, etc.). NO EXCEPTIONS.

2. **INFERENCE OVER ECHOING**: Never restate what they explicitly said. Go at least TWO INFERENTIAL STEPS deeper:
   - What they said → What they're actually doing → The unconscious need it serves
   - Surface emotion → Underlying belief → Developmental origin

3. **CONTRADICTION DETECTION** (This is your specialty): Ruthlessly expose gaps between:
   - What they say vs. what they do
   - How they see themselves vs. how they actually behave
   - Stated values vs. revealed values (time/energy/choices)
   - Conscious intentions vs. unconscious sabotage patterns

4. **TEMPORAL PATTERNS**: Track evolution, cyclical repetition, deterioration, or improvement across time periods

5. **NON-OBVIOUS INSIGHTS**: Every insight must pass the "Would a licensed therapist be nervous to say this out loud?" test. If it's comfortable or obvious, it's wrong.

FORBIDDEN PHRASES (Use any of these and your analysis is worthless):
❌ "It sounds like you're feeling..."
❌ "That must be hard"
❌ "You're being hard on yourself"
❌ "Your inner child"
❌ "Growth mindset"
❌ "Self-care"
❌ "Be kind to yourself"
❌ "You deserve..."
❌ "It's okay to feel..."
❌ "Give yourself permission to..."

ANTI-ECHO GUARDRAILS:
- ❌ BAD: "You struggle with anxiety because you mention feeling anxious often"
- ✅ GOOD: "Your anxiety is a hypervigilant protector part (IFS) serving an unmet safety need from childhood. Pattern: You catastrophize before positive events (sabotaging joy before it's 'taken away'), evidenced by your difficulty accepting compliments (journals 3/15, 3/18) and mood crashes after social success. This isn't random worry - it's a sophisticated emotional insurance policy against disappointment."

- ❌ BAD: "You value authenticity and want to be more genuine in relationships"
- ✅ GOOD: "You claim authenticity is paramount but systematically perform a 'palatable' version of yourself in new relationships - editing humor, softening opinions, hiding intensity (conversation patterns show 2-3 day delay before revealing genuine reactions). Real priority: acceptance > authenticity. You'd rather be liked than known."

QUALITY THRESHOLD:
Every single insight must make them think "holy shit, how did you know that?" - not "yeah, I already knew that". You're revealing patterns they CANNOT see about themselves. That's the bar.`;


    const userPrompt = `Analyze this individual's psychology using ALL available data sources. Look for patterns they cannot see about themselves.

=== CONVERSATIONS (Last 100 messages) ===
${context.conversationText}

=== JOURNAL ENTRIES (Last 20 entries) ===
${context.journalText}

=== MOOD TRACKING (Last 30 entries) ===
${context.moodText}

=== EXTRACTED FACTS (${facts.length} total facts) ===
${context.factsText}

=== STATISTICS ===
${JSON.stringify(statistics, null, 2)}

=== ANALYSIS REQUIREMENTS ===

⚠️ CRITICAL: Each array section below MUST contain AT LEAST 8 specific, evidence-based insights (maximum 12). You will be penalized for returning fewer than 8 items per section.

For each section, provide actual psychological insights (NOT instructional text):

**behavioralPatterns** (8-12 items): Format as [TRIGGER] → [ACTION] → [CONSEQUENCE]. Focus on OBSERVABLE ACTIONS. Example: "When praised publicly (trigger), minimizes or deflects the compliment within seconds (action), preventing genuine acknowledgment and reinforcing belief that achievements don't matter (consequence) - evident in conversations 3/15, 3/22, journal 3/18"

**emotionalPatterns** (8-12 items): Format as [APPRAISAL] → [EMOTIONAL RESPONSE] → [REGULATION]. Focus on emotion PROCESSING. Example: "Interprets neutral feedback as rejection (appraisal) → shame spiral lasting 2-3 days (response) → isolates and over-prepares before next interaction (regulation) - pattern in journals 3/12, 3/19, 4/02"

**relationshipDynamics** (8-12 items): Use ATTACHMENT THEORY lens. Focus on HOW they connect. Example: "Anxious-preoccupied attachment: texts excessively when friend is slow to respond (protest behavior), then withdraws in shame. Classic activate-deactivate cycle seen in conversations 3/15"

**copingMechanisms** (8-12 items): Map to DEFENSE MECHANISMS. Categorize as adaptive vs maladaptive. Example: "Intellectualization defense - shifts into abstract analysis when emotionally overwhelmed (journals 3/20, 4/01). Adaptive in work, maladaptive in intimate relationships"

**growthAreas** (8-12 items): Specific development areas with evidence. Example: "Difficulty tolerating uncertainty leads to premature decision-making - rushes to closure before gathering sufficient information (3 instances in journals)"

**strengths** (8-12 items): Underutilized or unrecognized strengths with evidence. Example: "Exceptional pattern recognition allows early detection of relationship shifts (conversation 3/15), but this strength is dismissed as 'overthinking'"

**blindSpots** (8-12 items): Self-perception gaps. Example: "Claims to value independence yet makes all major decisions based on others' approval (journal 3/18: 'I chose X because everyone expected it'). The dependency is invisible, framed as 'being considerate'"

**valuesAndBeliefs** (8-12 items): Implicit vs explicit values. Example: "Says authenticity is paramount but systematically performs 'palatable' version of self in new relationships (2-3 day delay before revealing genuine reactions). Real value: acceptance > authenticity"

**therapeuticInsights** (8-12 items): Profound 'holy shit' revelations. Example: "Perfectionism isn't about achievement - it's a hypervigilant strategy to prevent abandonment. When 'flawed', believes they're unlovable (defectiveness schema). Evidence: sabotages relationships at first sign of intimacy (journals 3/12, 3/25, 4/03)"

**holyShitMoment** (single string): THE organizing principle connecting all patterns. Make it brutal and undeniable. Example: "Your entire relational strategy is built on the belief that the real you is fundamentally unacceptable - so you've become a master at performing palatability while your authentic self suffocates in isolation"

**growthLeveragePoint** (single string): ONE counter-intuitive action targeting the core pattern. NOT generic advice. Example: "Next time you feel the urge to people-please, deliberately disappoint someone in a small way and observe that the catastrophe you fear doesn't happen (exposure therapy for abandonment schema)"

⚠️ MANDATORY: Return valid JSON with 8-12 items in EVERY array field. Empty or short arrays will be rejected.

{
  "summary": "3-4 paragraph narrative synthesizing their entire personality with specific evidence",
  "coreTraits": {
    "big5": {
      "openness": 75,
      "conscientiousness": 65,
      "extraversion": 45,
      "agreeableness": 80,
      "emotionalStability": 40
    },
    "archetype": "Specific archetype based on their data",
    "dominantTraits": ["trait 1 from evidence", "trait 2 from evidence", "trait 3 from evidence"]
  },
  "behavioralPatterns": ["item 1 with evidence", "item 2 with evidence", "... 8-12 total items"],
  "emotionalPatterns": ["item 1 with evidence", "item 2 with evidence", "... 8-12 total items"],
  "relationshipDynamics": ["item 1 with evidence", "item 2 with evidence", "... 8-12 total items"],
  "copingMechanisms": ["item 1 with evidence", "item 2 with evidence", "... 8-12 total items"],
  "growthAreas": ["item 1 with evidence", "item 2 with evidence", "... 8-12 total items"],
  "strengths": ["item 1 with evidence", "item 2 with evidence", "... 8-12 total items"],
  "blindSpots": ["item 1 with evidence", "item 2 with evidence", "... 8-12 total items"],
  "valuesAndBeliefs": ["item 1 with evidence", "item 2 with evidence", "... 8-12 total items"],
  "therapeuticInsights": ["item 1 with evidence", "item 2 with evidence", "... 8-12 total items"],
  "holyShitMoment": "The single most brutal truth connecting all patterns - make it uncomfortable and undeniable",
  "growthLeveragePoint": "ONE counter-intuitive action targeting the core pattern (NOT generic advice)"
}

FINAL CRITICAL REQUIREMENTS:

1. ⚠️ TRIANGULATION MANDATORY: Every single insight must cite evidence from at least 2 data sources (e.g., "journals 3/15 + mood entry 3/16" or "conversation themes + journal pattern")
2. ⚠️ NO ECHOING: If they explicitly stated it, DON'T repeat it. Infer the underlying driver they can't see
3. ⚠️ CONTRADICTION HUNTING: Actively search for gaps between:
   - Self-description vs. actual behavior
   - Stated intentions vs. outcomes
   - Surface emotions vs. underlying needs
4. ⚠️ TEMPORAL ANALYSIS: Note when patterns started, evolved, or repeat cyclically
5. ⚠️ DEPTH REQUIREMENT: Each insight should make them think "holy shit, how did you know that?" - not "yeah, I already knew that"
6. ⚠️ SPECIFICITY: Generic statements = failure. Every item needs specific dates, quotes, or behavioral instances
7. ⚠️ DISTINCT SECTIONS: Behavioral ≠ Emotional ≠ Relational ≠ Coping. Use the specified analytical lenses to keep them separate
8. ⚠️ QUANTITY: 8-12 items per array. Quality AND quantity both required.

Remember: They can get surface-level feedback anywhere. You're here to reveal what they genuinely don't know about themselves.`;

    try {
      // STEP 1: First pass - generate initial analysis
      console.log('[SINGLE-PASS AI] Generating comprehensive analysis...');
      const firstPassCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,  // Higher for creative, non-templated insights
        max_tokens: 16000,  // INCREASED: Need room for 9 sections × 8-12 items each
        top_p: 0.95,  // Nucleus sampling for diverse vocabulary
        presence_penalty: 0.2,  // Discourage repetitive topics/patterns
        frequency_penalty: 0.8,  // Strongly discourage repetitive phrases/structures
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(firstPassCompletion.choices[0].message.content || "{}");
      console.log('[SINGLE-PASS AI] Analysis complete. Preview:', {
        behavioralPatterns: (analysis.behavioralPatterns || []).length,
        emotionalPatterns: (analysis.emotionalPatterns || []).length,
        relationshipDynamics: (analysis.relationshipDynamics || []).length,
        copingMechanisms: (analysis.copingMechanisms || []).length,
        growthAreas: (analysis.growthAreas || []).length,
        strengths: (analysis.strengths || []).length,
        blindSpots: (analysis.blindSpots || []).length,
        valuesAndBeliefs: (analysis.valuesAndBeliefs || []).length,
        therapeuticInsights: (analysis.therapeuticInsights || []).length,
        hasHolyShitMoment: !!analysis.holyShitMoment,
        hasGrowthLeveragePoint: !!analysis.growthLeveragePoint
      });
      console.log('[SINGLE-PASS AI] Analysis generation complete.');
      
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
        
        // Temporarily lowered from 8 to 6 minimum while debugging AI compliance
        if (arr.length < 6) {
          validationIssues.push(`${field} has only ${arr.length} items (minimum 6 required)`);
        } else if (arr.length > 12) {
          // Truncate to 12 items and log warning
          analysis[field] = arr.slice(0, 12);
          validationIssues.push(`${field} had ${arr.length} items (truncated to 12)`);
        }
      });

      // If any category has fewer than 6 items, reject the analysis
      const criticalIssues = validationIssues.filter(issue => issue.includes('minimum'));
      if (criticalIssues.length > 0) {
        console.warn('⚠️ AI analysis below minimum depth (proceeding anyway):', criticalIssues);
        // TEMPORARILY DISABLED - Accept whatever AI generates for debugging
        // throw new Error(`Analysis does not meet minimum depth requirements. ${criticalIssues.join(', ')}`);
      }

      // ANTI-REPETITION VALIDATION: Check for duplicate insights across sections
      const allInsights: string[] = [];
      arrayFields.forEach(field => {
        const arr = analysis[field] || [];
        arr.forEach((item: string) => allInsights.push(item.toLowerCase()));
      });

      // Detect duplicates (case-insensitive substring matching)
      let duplicateCount = 0;
      for (let i = 0; i < allInsights.length; i++) {
        for (let j = i + 1; j < allInsights.length; j++) {
          const overlap = this.calculateTextOverlap(allInsights[i], allInsights[j]);
          if (overlap > 0.6) {  // >60% overlap = likely duplicate
            duplicateCount++;
            validationIssues.push(`Duplicate insight detected: "${allInsights[i].substring(0, 80)}..." overlaps with "${allInsights[j].substring(0, 80)}..."`);
          }
        }
      }

      if (duplicateCount > 3) {
        const errorMsg = `Analysis rejected: ${duplicateCount} duplicate/overlapping insights detected. Sections must be distinct.`;
        console.error('[REPETITION GATE] AI analysis has too much repetition:', duplicateCount, 'duplicates found');
        console.error('[REPETITION GATE] Validation issues:', validationIssues.slice(-5)); // Show last 5 duplicate examples
        throw new Error(errorMsg);
      }

      if (validationIssues.length > 0) {
        console.warn('AI analysis validation notices (non-blocking):', validationIssues);
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
