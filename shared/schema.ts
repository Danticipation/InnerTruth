import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  prompt: text("prompt"),
  wordCount: integer("word_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const personalityInsights = pgTable("personality_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  insightType: text("insight_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memoryFacts = pgTable("memory_facts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  factContent: text("fact_content").notNull(),
  category: text("category").notNull(),
  confidence: integer("confidence").notNull().default(50),
  timeContext: text("time_context"),
  emotionalTone: text("emotional_tone"),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const memoryFactMentions = pgTable("memory_fact_mentions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  factId: varchar("fact_id").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: varchar("source_id").notNull(),
  evidenceExcerpt: text("evidence_excerpt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memorySnapshots = pgTable("memory_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  snapshotType: text("snapshot_type").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});

export const insertPersonalityInsightSchema = createInsertSchema(personalityInsights).omit({
  id: true,
  createdAt: true,
});

export const insertMemoryFactSchema = createInsertSchema(memoryFacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemoryFactMentionSchema = createInsertSchema(memoryFactMentions).omit({
  id: true,
  createdAt: true,
});

export const insertMemorySnapshotSchema = createInsertSchema(memorySnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type PersonalityInsight = typeof personalityInsights.$inferSelect;
export type MemoryFact = typeof memoryFacts.$inferSelect;
export type MemoryFactMention = typeof memoryFactMentions.$inferSelect;
export type MemorySnapshot = typeof memorySnapshots.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type InsertMemoryFact = z.infer<typeof insertMemoryFactSchema>;
export type InsertMemoryFactMention = z.infer<typeof insertMemoryFactMentionSchema>;
export type InsertMemorySnapshot = z.infer<typeof insertMemorySnapshotSchema>;
