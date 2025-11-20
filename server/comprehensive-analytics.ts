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

  // Calculate text overlap between two strings (returns 0-1 similarity score)
  private calculateTextOverlap(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    // Simple word-based Jaccard similarity
    const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set(Array.from(words1).filter(w => words2.has(w)));
    const union = new Set(Array.from(words1).concat(Array.from(words2)));
    
    return union.size > 0 ? intersection.size / union.size : 0;
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

    // System message defining role and analytical frameworks
    const systemMessage = `You are an expert clinical psychologist conducting a comprehensive personality analysis. Your expertise includes:

- Schema Therapy (identifying maladaptive schemas and coping modes)
- Internal Family Systems (recognizing different "parts" and their roles)
- Attachment Theory (understanding relational patterns)
- Defense Mechanisms (Freudian and modern adaptations)
- Cognitive-Behavioral patterns (thought-emotion-behavior cycles)
- Emotion Regulation Theory (adaptive vs. maladaptive strategies)

CRITICAL ANALYTICAL PRINCIPLES:

1. **TRIANGULATION**: Each insight MUST be supported by evidence from at least 2 different data sources (conversations, journals, moods, facts)
2. **INFERENCE OVER ECHOING**: Never simply restate what the user explicitly said. Instead, infer the UNDERLYING psychological driver, unconscious pattern, or hidden belief system
3. **CONTRADICTION DETECTION**: Actively look for discrepancies between:
   - What they say vs. what they do
   - How they see themselves vs. how they behave
   - Their stated values vs. their actual choices
4. **TEMPORAL PATTERNS**: Track how patterns evolve or repeat across time
5. **NON-OBVIOUS INSIGHTS**: Prioritize revelations they likely don't consciously recognize about themselves

ANTI-ECHO GUARDRAILS:
- ❌ BAD: "You struggle with anxiety because you mention feeling anxious often"
- ✅ GOOD: "Your anxiety functions as a hypervigilant protector part (IFS), likely stemming from an unmet safety need in childhood, evidenced by your pattern of catastrophizing before positive events (sabotaging joy) and your difficulty accepting compliments (journals: 3/15, 3/18) combined with mood spikes after social interactions"

Each insight must reveal something they DIDN'T explicitly tell you.`;

    const userPrompt = `Analyze this individual's psychology using ALL available data sources. Look for patterns they cannot see about themselves.

=== CONVERSATIONS (Last 100 messages) ===
${conversationText}

=== JOURNAL ENTRIES (Last 20 entries) ===
${journalText}

=== MOOD TRACKING (Last 30 entries) ===
${moodText}

=== EXTRACTED FACTS (${facts.length} total facts) ===
${factsText}

=== STATISTICS ===
${JSON.stringify(statistics, null, 2)}

Provide a comprehensive JSON analysis with this structure:

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
    "EXACTLY 8-12 ITEMS - Format: [TRIGGER] → [ACTION] → [CONSEQUENCE]",
    "Focus on OBSERVABLE ACTIONS, not thoughts or feelings",
    "Examples: 'When criticized (trigger), immediately deflects blame onto external factors (action), which prevents learning from feedback (consequence) - evident in 4 conversation exchanges'",
    "Look for: procrastination cycles, avoidance behaviors, compulsive patterns, decision-making habits",
    "Cite specific dates/instances from journals or conversation timestamps",
    "Reveal the FUNCTION each behavior serves (what psychological need it meets)"
  ],
  
  "emotionalPatterns": [
    "EXACTLY 8-12 ITEMS - Format: [APPRAISAL] → [EMOTIONAL RESPONSE] → [REGULATION ATTEMPT]",
    "Focus on emotion PROCESSING, not the emotions themselves",
    "Examples: 'Interprets neutral feedback as rejection (appraisal) → shame spiral (response) → isolates for 2-3 days (regulation) - pattern appears in journals 3/12, 3/19, 4/02'",
    "Look for: emotional triggers, intensity patterns, duration, recovery strategies, alexithymia signs",
    "Map to emotion regulation theory: rumination, suppression, reappraisal, distraction",
    "Identify which emotions they AVOID vs. which they over-identify with"
  ],
  
  "relationshipDynamics": [
    "EXACTLY 8-12 ITEMS - Lens: ATTACHMENT THEORY + INTERPERSONAL PATTERNS",
    "Focus on HOW they connect, not who they connect with",
    "Examples: 'Anxious-preoccupied attachment evident in protest behaviors after perceived distance - texts excessively when friend is slow to respond (conversations 3/15), then withdraws in shame. Classic activate-deactivate cycle'",
    "Look for: boundary patterns, conflict resolution style, intimacy tolerance, dependency vs. autonomy balance",
    "Identify attachment wounds showing up in current relationships",
    "Map to specific attachment behaviors: proximity seeking, safe haven, secure base, separation distress"
  ],
  
  "copingMechanisms": [
    "EXACTLY 8-12 ITEMS - Map to DEFENSE MECHANISMS + REGULATION STRATEGIES",
    "Focus on STRESS RESPONSE PATTERNS, categorize as adaptive vs. maladaptive",
    "Examples: 'Intellectualization defense - when emotionally overwhelmed, shifts into abstract analysis mode (journals 3/20, 4/01). Adaptive in work contexts, maladaptive in intimate relationships where emotional presence is needed'",
    "Look for: Primary defenses (projection, denial, splitting) vs. Mature defenses (humor, sublimation, altruism)",
    "Identify when they use fight/flight/freeze/fawn responses",
    "Note which strategies work vs. which create more problems"
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
    "EXACTLY 8-12 ITEMS - Focus on SELF-PERCEPTION GAPS",
    "What they literally cannot see about themselves - contradictions between stated vs. lived reality",
    "Examples: 'Claims to value independence yet makes all major decisions based on others' approval (journal 3/18: 'I chose X because everyone expected it'). The dependency is invisible to them because it's framed as 'being considerate''",
    "Look for: projection, rationalization, cognitive dissonance they've normalized",
    "Identify where their self-narrative doesn't match the behavioral evidence",
    "Surface the beliefs they THINK they have vs. the beliefs that actually drive behavior"
  ],
  
  "valuesAndBeliefs": [
    "EXACTLY 8-12 ITEMS - Focus on IMPLICIT vs. EXPLICIT VALUES",
    "Not what they SAY they value - what they ACTUALLY prioritize based on choices/time/energy",
    "Examples: 'Says authenticity is paramount but systematically performs a 'palatable' version of self in new relationships (conversations show humor editing, opinion softening). Real value = acceptance > authenticity'",
    "Look for: core beliefs about self/others/world (CBT schema), worldview assumptions, meaning-making patterns",
    "Map stated values vs. revealed values through behavioral choices",
    "Identify limiting beliefs masquerading as truths"
  ],
  
  "therapeuticInsights": [
    "EXACTLY 8-12 ITEMS - THE 'HOLY SHIT' REVELATIONS",
    "This is where you synthesize EVERYTHING into profound insights they've never consciously recognized",
    "Examples: 'Your perfectionism isn't about achievement - it's a hypervigilant strategy to prevent abandonment. When you're 'flawed', you believe you're unlovable (schema: defectiveness). Evidence: you sabotage relationships at the first sign of intimacy (when they could see the real you) - pattern in journals 3/12, 3/25, 4/03. The achievement is just emotional armor.'",
    "Look for: Developmental origins of current patterns, schema activation chains, parts/modes conflicts (IFS), core fears driving surface behaviors",
    "Connect the dots between childhood experiences (if mentioned), attachment wounds, and current relational patterns",
    "Identify the 'organizing principle' - the core belief/fear that generates multiple symptoms",
    "Reveal the FUNCTION of their struggles - what psychological need is being met by the problem?"
  ]
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,  // Slightly higher for creative insights
        max_tokens: 8000,  // Increased for comprehensive output with more detail
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
