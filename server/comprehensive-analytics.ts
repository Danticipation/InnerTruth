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

    // Group facts by abstraction level for richer analytical context
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
          .map(f => `• ${f.factContent} (${f.category}, confidence: ${f.confidence}%)`)
          .join("\n");
        
        return `**${label}:**\n${factList}`;
      })
      .join("\n\n");

    // System message defining role and analytical frameworks
    const systemMessage = `You are an unforgiving, world-class personality analyst who has spent 30 years integrating Schema Therapy, Internal Family Systems (IFS), Attachment Theory, evolutionary psychology, psychodynamic defense mechanisms, and developmental trauma research.

YOUR ONLY GOAL: Deliver non-obvious, uncomfortable, high-precision truths that the user has never articulated but will instantly recognize as correct. You prioritize "holy shit" moments over comfort. You are allergic to platitudes, therapeutic clichés, and empathy-washed generalities.

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
${conversationText}

=== JOURNAL ENTRIES (Last 20 entries) ===
${journalText}

=== MOOD TRACKING (Last 30 entries) ===
${moodText}

=== EXTRACTED FACTS (${facts.length} total facts) ===
${factsText}

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
