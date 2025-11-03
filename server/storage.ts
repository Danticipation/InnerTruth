import { type User, type InsertUser, type Message, type InsertMessage, type JournalEntry, type InsertJournalEntry, type Conversation, type PersonalityInsight, type MemoryFact, type InsertMemoryFact, type MemoryFactMention, type InsertMemoryFactMention, type MemorySnapshot, type InsertMemorySnapshot } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, conversations, messages, journalEntries, personalityInsights, memoryFacts, memoryFactMentions, memorySnapshots } from "@shared/schema";
import { eq, desc, and, sql as drizzleSql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createConversation(userId: string): Promise<Conversation>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]>;
  
  getPersonalityInsightsByUserId(userId: string): Promise<PersonalityInsight[]>;
  createPersonalityInsight(insight: Omit<PersonalityInsight, "id" | "createdAt">): Promise<PersonalityInsight>;
  
  createMemoryFact(fact: InsertMemoryFact): Promise<MemoryFact>;
  getMemoryFactsByUserId(userId: string, limit?: number): Promise<MemoryFact[]>;
  updateMemoryFactConfidence(factId: string, confidence: number): Promise<void>;
  
  createMemoryFactMention(mention: InsertMemoryFactMention): Promise<MemoryFactMention>;
  getMemoryFactMentionsByFactId(factId: string): Promise<MemoryFactMention[]>;
  
  createMemorySnapshot(snapshot: InsertMemorySnapshot): Promise<MemorySnapshot>;
  getLatestMemorySnapshotByUserId(userId: string, snapshotType: string): Promise<MemorySnapshot | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private journalEntries: Map<string, JournalEntry>;
  private personalityInsights: Map<string, PersonalityInsight>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.journalEntries = new Map();
    this.personalityInsights = new Map();
    
    const defaultUserId = "default-user-id";
    this.users.set(defaultUserId, {
      id: defaultUserId,
      username: "demo",
      password: "demo"
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
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

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const id = randomUUID();
    const entry: JournalEntry = {
      ...insertEntry,
      prompt: insertEntry.prompt ?? null,
      id,
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
}

export class PostgresStorage implements IStorage {
  private defaultUserInitialized = false;

  constructor() {
  }

  private async ensureDefaultUser() {
    if (this.defaultUserInitialized) return;
    
    try {
      const existingUser = await db.select().from(users).where(eq(users.username, "demo")).limit(1);

      if (existingUser.length === 0) {
        await db.insert(users).values({
          id: "default-user-id",
          username: "demo",
          password: "demo"
        });
      }
      this.defaultUserInitialized = true;
    } catch (error) {
      console.error("Failed to ensure default user:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureDefaultUser();
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureDefaultUser();
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createConversation(userId: string): Promise<Conversation> {
    const result = await db.insert(conversations).values({ userId }).returning();
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

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const result = await db.insert(journalEntries).values(insertEntry).returning();
    return result[0];
  }

  async getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
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
}

export const storage = new PostgresStorage();
