import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertJournalEntrySchema, insertMoodEntrySchema, type Message } from "@shared/schema";
import OpenAI from "openai";
import { memoryService } from "./memory-service";
import { requireAuth } from "./auth";
import { comprehensiveAnalytics } from "./comprehensive-analytics";
import { z } from "zod";

// Initialize OpenAI client - prioritize direct API for unfiltered access
const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
if (!apiKey) {
  console.error("ERROR: No OpenAI API key configured. Set either OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY");
  throw new Error("OpenAI API key not configured");
}

const openai = new OpenAI({
  apiKey,
  // Only use baseURL if using Replit integration (AI_INTEGRATIONS_OPENAI_API_KEY)
  baseURL: process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
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
  // Auth endpoint - check if user is authenticated
  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Protected routes - all require authentication
  app.post("/api/conversations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get("/api/conversations", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      
      const systemPrompt = `You are a direct, insightful AI personality analyst. Your role is to help users gain deeper self-understanding. You are:
1. Empathetic but honest - provide clear observations without minimizing
2. Pattern-focused - actively identify contradictions, recurring themes, and behavioral patterns
3. Direct when appropriate - if you notice avoidance, people-pleasing, or self-deception, point it out clearly but kindly
4. Curious about root causes - dig deeper into "why" behind behaviors and beliefs
5. Growth-oriented - always connect insights to actionable improvements

Your style:
- Ask probing questions that challenge assumptions
- Point out contradictions you notice: "Earlier you said X, but now you're saying Y. What's really going on?"
- Name patterns directly: "I'm noticing a pattern where you..."
- Balance clarity with compassion - be direct and supportive
- Keep responses 2-4 sentences with one meaningful question

Your goal is to be the honest mirror users need for genuine self-awareness.

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

  app.get("/api/messages/:conversationId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
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

  app.post("/api/journal-entries", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get("/api/journal-entries", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const entries = await storage.getJournalEntriesByUserId(userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/journal-entries/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.delete("/api/journal-entries/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get("/api/insights", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const insights = await storage.getPersonalityInsightsByUserId(userId);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  app.get("/api/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
  app.post("/api/mood-entries", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertMoodEntrySchema.parse(req.body);
      const entry = await storage.createMoodEntry({ ...validatedData, userId });
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mood-entries", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const entries = await storage.getMoodEntriesByUserId(userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Background job processor for personality reflection generation
  async function processPersonalityReflection(reflectionId: string, userId: string, tier: 'free' | 'standard' | 'premium') {
    console.log('[PERSONALITY-REFLECTION] Background job started:', { reflectionId, userId, tier });
    
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
      
      console.log('[PERSONALITY-REFLECTION] Background job completed:', reflectionId);
      
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
  app.post("/api/personality-reflection", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { tier } = req.body as { tier?: 'free' | 'standard' | 'premium' };
      
      console.log('[PERSONALITY-REFLECTION] Request received:', { userId, requestedTier: tier });
      
      // Default to free tier if not specified
      const analysisTier = tier || 'free';
      
      // Validate tier
      if (!['free', 'standard', 'premium'].includes(analysisTier)) {
        return res.status(400).json({ error: "Invalid tier. Must be 'free', 'standard', or 'premium'" });
      }
      
      // Check if there's already an active generation for this user (per-user lock)
      const activeReflection = await storage.getActivePersonalityReflection(userId);
      if (activeReflection) {
        console.log('[PERSONALITY-REFLECTION] Active job found, returning existing:', activeReflection.id);
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
      
      console.log('[PERSONALITY-REFLECTION] Created pending job:', reflection.id);
      
      // Kick off background processing (don't await - fire and forget)
      processPersonalityReflection(reflection.id, userId, analysisTier).catch(err => {
        console.error('[PERSONALITY-REFLECTION] Background job error:', err);
      });
      
      // Return the pending reflection immediately
      res.json(reflection);
      
    } catch (error: any) {
      console.error("Error creating personality reflection job:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get personality reflection by ID (for polling)
  app.get("/api/personality-reflection/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Get latest personality reflection (active if running, else latest completed)
  app.get("/api/personality-reflection/latest", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Prefer active reflection (pending/processing) for progress UX
      const activeReflection = await storage.getActivePersonalityReflection(userId);
      if (activeReflection) {
        return res.json(activeReflection);
      }

      // Otherwise return latest completed reflection
      const reflection = await storage.getLatestPersonalityReflection(userId);
      if (!reflection) {
        return res.status(404).json({ error: "No personality reflection found. Generate one first." });
      }

      res.json(reflection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // Get latest personality reflection (completed only)
  app.get("/api/personality-reflection", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reflection = await storage.getLatestPersonalityReflection(userId);
      
      if (!reflection) {
        return res.status(404).json({ error: "No personality reflection found. Generate one first." });
      }

      res.json(reflection);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/text-to-speech", requireAuth, async (req: any, res) => {
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
  app.get("/api/categories", requireAuth, async (req: any, res) => {
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
  app.get("/api/user-categories", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
  app.post("/api/user-categories", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
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
  app.delete("/api/user-categories/:categoryId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { categoryId } = req.params;

      await storage.unselectCategory(userId, categoryId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error unselecting category:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/category-scores/:categoryId/generate - Generate and persist new score
  app.post("/api/category-scores/:categoryId/generate", requireAuth, async (req, res) => {
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
  app.get("/api/category-scores/:categoryId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
  app.get("/api/category-insights/:categoryId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
