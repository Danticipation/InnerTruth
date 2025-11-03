import { type User, type UpsertUser, type Message, type InsertMessage, type JournalEntry, type InsertJournalEntry, type Conversation, type PersonalityInsight, type MemoryFact, type InsertMemoryFact, type MemoryFactMention, type InsertMemoryFactMention, type MemorySnapshot, type InsertMemorySnapshot, type MoodEntry, type InsertMoodEntry, type PersonalityReflection, type InsertPersonalityReflection } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, conversations, messages, journalEntries, personalityInsights, memoryFacts, memoryFactMentions, memorySnapshots, moodEntries, personalityReflections } from "@shared/schema";
import { eq, desc, and, sql as drizzleSql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createConversation(userId: string): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  
  createJournalEntry(entry: InsertJournalEntry & { userId: string }): Promise<JournalEntry>;
  getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]>;
  updateJournalEntry(id: string, updates: Partial<InsertJournalEntry>): Promise<JournalEntry>;
  deleteJournalEntry(id: string): Promise<void>;
  
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

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
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

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.conversationId === conversationId)
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

  async updateJournalEntry(id: string, updates: Partial<InsertJournalEntry>): Promise<JournalEntry> {
    const existing = this.journalEntries.get(id);
    if (!existing) {
      throw new Error("Journal entry not found");
    }
    const updated: JournalEntry = {
      ...existing,
      ...updates,
      prompt: updates.prompt ?? existing.prompt,
    };
    this.journalEntries.set(id, updated);
    return updated;
  }

  async deleteJournalEntry(id: string): Promise<void> {
    this.journalEntries.delete(id);
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

  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
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

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
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

  async updateJournalEntry(id: string, updates: Partial<InsertJournalEntry>): Promise<JournalEntry> {
    const result = await db
      .update(journalEntries)
      .set(updates)
      .where(eq(journalEntries.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Journal entry not found");
    }
    return result[0];
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
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
}

export const storage = new PostgresStorage();
