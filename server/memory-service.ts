import OpenAI from "openai";
import { storage } from "./storage";
import type { Message, JournalEntry } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface ExtractedFact {
  fact: string;
  category: string;
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
            content: `You are a memory extraction AI. Extract factual information about the user from their ${sourceType}.

Extract facts in these categories:
- personal_info: Demographics, background, life situation
- relationships: Family, friends, social connections
- work_career: Job, career, professional life
- goals_aspirations: What they want to achieve
- challenges_struggles: Problems they're facing
- patterns_behaviors: Recurring behaviors or habits
- values_beliefs: What matters to them
- emotions_wellbeing: Emotional state, mental health

For each fact, determine:
1. The fact itself (specific and concrete)
2. Category (one of the above)
3. Confidence (0-100, how certain you are this is accurate)
4. Time context (if mentioned: past, present, future, specific timeframe)
5. Emotional tone (positive, negative, neutral, mixed)

Return ONLY a JSON array of objects with this structure:
[{
  "fact": "string",
  "category": "string",
  "confidence": number,
  "timeContext": "string or null",
  "emotionalTone": "string"
}]

Extract 1-5 of the most significant facts. Don't extract vague or trivial information.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const response = completion.choices[0].message.content || "[]";
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
