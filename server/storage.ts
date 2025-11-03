import { type User, type InsertUser, type Message, type InsertMessage, type JournalEntry, type InsertJournalEntry, type Conversation, type PersonalityInsight } from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export const storage = new MemStorage();
