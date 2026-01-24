import { type User, type UpsertUser, type Message, type InsertMessage, type JournalEntry, type InsertJournalEntry, type Conversation, type PersonalityInsight, type MemoryFact, type InsertMemoryFact, type MemoryFactMention, type InsertMemoryFactMention, type MemorySnapshot, type InsertMemorySnapshot, type MoodEntry, type InsertMoodEntry, type PersonalityReflection, type InsertPersonalityReflection, type UserSelectedCategory, type InsertUserSelectedCategory, type CategoryScore, type InsertCategoryScore, type CategoryInsight, type InsertCategoryInsight } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, conversations, messages, journalEntries, personalityInsights, memoryFacts, memoryFactMentions, memorySnapshots, moodEntries, personalityReflections, userSelectedCategories, categoryScores, categoryInsights } from "@shared/schema";
import { eq, desc, and, sql as drizzleSql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createConversation(userId: string): Promise<Conversation>;
  getConversation(id: string, userId: string): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: string, userId: string): Promise<Message[]>;
  getMessagesByConversationIds(conversationIds: string[], userId: string): Promise<Message[]>;
  
  createJournalEntry(entry: InsertJournalEntry & { userId: string }): Promise<JournalEntry>;
  getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]>;
  updateJournalEntry(id: string, userId: string, updates: Partial<InsertJournalEntry>): Promise<JournalEntry>;
  deleteJournalEntry(id: string, userId: string): Promise<void>;
  
  getPersonalityInsightsByUserId(userId: string): Promise<PersonalityInsight[]>;
  createPersonalityInsight(insight: Omit<PersonalityInsight, "id" | "createdAt">): Promise<PersonalityInsight>;
  
  createMemoryFact(fact: InsertMemoryFact): Promise<MemoryFact>;
  getMemoryFactsByUserId(userId: string, limit?: number): Promise<MemoryFact[]>;
  updateMemoryFactConfidence(factId: string, confidence: number): Promise<void>;
  
  createMemoryFactMention(mention: InsertMemoryFactMention): Promise<MemoryFactMention>;
  getMemoryFactMentionsByFactId(factId: string): Promise<MemoryFactMention[]>;
  
  createMemorySnapshot(snapshot: InsertMemorySnapshot): Promise<MemorySnapshot>;
  getLatestMemorySnapshotByUserId(userId: string, snapshotType: string): Promise<MemorySnapshot | undefined>;
  
  createMoodEntry(entry: InsertMoodEntry & { userId: string }): Promise<MoodEntry>;
  getMoodEntriesByUserId(userId: string): Promise<MoodEntry[]>;
  
  createPersonalityReflection(reflection: InsertPersonalityReflection & { userId: string }): Promise<PersonalityReflection>;
  getLatestPersonalityReflection(userId: string): Promise<PersonalityReflection | undefined>;
  getPersonalityReflection(id: string): Promise<PersonalityReflection | undefined>;
  getPersonalityReflectionForUser(id: string, userId: string): Promise<PersonalityReflection | undefined>;
  updatePersonalityReflectionForUser(id: string, userId: string, updates: Partial<PersonalityReflection>): Promise<PersonalityReflection>;
  updatePersonalityReflection(id: string, updates: Partial<PersonalityReflection>): Promise<PersonalityReflection>;
  getActivePersonalityReflection(userId: string): Promise<PersonalityReflection | undefined>;
  
  // Category tracking operations
  selectCategory(data: InsertUserSelectedCategory): Promise<UserSelectedCategory>;
  getUserSelectedCategories(userId: string): Promise<UserSelectedCategory[]>;
  unselectCategory(userId: string, categoryId: string): Promise<void>;
  
  createCategoryScore(score: InsertCategoryScore): Promise<CategoryScore>;
  getCategoryScores(userId: string, categoryId: string, periodType?: string, limit?: number): Promise<CategoryScore[]>;
  getLatestCategoryScore(userId: string, categoryId: string, periodType: string): Promise<CategoryScore | undefined>;
  getLatestCategoryScoresBatch(userId: string, categoryIds: string[], periodType: string): Promise<Record<string, CategoryScore>>;
  
  createCategoryInsight(insight: InsertCategoryInsight): Promise<CategoryInsight>;
  getCategoryInsights(userId: string, categoryId: string, limit?: number): Promise<CategoryInsight[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private journalEntries: Map<string, JournalEntry>;
  private personalityInsights: Map<string, PersonalityInsight>;
  private memoryFacts: Map<string, MemoryFact>;
  private memoryFactMentions: Map<string, MemoryFactMention>;
  private memorySnapshots: Map<string, MemorySnapshot>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.journalEntries = new Map();
    this.personalityInsights = new Map();
    this.memoryFacts = new Map();
    this.memoryFactMentions = new Map();
    this.memorySnapshots = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = userData.id ? this.users.get(userData.id) : undefined;
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createConversation(userId: string): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      id,
      userId,
      createdAt: new Date()
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversation(id: string, userId: string): Promise<Conversation | undefined> {
    const conv = this.conversations.get(id);
    return conv?.userId === userId ? conv : undefined;
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conv) => conv.userId === userId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByConversationId(conversationId: string, userId: string): Promise<Message[]> {
    const conv = this.conversations.get(conversationId);
    if (!conv || conv.userId !== userId) return [];

    return Array.from(this.messages.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getMessagesByConversationIds(conversationIds: string[], userId: string): Promise<Message[]> {
    const userConvs = Array.from(this.conversations.values()).filter(c => c.userId === userId && conversationIds.includes(c.id));
    const validConvIds = new Set(userConvs.map(c => c.id));

    return Array.from(this.messages.values())
      .filter((msg) => validConvIds.has(msg.conversationId))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createJournalEntry(insertEntry: InsertJournalEntry & { userId: string }): Promise<JournalEntry> {
    const id = randomUUID();
    const entry: JournalEntry = {
      id,
      userId: insertEntry.userId,
      content: insertEntry.content,
      prompt: insertEntry.prompt ?? null,
      wordCount: insertEntry.wordCount,
      createdAt: new Date()
    };
    this.journalEntries.set(id, entry);
    return entry;
  }

  async getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateJournalEntry(id: string, userId: string, updates: Partial<InsertJournalEntry>): Promise<JournalEntry> {
    const existing = this.journalEntries.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Journal entry not found or access denied");
    }
    const updated: JournalEntry = {
      ...existing,
      ...updates,
      prompt: updates.prompt ?? existing.prompt,
    };
    this.journalEntries.set(id, updated);
    return updated;
  }

  async deleteJournalEntry(id: string, userId: string): Promise<void> {
    const existing = this.journalEntries.get(id);
    if (existing && existing.userId === userId) {
      this.journalEntries.delete(id);
    }
  }

  async getPersonalityInsightsByUserId(userId: string): Promise<PersonalityInsight[]> {
    return Array.from(this.personalityInsights.values())
      .filter((insight) => insight.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createPersonalityInsight(insertInsight: Omit<PersonalityInsight, "id" | "createdAt">): Promise<PersonalityInsight> {
    const id = randomUUID();
    const insight: PersonalityInsight = {
      ...insertInsight,
      id,
      createdAt: new Date()
    };
    this.personalityInsights.set(id, insight);
    return insight;
  }

  async createMemoryFact(fact: InsertMemoryFact): Promise<MemoryFact> {
    throw new Error("Memory facts not supported in MemStorage");
  }

  async getMemoryFactsByUserId(userId: string, limit?: number): Promise<MemoryFact[]> {
    return [];
  }

  async updateMemoryFactConfidence(factId: string, confidence: number): Promise<void> {
    throw new Error("Memory facts not supported in MemStorage");
  }

  async createMemoryFactMention(mention: InsertMemoryFactMention): Promise<MemoryFactMention> {
    throw new Error("Memory fact mentions not supported in MemStorage");
  }

  async getMemoryFactMentionsByFactId(factId: string): Promise<MemoryFactMention[]> {
    return [];
  }

  async createMemorySnapshot(snapshot: InsertMemorySnapshot): Promise<MemorySnapshot> {
    throw new Error("Memory snapshots not supported in MemStorage");
  }

  async getLatestMemorySnapshotByUserId(userId: string, snapshotType: string): Promise<MemorySnapshot | undefined> {
    return undefined;
  }

  async createMoodEntry(entry: InsertMoodEntry & { userId: string }): Promise<MoodEntry> {
    throw new Error("Mood entries not supported in MemStorage");
  }

  async getMoodEntriesByUserId(userId: string): Promise<MoodEntry[]> {
    return [];
  }

  async createPersonalityReflection(reflection: InsertPersonalityReflection & { userId: string }): Promise<PersonalityReflection> {
    throw new Error("Personality reflections not supported in MemStorage");
  }

  async getLatestPersonalityReflection(userId: string): Promise<PersonalityReflection | undefined> {
    return undefined;
  }

  async getPersonalityReflection(id: string): Promise<PersonalityReflection | undefined> {
    return undefined;
  }

  async getPersonalityReflectionForUser(id: string, userId: string): Promise<PersonalityReflection | undefined> {
    return undefined;
  }

  async updatePersonalityReflectionForUser(
    id: string,
    userId: string,
    updates: Partial<PersonalityReflection>
  ): Promise<PersonalityReflection> {
    throw new Error("Personality reflections not supported in MemStorage");
  }

  async updatePersonalityReflection(id: string, updates: Partial<PersonalityReflection>): Promise<PersonalityReflection> {
    throw new Error("Personality reflections not supported in MemStorage");
  }

  async getActivePersonalityReflection(userId: string): Promise<PersonalityReflection | undefined> {
    return undefined;
  }

  // Category tracking operations (not supported in MemStorage)
  async selectCategory(data: InsertUserSelectedCategory): Promise<UserSelectedCategory> {
    throw new Error("Category tracking not supported in MemStorage");
  }

  async getUserSelectedCategories(userId: string): Promise<UserSelectedCategory[]> {
    return [];
  }

  async unselectCategory(userId: string, categoryId: string): Promise<void> {
    throw new Error("Category tracking not supported in MemStorage");
  }

  async createCategoryScore(score: InsertCategoryScore): Promise<CategoryScore> {
    throw new Error("Category tracking not supported in MemStorage");
  }

  async getCategoryScores(userId: string, categoryId: string, periodType?: string, limit?: number): Promise<CategoryScore[]> {
    return [];
  }

  async getLatestCategoryScore(userId: string, categoryId: string, periodType: string): Promise<CategoryScore | undefined> {
    return undefined;
  }

  async getLatestCategoryScoresBatch(userId: string, categoryIds: string[], periodType: string): Promise<Record<string, CategoryScore>> {
    return {};
  }

  async createCategoryInsight(insight: InsertCategoryInsight): Promise<CategoryInsight> {
    throw new Error("Category tracking not supported in MemStorage");
  }

  async getCategoryInsights(userId: string, categoryId: string, limit?: number): Promise<CategoryInsight[]> {
    return [];
  }
}

export class PostgresStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createConversation(userId: string): Promise<Conversation> {
    const result = await db.insert(conversations).values({ userId }).returning();
    return result[0];
  }

  async getConversation(id: string, userId: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .limit(1);
    return result[0];
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async getMessagesByConversationId(conversationId: string, userId: string): Promise<Message[]> {
    // Verify conversation ownership via join or subquery for robustness
    const result = await db.select({ message: messages })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(conversations.userId, userId)
      ))
      .orderBy(messages.createdAt);
    
    return result.map(r => r.message);
  }

  async getMessagesByConversationIds(conversationIds: string[], userId: string): Promise<Message[]> {
    if (conversationIds.length === 0) return [];
    
    const result = await db.select({ message: messages })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(
        drizzleSql`${messages.conversationId} IN ${conversationIds}`,
        eq(conversations.userId, userId)
      ))
      .orderBy(messages.createdAt);
    
    return result.map(r => r.message);
  }

  async createJournalEntry(insertEntry: InsertJournalEntry & { userId: string }): Promise<JournalEntry> {
    const result = await db.insert(journalEntries).values(insertEntry).returning();
    return result[0];
  }

  async getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }

  async updateJournalEntry(id: string, userId: string, updates: Partial<InsertJournalEntry>): Promise<JournalEntry> {
    const result = await db
      .update(journalEntries)
      .set(updates)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning();
    
    if (!result[0]) {
      throw new Error("Journal entry not found or access denied");
    }
    return result[0];
  }

  async deleteJournalEntry(id: string, userId: string): Promise<void> {
    await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
  }

  async getPersonalityInsightsByUserId(userId: string): Promise<PersonalityInsight[]> {
    return await db.select().from(personalityInsights)
      .where(eq(personalityInsights.userId, userId))
      .orderBy(desc(personalityInsights.createdAt));
  }

  async createPersonalityInsight(insertInsight: Omit<PersonalityInsight, "id" | "createdAt">): Promise<PersonalityInsight> {
    const result = await db.insert(personalityInsights).values(insertInsight).returning();
    return result[0];
  }

  async createMemoryFact(insertFact: InsertMemoryFact): Promise<MemoryFact> {
    const result = await db.insert(memoryFacts).values(insertFact).returning();
    return result[0];
  }

  async getMemoryFactsByUserId(userId: string, limit: number = 100): Promise<MemoryFact[]> {
    return await db.select().from(memoryFacts)
      .where(and(
        eq(memoryFacts.userId, userId),
        eq(memoryFacts.status, 'active')
      ))
      .orderBy(desc(memoryFacts.confidence))
      .limit(limit);
  }

  async updateMemoryFactConfidence(factId: string, confidence: number): Promise<void> {
    await db
      .update(memoryFacts)
      .set({ 
        confidence,
        updatedAt: drizzleSql`NOW()`
      })
      .where(eq(memoryFacts.id, factId));
  }

  async createMemoryFactMention(insertMention: InsertMemoryFactMention): Promise<MemoryFactMention> {
    const result = await db.insert(memoryFactMentions).values(insertMention).returning();
    return result[0];
  }

  async getMemoryFactMentionsByFactId(factId: string): Promise<MemoryFactMention[]> {
    return await db.select().from(memoryFactMentions)
      .where(eq(memoryFactMentions.factId, factId))
      .orderBy(desc(memoryFactMentions.createdAt));
  }

  async createMemorySnapshot(insertSnapshot: InsertMemorySnapshot): Promise<MemorySnapshot> {
    const result = await db.insert(memorySnapshots).values(insertSnapshot).returning();
    return result[0];
  }

  async getLatestMemorySnapshotByUserId(userId: string, snapshotType: string): Promise<MemorySnapshot | undefined> {
    const result = await db.select().from(memorySnapshots)
      .where(and(
        eq(memorySnapshots.userId, userId),
        eq(memorySnapshots.snapshotType, snapshotType)
      ))
      .orderBy(desc(memorySnapshots.createdAt))
      .limit(1);
    return result[0];
  }

  async createMoodEntry(entry: InsertMoodEntry & { userId: string }): Promise<MoodEntry> {
    const result = await db.insert(moodEntries).values(entry).returning();
    return result[0];
  }

  async getMoodEntriesByUserId(userId: string): Promise<MoodEntry[]> {
    return await db.select().from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt));
  }

  async createPersonalityReflection(reflection: InsertPersonalityReflection & { userId: string }): Promise<PersonalityReflection> {
    const result = await db.insert(personalityReflections).values(reflection).returning();
    return result[0];
  }

  async getLatestPersonalityReflection(userId: string): Promise<PersonalityReflection | undefined> {
    const result = await db.select().from(personalityReflections)
      .where(eq(personalityReflections.userId, userId))
      .orderBy(desc(personalityReflections.createdAt))
      .limit(1);
    return result[0];
  }

  async getPersonalityReflection(id: string): Promise<PersonalityReflection | undefined> {
    const result = await db.select().from(personalityReflections)
      .where(eq(personalityReflections.id, id))
      .limit(1);
    return result[0];
  }

  async getPersonalityReflectionForUser(id: string, userId: string): Promise<PersonalityReflection | undefined> {
    const result = await db
      .select()
      .from(personalityReflections)
      .where(and(eq(personalityReflections.id, id), eq(personalityReflections.userId, userId)))
      .limit(1);
    return result[0];
  }

  async updatePersonalityReflectionForUser(
    id: string,
    userId: string,
    updates: Partial<PersonalityReflection>
  ): Promise<PersonalityReflection> {
    const result = await db
      .update(personalityReflections)
      .set(updates)
      .where(and(eq(personalityReflections.id, id), eq(personalityReflections.userId, userId)))
      .returning();

    if (!result[0]) {
      throw new Error("Personality reflection not found or access denied");
    }
    return result[0];
  }

  async updatePersonalityReflection(id: string, updates: Partial<PersonalityReflection>): Promise<PersonalityReflection> {
    const result = await db
      .update(personalityReflections)
      .set(updates)
      .where(eq(personalityReflections.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Personality reflection not found");
    }
    return result[0];
  }

  async getActivePersonalityReflection(userId: string): Promise<PersonalityReflection | undefined> {
    // Find any reflection that is still pending or processing
    const result = await db.select().from(personalityReflections)
      .where(and(
        eq(personalityReflections.userId, userId),
        drizzleSql`${personalityReflections.status} IN ('pending', 'processing')`
      ))
      .orderBy(desc(personalityReflections.createdAt))
      .limit(1);
    return result[0];
  }

  // Category tracking operations
  async selectCategory(data: InsertUserSelectedCategory): Promise<UserSelectedCategory> {
    const result = await db.insert(userSelectedCategories).values(data).returning();
    return result[0];
  }

  async getUserSelectedCategories(userId: string): Promise<UserSelectedCategory[]> {
    return await db.select().from(userSelectedCategories)
      .where(and(
        eq(userSelectedCategories.userId, userId),
        eq(userSelectedCategories.status, 'active')
      ))
      .orderBy(userSelectedCategories.startedAt);
  }

  async unselectCategory(userId: string, categoryId: string): Promise<void> {
    await db
      .update(userSelectedCategories)
      .set({ status: 'inactive', pausedAt: new Date() })
      .where(and(
        eq(userSelectedCategories.userId, userId),
        eq(userSelectedCategories.categoryId, categoryId)
      ));
  }

  async createCategoryScore(score: InsertCategoryScore): Promise<CategoryScore> {
    const result = await db.insert(categoryScores).values(score).returning();
    return result[0];
  }

  async getCategoryScores(
    userId: string,
    categoryId: string,
    periodType?: string,
    limit: number = 30
  ): Promise<CategoryScore[]> {
    const conditions = [
      eq(categoryScores.userId, userId),
      eq(categoryScores.categoryId, categoryId)
    ];

    if (periodType) {
      conditions.push(eq(categoryScores.periodType, periodType));
    }

    return await db.select().from(categoryScores)
      .where(and(...conditions))
      .orderBy(desc(categoryScores.periodStart))
      .limit(limit);
  }

  async getLatestCategoryScore(
    userId: string,
    categoryId: string,
    periodType: string
  ): Promise<CategoryScore | undefined> {
    const result = await db.select().from(categoryScores)
      .where(and(
        eq(categoryScores.userId, userId),
        eq(categoryScores.categoryId, categoryId),
        eq(categoryScores.periodType, periodType)
      ))
      .orderBy(desc(categoryScores.periodStart))
      .limit(1);
    return result[0];
  }

  async getLatestCategoryScoresBatch(
    userId: string,
    categoryIds: string[],
    periodType: string
  ): Promise<Record<string, CategoryScore>> {
    if (categoryIds.length === 0) return {};

    // This is a bit complex in SQL to get the latest for each category in one go
    // We'll use a subquery or a distinct on if supported, but for portability and clarity:
    const result = await db.select().from(categoryScores)
      .where(and(
        eq(categoryScores.userId, userId),
        drizzleSql`${categoryScores.categoryId} IN ${categoryIds}`,
        eq(categoryScores.periodType, periodType)
      ))
      .orderBy(desc(categoryScores.periodStart));

    const latestMap: Record<string, CategoryScore> = {};
    for (const score of result) {
      if (!latestMap[score.categoryId]) {
        latestMap[score.categoryId] = score;
      }
    }
    return latestMap;
  }

  async createCategoryInsight(insight: InsertCategoryInsight): Promise<CategoryInsight> {
    const result = await db.insert(categoryInsights).values(insight).returning();
    return result[0];
  }

  async getCategoryInsights(
    userId: string,
    categoryId: string,
    limit: number = 10
  ): Promise<CategoryInsight[]> {
    return await db.select().from(categoryInsights)
      .where(and(
        eq(categoryInsights.userId, userId),
        eq(categoryInsights.categoryId, categoryId)
      ))
      .orderBy(desc(categoryInsights.createdAt))
      .limit(limit);
  }
}

export const storage = new PostgresStorage();
