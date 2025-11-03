import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertJournalEntrySchema, type Message } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DEFAULT_USER_ID = "default-user-id";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/conversations", async (req, res) => {
    try {
      const conversation = await storage.createConversation(DEFAULT_USER_ID);
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversationsByUserId(DEFAULT_USER_ID);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const userMessage = await storage.createMessage(validatedData);
      
      const conversationHistory = await storage.getMessagesByConversationId(validatedData.conversationId);
      
      const systemPrompt = `You are a direct, insightful AI personality analyst. Your role is to help users discover the hard truth about themselves. You are:
1. Empathetic but honest - don't sugarcoat observations
2. Pattern-focused - actively identify contradictions, recurring themes, and behavioral patterns
3. Confrontational when necessary - if you notice avoidance, people-pleasing, or self-deception, point it out directly but kindly
4. Curious about root causes - dig deeper into "why" behind behaviors and beliefs
5. Growth-oriented - always connect insights to actionable improvements

Your style:
- Ask probing questions that challenge assumptions
- Point out contradictions you notice: "Earlier you said X, but now you're saying Y. What's really going on?"
- Name patterns directly: "I'm noticing a pattern where you..."
- Balance truth-telling with compassion - be direct, not harsh
- Keep responses 2-4 sentences with one powerful question

Your goal is to be the honest mirror users need, not the gentle validation they want.`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.8,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0].message.content || "I'm here to listen. Please continue.";
      
      const aiMessage = await storage.createMessage({
        conversationId: validatedData.conversationId,
        role: "assistant",
        content: aiResponse
      });

      res.json({ userMessage, aiMessage });
    } catch (error: any) {
      console.error("Error in /api/messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const messages = await storage.getMessagesByConversationId(req.params.conversationId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/journal-entries", async (req, res) => {
    try {
      const validatedData = insertJournalEntrySchema.parse(req.body);
      const entry = await storage.createJournalEntry(validatedData);
      
      const allEntries = await storage.getJournalEntriesByUserId(DEFAULT_USER_ID);
      const conversations = await storage.getConversationsByUserId(DEFAULT_USER_ID);
      
      if (allEntries.length >= 2) {
        const entriesText = allEntries.slice(0, 10).map(e => 
          `[${new Date(e.createdAt).toLocaleDateString()}] ${e.content}`
        ).join("\n\n---\n\n");
        
        let conversationContext = "";
        if (conversations.length > 0) {
          const recentConv = conversations[conversations.length - 1];
          const messages = await storage.getMessagesByConversationId(recentConv.id);
          conversationContext = `\n\nRecent conversation themes:\n${messages.slice(-10).map(m => 
            `${m.role}: ${m.content}`
          ).join("\n")}`;
        }
        
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
  "priority": "high" (affects relationships/wellbeing), "medium" (limits growth), or "low" (minor optimization)
}

Focus on insights that would genuinely surprise them or help them see something they've been avoiding.`;

        try {
          const analysis = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: analysisPrompt }],
            temperature: 0.8,
            response_format: { type: "json_object" }
          });

          const insight = JSON.parse(analysis.choices[0].message.content || "{}");
          
          if (insight.title && insight.description) {
            await storage.createPersonalityInsight({
              userId: DEFAULT_USER_ID,
              insightType: insight.insightType || "growth_opportunity",
              title: insight.title,
              description: insight.description,
              priority: insight.priority || "medium"
            });
          }
        } catch (analysisError) {
          console.error("Error generating insight:", analysisError);
        }
      }
      
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/journal-entries", async (req, res) => {
    try {
      const entries = await storage.getJournalEntriesByUserId(DEFAULT_USER_ID);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/insights", async (req, res) => {
    try {
      const insights = await storage.getPersonalityInsightsByUserId(DEFAULT_USER_ID);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analyze-personality", async (req, res) => {
    try {
      const conversations = await storage.getConversationsByUserId(DEFAULT_USER_ID);
      const journalEntries = await storage.getJournalEntriesByUserId(DEFAULT_USER_ID);
      
      if (conversations.length === 0 && journalEntries.length === 0) {
        return res.status(400).json({ error: "Not enough data for analysis. Chat or journal first." });
      }
      
      let allMessages: Message[] = [];
      for (const conv of conversations) {
        const msgs = await storage.getMessagesByConversationId(conv.id);
        allMessages = allMessages.concat(msgs);
      }
      
      const conversationText = allMessages.slice(-20).map(m => 
        `${m.role}: ${m.content}`
      ).join("\n");
      
      const journalText = journalEntries.slice(0, 10).map(e => 
        `[${new Date(e.createdAt).toLocaleDateString()}] ${e.content.substring(0, 500)}`
      ).join("\n\n---\n\n");
      
      const analysisPrompt = `You are conducting a comprehensive personality analysis. Analyze this person's conversations and journal entries to provide honest insights about their personality.

Recent Conversations:
${conversationText}

Journal Entries:
${journalText}

Provide a detailed JSON analysis with:
{
  "traits": {
    "openness": 0-100 (intellectual curiosity, creativity, openness to new experiences),
    "conscientiousness": 0-100 (organization, responsibility, self-discipline),
    "extraversion": 0-100 (social energy, assertiveness, enthusiasm),
    "agreeableness": 0-100 (compassion, cooperation, trust),
    "emotionalStability": 0-100 (resilience, emotional regulation, confidence)
  },
  "corePatterns": [
    "Pattern 1: specific behavioral/emotional pattern you observe",
    "Pattern 2: ...",
    "Pattern 3: ..."
  ],
  "blindSpots": [
    "Blind spot 1: what they can't see about themselves",
    "Blind spot 2: ..."
  ],
  "strengths": [
    "Strength 1: underutilized strength",
    "Strength 2: ..."
  ]
}

Be specific and reference their actual words/behaviors. Don't be generic - give them insights they couldn't get from a buzzfeed quiz.`;

      const analysis = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(analysis.choices[0].message.content || "{}");
      res.json(result);
    } catch (error: any) {
      console.error("Error in personality analysis:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const conversations = await storage.getConversationsByUserId(DEFAULT_USER_ID);
      const journalEntries = await storage.getJournalEntriesByUserId(DEFAULT_USER_ID);
      const insights = await storage.getPersonalityInsightsByUserId(DEFAULT_USER_ID);
      
      const sortedEntries = [...journalEntries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      let streak = 0;
      if (sortedEntries.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = sortedEntries.length - 1; i >= 0; i--) {
          const entryDate = new Date(sortedEntries[i].createdAt);
          entryDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === streak) {
            streak++;
          } else {
            break;
          }
        }
      }
      
      res.json({
        conversationCount: conversations.length,
        journalEntryCount: journalEntries.length,
        insightCount: insights.length,
        streak,
        profileCompletion: Math.min(100, (conversations.length * 5) + (journalEntries.length * 10))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
