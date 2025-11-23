import OpenAI from "openai";
import { storage } from "./storage";
import type { Message, JournalEntry } from "@shared/schema";

// Prioritize direct OPENAI_API_KEY for unfiltered access
const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey,
  // Only use baseURL if using Replit integration
  baseURL: process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

interface ExtractedFact {
  fact: string;
  category: string;
  abstractionLevel: 'raw_fact' | 'inferred_belief' | 'defense_mechanism' | 'ifs_part';
  confidence: number;
  timeContext?: string;
  emotionalTone?: string;
}

export class MemoryService {
  async extractFactsFromMessages(userId: string, messages: Message[]): Promise<void> {
    if (messages.length === 0) return;

    const conversationText = messages
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const facts = await this.extractFacts(conversationText, "conversation");
    
    for (const extractedFact of facts) {
      await this.storeFact(userId, extractedFact, "message", messages[messages.length - 1].id, messages[messages.length - 1].content);
    }
  }

  async extractFactsFromJournal(userId: string, entry: JournalEntry): Promise<void> {
    const facts = await this.extractFacts(entry.content, "journal");
    
    for (const extractedFact of facts) {
      await this.storeFact(userId, extractedFact, "journal", entry.id, entry.content);
    }
  }

  private async extractFacts(text: string, sourceType: string): Promise<ExtractedFact[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a multi-level memory extraction AI with expertise in clinical psychology. Extract information about the user at FOUR abstraction levels from their ${sourceType}.

**ABSTRACTION LEVELS:**

1. **raw_fact** - Observable, concrete facts they explicitly stated
   Examples:
   - "Lives in Seattle"
   - "Works as a software engineer"
   - "Has a sister named Sarah"

2. **inferred_belief** - Implicit beliefs inferred from their statements/behaviors
   Examples:
   - "Believes love must be earned through perfection" (inferred from pattern of overachieving before asking for help)
   - "Assumes conflict = rejection" (inferred from avoidance of disagreements)
   - "Feels fundamentally unworthy" (inferred from self-sabotage pattern before success)

3. **defense_mechanism** - Psychological defenses they employ
   Examples:
   - "Uses intellectualization when discussing emotional trauma" (shifts to abstract analysis)
   - "Employs projection - accuses others of being 'too sensitive' when own emotions are triggered"
   - "Rationalization defense - justifies people-pleasing as 'just being considerate'"

4. **ifs_part** - Internal Family Systems "parts" identifiable in their psyche
   Examples:
   - "The Perfectionist Manager part - demands flawless performance to prevent abandonment"
   - "The Wounded 8-year-old exile - holds shame from childhood criticism"
   - "The Intellectual Firefighter - uses analysis to extinguish emotional overwhelm"

**CATEGORIES** (same for all levels):
- personal_info: Demographics, background, life situation
- relationships: Family, friends, social connections
- work_career: Job, career, professional life
- goals_aspirations: What they want to achieve
- challenges_struggles: Problems they're facing
- patterns_behaviors: Recurring behaviors or habits
- values_beliefs: What matters to them, core beliefs
- emotions_wellbeing: Emotional state, mental health, defenses

**EXTRACTION RULES:**
- Extract 8-15 total facts across ALL four abstraction levels
- Prioritize deeper levels (inferred_belief, defense_mechanism, ifs_part) over surface raw_facts
- Each fact must be SPECIFIC to this individual - avoid generic psychology
- For ifs_part: Name the part, describe its strategy, and what it protects
- For defense_mechanism: Name the mechanism (projection, denial, intellectualization, etc.)
- For inferred_belief: Connect to behavioral evidence

Return ONLY a JSON array with this structure:
[{
  "fact": "string (the extracted fact/belief/defense/part)",
  "category": "string (one of the categories above)",
  "abstractionLevel": "raw_fact" | "inferred_belief" | "defense_mechanism" | "ifs_part",
  "confidence": number (0-100),
  "timeContext": "string or null",
  "emotionalTone": "string"
}]

Prioritize quality over quantity. Go deep.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,  // Deterministic for fact extraction (per formula)
        max_tokens: 2000,  // More tokens for multi-level extraction
        top_p: 0.95,
        presence_penalty: 0.2,
        frequency_penalty: 0.8,
        response_format: { type: "json_object" }  // Force valid JSON output
      });

      let response = completion.choices[0].message.content || "[]";
      
      // DEBUG: Log raw response to diagnose parse errors
      console.log('[MEMORY-SERVICE] Raw GPT response (first 500 chars):', response.substring(0, 500));
      
      // ROBUST: Strip markdown code blocks if GPT wraps JSON (common with GPT-4o)
      response = response.trim();
      if (response.startsWith('```')) {
        // Remove ```json or ``` opening and closing markers
        response = response.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      }
      
      // Additional cleanup: remove any remaining non-JSON text before/after
      const jsonStart = response.indexOf('[');
      const jsonEnd = response.lastIndexOf(']');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        response = response.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('[MEMORY-SERVICE] Cleaned response (first 500 chars):', response.substring(0, 500));
      
      const facts = JSON.parse(response);
      
      return Array.isArray(facts) ? facts : [];
    } catch (error) {
      console.error("Error extracting facts:", error);
      return [];
    }
  }

  private async storeFact(
    userId: string,
    extractedFact: ExtractedFact,
    sourceType: string,
    sourceId: string,
    evidenceExcerpt: string
  ): Promise<void> {
    try {
      // Defensive: Skip if extracted fact is invalid
      if (!extractedFact || !extractedFact.fact || typeof extractedFact.fact !== 'string') {
        console.warn('Skipping invalid extracted fact:', extractedFact);
        return;
      }
      
      const existingFacts = await storage.getMemoryFactsByUserId(userId);
      
      const similarFact = existingFacts.find(
        f => this.calculateSimilarity(f.factContent, extractedFact.fact) > 0.8
      );

      if (similarFact) {
        const newConfidence = Math.min(100, similarFact.confidence + 5);
        await storage.updateMemoryFactConfidence(similarFact.id, newConfidence);
        
        await storage.createMemoryFactMention({
          factId: similarFact.id,
          sourceType,
          sourceId,
          evidenceExcerpt: evidenceExcerpt.substring(0, 500)
        });
      } else {
        const fact = await storage.createMemoryFact({
          userId,
          factContent: extractedFact.fact,
          category: extractedFact.category,
          abstractionLevel: extractedFact.abstractionLevel,
          confidence: extractedFact.confidence,
          timeContext: extractedFact.timeContext || null,
          emotionalTone: extractedFact.emotionalTone || null,
          status: 'active'
        });

        await storage.createMemoryFactMention({
          factId: fact.id,
          sourceType,
          sourceId,
          evidenceExcerpt: evidenceExcerpt.substring(0, 500)
        });
      }
    } catch (error) {
      console.error("Error storing fact:", error);
    }
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Defensive: Guard against undefined/null inputs
    if (!text1 || !text2 || typeof text1 !== 'string' || typeof text2 !== 'string') {
      return 0;
    }
    
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  async getMemoryContext(userId: string, limit: number = 20): Promise<string> {
    const facts = await storage.getMemoryFactsByUserId(userId, limit);
    
    if (facts.length === 0) {
      return "No established memories about this user yet.";
    }

    const factsByCategory: Record<string, string[]> = {};
    
    for (const fact of facts) {
      if (!factsByCategory[fact.category]) {
        factsByCategory[fact.category] = [];
      }
      factsByCategory[fact.category].push(`${fact.factContent} (confidence: ${fact.confidence}%)`);
    }

    let context = "## Known Facts About User:\n\n";
    
    for (const [category, categoryFacts] of Object.entries(factsByCategory)) {
      context += `**${category.replace(/_/g, " ").toUpperCase()}:**\n`;
      context += categoryFacts.map(f => `- ${f}`).join("\n") + "\n\n";
    }

    return context;
  }
}

export const memoryService = new MemoryService();
