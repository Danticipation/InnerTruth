import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertJournalEntrySchema, insertMoodEntrySchema, type Message } from "@shared/schema";
import { aiService } from "./services/ai.service";
import { memoryService } from "./memory-service";
import { requireAuth, type AuthedRequest } from "./auth";
import { comprehensiveAnalytics } from "./comprehensive-analytics";
import { z } from "zod";
import { ForbiddenError, NotFoundError, BadRequestError } from "./lib/errors";
import { config } from "./config";
import { jobCoordinator } from "./lib/jobs";

async function triggerCategoryScoring(userId: string) {
  jobCoordinator.run("category-scoring", userId, async () => {
    const selectedCategories = await storage.getUserSelectedCategories(userId);
    
    if (selectedCategories.length === 0) {
      return;
    }

    for (const userCategory of selectedCategories) {
      const { categoryId } = userCategory;
      const { generateAndPersistCategoryScore } = await import("./category-scoring");
      
      await generateAndPersistCategoryScore(
        userId,
        categoryId,
        "daily",
        7
      );
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoint - check if user is logged in
  app.get('/api/auth/user', requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      if (!user) throw new NotFoundError("User not found");
      res.json(user);
    } catch (error: any) {
      next(error);
    }
  });

  // Protected routes - all require authentication
  app.post("/api/conversations", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const conversation = await storage.createConversation(userId);
      
      // Create initial welcome message in database for persistence
      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: "Hello! I'm here to help you explore your thoughts and feelings. What would you like to talk about today?"
      });
      
      res.json(conversation);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/conversations", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/messages", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const validatedData = insertMessageSchema.parse(req.body);
      
      // Verify conversation belongs to logged in user
      const conversation = await storage.getConversation(validatedData.conversationId, userId);
      if (!conversation) {
        throw new ForbiddenError("Conversation not found or access denied");
      }
      
      const userMessage = await storage.createMessage(validatedData);
      
      triggerCategoryScoring(userId).catch(err =>
        console.error("Error triggering category scoring after message:", err)
      );
      
      const conversationHistory = await storage.getMessagesByConversationId(validatedData.conversationId, userId);
      const memoryContext = await memoryService.getMemoryContext(userId);
      
      const aiResponse = await aiService.generateChatResponse(userId, conversationHistory, memoryContext);
      
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
      next(error);
    }
  });

  app.get("/api/messages/:conversationId", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      
      // Verify conversation belongs to logged in user
      const conversation = await storage.getConversation(req.params.conversationId, userId);
      if (!conversation) {
        throw new ForbiddenError("Conversation not found or access denied");
      }
      
      const messages = await storage.getMessagesByConversationId(req.params.conversationId, userId);
      res.json(messages);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/journal-entries", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
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
      
      if (allEntries.length >= 1) {
        const entriesText = allEntries.slice(0, 10).map(e => 
          `[${new Date(e.createdAt).toLocaleDateString()}] ${e.content}`
        ).join("\n\n---\n\n");
        
        let conversationContext = "";
        if (conversations.length > 0) {
          const recentConv = conversations[0]; // getConversationsByUserId returns sorted by desc
          const messages = await storage.getMessagesByConversationId(recentConv.id, userId);
          conversationContext = `\n\nRecent conversation themes:\n${messages.slice(-10).map(m => 
            `${m.role}: ${m.content}`
          ).join("\n")}`;
        }
        
        try {
          const memoryContext = await memoryService.getMemoryContext(userId);
          const insight = await aiService.analyzeJournalInsight(entriesText, conversationContext, memoryContext);
          
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
      next(error);
    }
  });

  app.get("/api/journal-entries", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const entries = await storage.getJournalEntriesByUserId(userId);
      res.json(entries);
    } catch (error: any) {
      next(error);
    }
  });

  app.put("/api/journal-entries/:id", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const validatedData = insertJournalEntrySchema.partial().parse(req.body);
      const updatedEntry = await storage.updateJournalEntry(id, userId, validatedData);
      res.json(updatedEntry);
    } catch (error: any) {
      next(error);
    }
  });

  app.delete("/api/journal-entries/:id", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      await storage.deleteJournalEntry(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/insights", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const insights = await storage.getPersonalityInsightsByUserId(userId);
      res.json(insights);
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/analyze-personality", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const conversations = await storage.getConversationsByUserId(userId);
      const journalEntries = await storage.getJournalEntriesByUserId(userId);
      
      if (conversations.length === 0 && journalEntries.length === 0) {
        throw new BadRequestError("Not enough data for analysis. Chat or journal first.");
      }
      
      let allMessages: Message[] = [];
      for (const conv of conversations) {
        const msgs = await storage.getMessagesByConversationId(conv.id, userId);
        allMessages = allMessages.concat(msgs);
      }
      
      const conversationText = allMessages.slice(-20).map(m => 
        `${m.role}: ${m.content}`
      ).join("\n");
      
      const journalText = journalEntries.slice(0, 10).map(e => 
        `[${new Date(e.createdAt).toLocaleDateString()}] ${e.content.substring(0, 500)}`
      ).join("\n\n---\n\n");
      
      const memoryContext = await memoryService.getMemoryContext(userId);
      const result = await aiService.performFullAnalysis(conversationText, journalText, memoryContext);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/stats", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
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
      next(error);
    }
  });

  // Mood entry endpoints
  app.post("/api/mood-entries", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const validatedData = insertMoodEntrySchema.parse(req.body);
      const entry = await storage.createMoodEntry({ ...validatedData, userId });
      res.json(entry);
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/mood-entries", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const entries = await storage.getMoodEntriesByUserId(userId);
      res.json(entries);
    } catch (error: any) {
      next(error);
    }
  });

  // Background job processor for personality reflection generation
  async function processPersonalityReflection(reflectionId: string, userId: string, tier: 'free' | 'standard' | 'premium') {
    
    try {
      // Update status to processing
      await storage.updatePersonalityReflection(reflectionId, {
        status: 'processing',
        progress: 5,
        currentSection: 'Initializing analysis...'
      });
      
      // Generate comprehensive profile with tier and progress callback
      const profile = await comprehensiveAnalytics.generatePersonalityProfile(
        userId, 
        tier,
        async (progress: number, currentSection: string) => {
          // Update progress in database
          await storage.updatePersonalityReflection(reflectionId, {
            progress,
            currentSection
          });
        }
      );
      
      if (!profile) {
        await storage.updatePersonalityReflection(reflectionId, {
          status: 'failed',
          errorMessage: 'Not enough data for comprehensive analysis. Continue journaling, chatting, and tracking moods to build your profile.',
          progress: 0
        });
        return;
      }
      
      // Update with completed analysis
      await storage.updatePersonalityReflection(reflectionId, {
        status: 'completed',
        progress: 100,
        currentSection: null,
        summary: profile.summary,
        coreTraits: profile.coreTraits,
        behavioralPatterns: profile.behavioralPatterns || [],
        emotionalPatterns: profile.emotionalPatterns || [],
        relationshipDynamics: profile.relationshipDynamics || [],
        copingMechanisms: profile.copingMechanisms || [],
        growthAreas: profile.growthAreas || [],
        strengths: profile.strengths || [],
        blindSpots: profile.blindSpots || [],
        valuesAndBeliefs: profile.valuesAndBeliefs || [],
        therapeuticInsights: profile.therapeuticInsights || [],
        holyShitMoment: profile.holyShitMoment || null,
        growthLeveragePoint: profile.growthLeveragePoint || null,
        statistics: profile.statistics,
      });
      
      
    } catch (error: any) {
      console.error('[PERSONALITY-REFLECTION] Background job failed:', error);
      
      let errorMessage = error.message || 'Unknown error occurred';
      
      // Handle OpenAI-specific errors
      if (error.status === 429 || error.code === 'insufficient_quota') {
        errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
      }
      
      await storage.updatePersonalityReflection(reflectionId, {
        status: 'failed',
        errorMessage,
        progress: 0
      });
    }
  }

  // Comprehensive personality reflection endpoint with async job support
  app.post("/api/personality-reflection", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { tier } = req.body as { tier?: 'free' | 'standard' | 'premium' };
      
      
      // Default to free tier if not specified
      const analysisTier = tier || 'free';
      
      // Validate tier
      if (!['free', 'standard', 'premium'].includes(analysisTier)) {
        return res.status(400).json({ error: "Invalid tier. Must be 'free', 'standard', or 'premium'" });
      }
      
      // Check if there's already an active generation for this user (per-user lock)
      const activeReflection = await storage.getActivePersonalityReflection(userId);
      if (activeReflection) {
        return res.json(activeReflection);
      }
      
      // Create a pending reflection record
      const reflection = await storage.createPersonalityReflection({
        userId,
        tier: analysisTier,
        status: 'pending',
        progress: 0,
        currentSection: 'Queued for processing...',
        summary: '',
        coreTraits: {},
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
        growthLeveragePoint: null,
        statistics: null,
      });
      
      
      // Kick off background processing via coordinator
      jobCoordinator.run("personality-reflection", userId, () => 
        processPersonalityReflection(reflection.id, userId, analysisTier)
      );
      
      // Return the pending reflection immediately
      res.json(reflection);
      
    } catch (error: any) {
      console.error("Error creating personality reflection job:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get personality reflection by ID (for polling)
  app.get("/api/personality-reflection/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const reflectionId = req.params.id;
      
      const reflection = await storage.getPersonalityReflection(reflectionId);
      
      if (!reflection) {
        return res.status(404).json({ error: "Personality reflection not found." });
      }
      
      // Verify ownership
      if (reflection.userId !== userId) {
        return res.status(403).json({ error: "Access denied." });
      }
      
      res.json(reflection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get latest personality reflection (completed only)
  app.get("/api/personality-reflection", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const reflection = await storage.getLatestPersonalityReflection(userId);
      
      if (!reflection) {
        return res.status(404).json({ error: "No personality reflection found. Generate one first." });
      }

      res.json(reflection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/text-to-speech", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const { text, voiceId } = req.body;


      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!process.env.ELEVENLABS_API_KEY) {
        console.error("[TTS] Eleven Labs API key not configured");
        return res.status(500).json({ error: "Eleven Labs API key not configured" });
      }

      const voice = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default to Rachel voice


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


      if (!response.ok) {
        const error = await response.text();
        console.error("[TTS] Eleven Labs API error:", response.status, error);
        return res.status(response.status).json({ error: "Failed to generate speech" });
      }

      const audioBuffer = await response.arrayBuffer();
      
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
  app.get("/api/categories", requireAuth, async (req: AuthedRequest, res: Response) => {
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
  app.get("/api/user-categories", requireAuth, async (req: AuthedRequest, res: Response, next) => {
    try {
      const userId = req.user!.id;
      const selectedCategories = await storage.getUserSelectedCategories(userId);
      
      if (selectedCategories.length === 0) {
        return res.json([]);
      }

      const categoryIds = selectedCategories.map(c => c.categoryId);
      
      // Batch fetch latest scores to avoid N+1
      const [latestDailyScores, latestWeeklyScores] = await Promise.all([
        storage.getLatestCategoryScoresBatch(userId, categoryIds, 'daily'),
        storage.getLatestCategoryScoresBatch(userId, categoryIds, 'weekly')
      ]);

      const enrichedCategories = selectedCategories.map(cat => ({
        ...cat,
        latestDailyScore: latestDailyScores[cat.categoryId] || null,
        latestWeeklyScore: latestWeeklyScores[cat.categoryId] || null
      }));

      res.json(enrichedCategories);
    } catch (error: any) {
      console.error("Error fetching user categories:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/user-categories - Select a category to track
  app.post("/api/user-categories", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
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

      try {
        const selected = await storage.selectCategory({
          userId,
          categoryId,
          status: 'active',
          baselineScore: baselineScore ?? null,
          goalScore: goalScore ?? null
        });
        return res.status(201).json(selected);
      } catch (error: any) {
        // If already selected, treat as success (idempotent)
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          const existing = await storage.getUserSelectedCategories(userId);
          const match = existing.find(c => c.categoryId === categoryId);
          return res.status(200).json(match || { success: true });
        }
        throw error;
      }
    } catch (error: any) {
      console.error("Error selecting category:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/user-categories/:categoryId - Unselect a category
  app.delete("/api/user-categories/:categoryId", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { categoryId } = req.params;

      await storage.unselectCategory(userId, categoryId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error unselecting category:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/category-scores/:categoryId/generate - Generate and persist new score
  app.post("/api/category-scores/:categoryId/generate", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
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
  app.get("/api/category-scores/:categoryId", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
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
  app.get("/api/category-insights/:categoryId", requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
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
