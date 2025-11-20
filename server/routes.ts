import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertJournalEntrySchema, insertMoodEntrySchema, type Message } from "@shared/schema";
import OpenAI from "openai";
import { memoryService } from "./memory-service";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { comprehensiveAnalytics } from "./comprehensive-analytics";
import { z } from "zod";

// Initialize OpenAI client with fallbacks for both Replit AI Integrations and standard OpenAI
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("ERROR: No OpenAI API key configured. Set either AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY");
  throw new Error("OpenAI API key not configured");
}

const openai = new OpenAI({
  apiKey,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1"
});

async function triggerCategoryScoring(userId: string) {
  try {
    const selectedCategories = await storage.getUserSelectedCategories(userId);
    
    if (selectedCategories.length === 0) {
      return;
    }

    for (const userCategory of selectedCategories) {
      const { categoryId } = userCategory;
      
      const { generateAndPersistCategoryScore } = await import("./category-scoring");
      
      generateAndPersistCategoryScore(
        userId,
        categoryId,
        "daily",
        7
      ).catch(err => {
        console.error(`Background category scoring failed for ${categoryId}:`, err.message);
      });
    }
  } catch (error: any) {
    console.error("Error triggering category scoring:", error.message);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth endpoint - check if user is authenticated
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Protected routes - all require authentication
  app.post("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversation = await storage.createConversation(userId);
      
      // Create initial welcome message in database for persistence
      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Hello! I'm here to help you explore your thoughts and feelings. What would you like to talk about today?"
      });
      
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Verify conversation belongs to authenticated user
      const conversation = await storage.getConversation(validatedData.conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: conversation not found or access denied" });
      }
      
      const userMessage = await storage.createMessage(validatedData);
      
      triggerCategoryScoring(userId).catch(err =>
        console.error("Error triggering category scoring after message:", err)
      );
      
      const conversationHistory = await storage.getMessagesByConversationId(validatedData.conversationId);
      
      const memoryContext = await memoryService.getMemoryContext(userId);
      
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

Your goal is to be the honest mirror users need, not the gentle validation they want.

${memoryContext}

Use these established facts to provide deeper, more personalized insights. Reference specific patterns or details you know about the user.`;

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

      memoryService.extractFactsFromMessages(userId, conversationHistory).catch(err => 
        console.error("Error extracting facts from messages:", err)
      );

      res.json({ userMessage, aiMessage });
    } catch (error: any) {
      console.error("Error in /api/messages:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/messages/:conversationId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verify conversation belongs to authenticated user
      const conversation = await storage.getConversation(req.params.conversationId);
      if (!conversation || conversation.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: conversation not found or access denied" });
      }
      
      const messages = await storage.getMessagesByConversationId(req.params.conversationId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/journal-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertJournalEntrySchema.parse(req.body);
      const entry = await storage.createJournalEntry({ 
        ...validatedData, 
        userId
      });
      
      triggerCategoryScoring(userId).catch(err =>
        console.error("Error triggering category scoring after journal save:", err)
      );
      
      const allEntries = await storage.getJournalEntriesByUserId(userId);
      const conversations = await storage.getConversationsByUserId(userId);
      
      if (allEntries.length >= 1) {  // Generate insights even with just one entry for faster feedback
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
              userId,
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
      
      memoryService.extractFactsFromJournal(userId, entry).catch(err => 
        console.error("Error extracting facts from journal:", err)
      );
      
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/journal-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getJournalEntriesByUserId(userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/journal-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const entry = await storage.getJournalEntriesByUserId(userId).then(entries => 
        entries.find(e => e.id === id)
      );
      
      if (!entry) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      
      const validatedData = insertJournalEntrySchema.partial().parse(req.body);
      const updatedEntry = await storage.updateJournalEntry(id, validatedData);
      res.json(updatedEntry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/journal-entries/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const entry = await storage.getJournalEntriesByUserId(userId).then(entries => 
        entries.find(e => e.id === id)
      );
      
      if (!entry) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      
      await storage.deleteJournalEntry(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insights = await storage.getPersonalityInsightsByUserId(userId);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analyze-personality", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversationsByUserId(userId);
      const journalEntries = await storage.getJournalEntriesByUserId(userId);
      
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

  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversationsByUserId(userId);
      const journalEntries = await storage.getJournalEntriesByUserId(userId);
      const insights = await storage.getPersonalityInsightsByUserId(userId);
      
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

  // Mood entry endpoints
  app.post("/api/mood-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertMoodEntrySchema.parse(req.body);
      const entry = await storage.createMoodEntry({ ...validatedData, userId });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mood-entries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getMoodEntriesByUserId(userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Comprehensive personality reflection endpoint
  app.post("/api/personality-reflection", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Generate comprehensive profile
      const profile = await comprehensiveAnalytics.generatePersonalityProfile(userId);
      
      if (!profile) {
        return res.status(400).json({ 
          error: "Not enough data for comprehensive analysis. Continue journaling, chatting, and tracking moods to build your profile." 
        });
      }

      // Save the reflection
      const reflection = await storage.createPersonalityReflection({
        userId,
        summary: profile.summary,
        coreTraits: profile.coreTraits,
        behavioralPatterns: profile.behavioralPatterns,
        emotionalPatterns: profile.emotionalPatterns,
        relationshipDynamics: profile.relationshipDynamics,
        copingMechanisms: profile.copingMechanisms,
        growthAreas: profile.growthAreas,
        strengths: profile.strengths,
        blindSpots: profile.blindSpots,
        valuesAndBeliefs: profile.valuesAndBeliefs,
        therapeuticInsights: profile.therapeuticInsights,
        statistics: profile.statistics,
      });

      res.json(reflection);
    } catch (error: any) {
      console.error("Error generating personality reflection:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/personality-reflection", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reflection = await storage.getLatestPersonalityReflection(userId);
      
      if (!reflection) {
        return res.status(404).json({ error: "No personality reflection found. Generate one first." });
      }

      res.json(reflection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/text-to-speech", isAuthenticated, async (req: any, res) => {
    try {
      const { text, voiceId } = req.body;

      console.log("[TTS] Request received, text length:", text?.length, "voiceId:", voiceId);

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!process.env.ELEVENLABS_API_KEY) {
        console.error("[TTS] Eleven Labs API key not configured");
        return res.status(500).json({ error: "Eleven Labs API key not configured" });
      }

      const voice = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default to Rachel voice

      console.log("[TTS] Calling Eleven Labs API with voice:", voice);

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      console.log("[TTS] Eleven Labs response status:", response.status);

      if (!response.ok) {
        const error = await response.text();
        console.error("[TTS] Eleven Labs API error:", response.status, error);
        return res.status(response.status).json({ error: "Failed to generate speech" });
      }

      const audioBuffer = await response.arrayBuffer();
      console.log("[TTS] Audio buffer received, size:", audioBuffer.byteLength, "bytes");
      
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(Buffer.from(audioBuffer));
    } catch (error: any) {
      console.error("[TTS] Text-to-speech error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===== CATEGORY TRACKING ENDPOINTS =====
  
  // Validation schemas for category endpoints
  const selectCategorySchema = z.object({
    categoryId: z.string().min(1),
    goalScore: z.number().int().min(0).max(100).optional().nullable(),
    baselineScore: z.number().int().min(0).max(100).optional().nullable()
  });

  const generateScoreSchema = z.object({
    periodType: z.enum(['daily', 'weekly']).optional().default('daily'),
    lookbackDays: z.number().int().min(1).max(30).optional().default(7)
  });

  const getCategoryScoresSchema = z.object({
    period: z.enum(['daily', 'weekly']).optional(),
    limit: z.coerce.number().int().min(1).max(365).optional().default(30)
  });

  // GET /api/categories - List all categories with tier metadata
  app.get("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const { getAllCategories } = await import("./categories");
      const categories = getAllCategories();
      res.json(categories);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/user-categories - Get user's selected categories with latest scores
  app.get("/api/user-categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const selectedCategories = await storage.getUserSelectedCategories(userId);
      
      // Enrich with latest scores
      const enrichedCategories = await Promise.all(
        selectedCategories.map(async (cat) => {
          const latestDaily = await storage.getLatestCategoryScore(userId, cat.categoryId, 'daily');
          const latestWeekly = await storage.getLatestCategoryScore(userId, cat.categoryId, 'weekly');
          return {
            ...cat,
            latestDailyScore: latestDaily,
            latestWeeklyScore: latestWeekly
          };
        })
      );

      res.json(enrichedCategories);
    } catch (error: any) {
      console.error("Error fetching user categories:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/user-categories - Select a category to track
  app.post("/api/user-categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validation = selectCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { categoryId, goalScore, baselineScore } = validation.data;

      // Check if category exists
      const { getCategoryById } = await import("./categories");
      const category = getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // TODO: Add plan limit enforcement (Free=1, Premium tiers unlock more)
      // For MVP, allow unlimited selections

      const selected = await storage.selectCategory({
        userId,
        categoryId,
        status: 'active',
        baselineScore: baselineScore ?? null,
        goalScore: goalScore ?? null
      });

      res.status(201).json(selected);
    } catch (error: any) {
      console.error("Error selecting category:", error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return res.status(409).json({ error: "Category already selected" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/user-categories/:categoryId - Unselect a category
  app.delete("/api/user-categories/:categoryId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { categoryId } = req.params;

      await storage.unselectCategory(userId, categoryId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error unselecting category:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/category-scores/:categoryId/generate - Generate and persist new score
  app.post("/api/category-scores/:categoryId/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { categoryId } = req.params;
      
      // Validate request body
      const validation = generateScoreSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { periodType, lookbackDays } = validation.data;

      // Verify user has this category selected
      const selectedCategories = await storage.getUserSelectedCategories(userId);
      const isSelected = selectedCategories.some(cat => cat.categoryId === categoryId);
      
      if (!isSelected) {
        return res.status(403).json({ error: "Category not selected. Select it first." });
      }

      const { generateAndPersistCategoryScore } = await import("./category-scoring");
      const result = await generateAndPersistCategoryScore(
        userId,
        categoryId,
        periodType,
        lookbackDays
      );

      res.json(result);
    } catch (error: any) {
      console.error("Error generating category score:", error);
      
      // Handle insufficient data error
      if (error.message?.includes('Insufficient data')) {
        return res.status(400).json({ error: error.message });
      }
      
      // Handle duplicate score error (from unique constraint)
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return res.status(409).json({ error: "Score already exists for this period. Retrieve existing score instead." });
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/category-scores/:categoryId - Get score history for a category
  app.get("/api/category-scores/:categoryId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { categoryId } = req.params;
      
      // Validate query parameters
      const validation = getCategoryScoresSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { period, limit } = validation.data;

      const scores = await storage.getCategoryScores(userId, categoryId, period, limit);
      res.json(scores);
    } catch (error: any) {
      console.error("Error fetching category scores:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/category-insights/:categoryId - Get insights for a category
  app.get("/api/category-insights/:categoryId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { categoryId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const insights = await storage.getCategoryInsights(userId, categoryId, limit);
      res.json(insights);
    } catch (error: any) {
      console.error("Error fetching category insights:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
