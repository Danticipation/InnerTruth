import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, index, unique, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),  // Not unique - same email can exist across different OAuth providers
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("conv_user_id_idx").on(table.userId),
  userCreatedIdx: index("conv_user_created_idx").on(table.userId, table.createdAt),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  convIdIdx: index("msg_conv_id_idx").on(table.conversationId),
  convCreatedIdx: index("msg_conv_created_idx").on(table.conversationId, table.createdAt),
}));

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  prompt: text("prompt"),
  wordCount: integer("word_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("journal_user_id_idx").on(table.userId),
  userCreatedIdx: index("journal_user_created_idx").on(table.userId, table.createdAt),
}));

export const personalityInsights = pgTable("personality_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  insightType: text("insight_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("insight_user_id_idx").on(table.userId),
}));

export const memoryFacts = pgTable("memory_facts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  factContent: text("fact_content").notNull(),
  category: text("category").notNull(),
  abstractionLevel: text("abstraction_level").notNull().default('raw_fact'), // raw_fact, inferred_belief, defense_mechanism, ifs_part
  confidence: integer("confidence").notNull().default(50),
  timeContext: text("time_context"),
  emotionalTone: text("emotional_tone"),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("fact_user_id_idx").on(table.userId),
  userStatusIdx: index("fact_user_status_idx").on(table.userId, table.status),
}));

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

export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mood: text("mood").notNull(),
  intensity: integer("intensity").notNull(),
  activities: text("activities").array(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const personalityReflections = pgTable("personality_reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tier: text("tier").notNull().default('free'), // free, standard, premium
  status: text("status").notNull().default('pending'), // pending, processing, completed, failed
  progress: integer("progress").notNull().default(0), // 0-100 percentage
  currentSection: text("current_section"), // which section is being generated
  errorMessage: text("error_message"), // error details if failed
  summary: text("summary").notNull().default(''),
  coreTraits: jsonb("core_traits").notNull().default({}),
  behavioralPatterns: text("behavioral_patterns").array().notNull().default([]),
  emotionalPatterns: text("emotional_patterns").array().notNull().default([]),
  relationshipDynamics: text("relationship_dynamics").array().notNull().default([]),
  copingMechanisms: text("coping_mechanisms").array().notNull().default([]),
  growthAreas: text("growth_areas").array().notNull().default([]),
  strengths: text("strengths").array().notNull().default([]),
  blindSpots: text("blind_spots").array().notNull().default([]),
  valuesAndBeliefs: text("values_and_beliefs").array().notNull().default([]),
  therapeuticInsights: text("therapeutic_insights").array().notNull().default([]),
  metaReflections: text("meta_reflections").array().notNull().default([]),
  holyShitMoment: text("holy_shit_moment"),
  growthLeveragePoint: text("growth_leverage_point"),
  statistics: jsonb("statistics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Category Tracking Tables (MVP Feature)
export const userSelectedCategories = pgTable("user_selected_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  status: text("status").notNull().default('active'),
  baselineScore: integer("baseline_score"),
  goalScore: integer("goal_score"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  pausedAt: timestamp("paused_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserCategory: unique('unique_user_category').on(table.userId, table.categoryId)
}));

export const categoryScores = pgTable("category_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  periodType: text("period_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  score: integer("score").notNull(),
  delta: integer("delta"),
  reasoning: text("reasoning"),
  keyPatterns: text("key_patterns").array(),
  progressIndicators: text("progress_indicators").array(),
  areasForGrowth: text("areas_for_growth").array(),
  confidenceLevel: text("confidence_level"),
  evidenceSnippets: jsonb("evidence_snippets"),
  dynamicNudge: text("dynamic_nudge"),
  contributors: jsonb("contributors"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (table) => ({
  uniquePeriodScore: unique('unique_period_score').on(table.userId, table.categoryId, table.periodType, table.periodStart),
  userCategoryIdx: index("score_user_category_idx").on(table.userId, table.categoryId),
  userPeriodIdx: index("score_user_period_idx").on(table.userId, table.periodStart),
}));

export const categoryInsights = pgTable("category_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  categoryId: varchar("category_id").notNull(),
  timeframe: text("timeframe").notNull(),
  summary: text("summary").notNull(),
  keyPatterns: text("key_patterns").array().notNull(),
  recommendedActions: text("recommended_actions").array().notNull(),
  severity: text("severity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userFeedback = pgTable("user_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  targetType: text("target_type").notNull(), // 'insight', 'reflection', 'category_score'
  targetId: varchar("target_id").notNull(),
  isAccurate: boolean("is_accurate").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  eventType: text("event_type").notNull(), // 'conversion_start', 'conversion_complete', 'tier_limit_reached', 'premium_feature_click'
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
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
  userId: true,
  createdAt: true,
});

export const insertPersonalityInsightSchema = createInsertSchema(personalityInsights).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMemoryFactSchema = createInsertSchema(memoryFacts).omit({
  id: true,
  userId: true,
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

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertPersonalityReflectionSchema = createInsertSchema(personalityReflections).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertUserSelectedCategorySchema = createInsertSchema(userSelectedCategories).omit({
  id: true,
  createdAt: true,
  startedAt: true,
});

export const insertCategoryScoreSchema = createInsertSchema(categoryScores).omit({
  id: true,
  generatedAt: true,
});

export const insertCategoryInsightSchema = createInsertSchema(categoryInsights).omit({
  id: true,
  createdAt: true,
});

export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type PersonalityInsight = typeof personalityInsights.$inferSelect;
export type MemoryFact = typeof memoryFacts.$inferSelect;
export type MemoryFactMention = typeof memoryFactMentions.$inferSelect;
export type MemorySnapshot = typeof memorySnapshots.$inferSelect;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type PersonalityReflection = typeof personalityReflections.$inferSelect;
export type UserSelectedCategory = typeof userSelectedCategories.$inferSelect;
export type CategoryScore = typeof categoryScores.$inferSelect;
export type CategoryInsight = typeof categoryInsights.$inferSelect;
export type UserFeedback = typeof userFeedback.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type InsertMemoryFact = Omit<typeof memoryFacts.$inferInsert, "id" | "createdAt" | "updatedAt">;
export type InsertMemoryFactMention = z.infer<typeof insertMemoryFactMentionSchema>;
export type InsertMemorySnapshot = z.infer<typeof insertMemorySnapshotSchema>;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type InsertPersonalityReflection = z.infer<typeof insertPersonalityReflectionSchema>;
export type InsertUserSelectedCategory = z.infer<typeof insertUserSelectedCategorySchema>;
export type InsertCategoryScore = z.infer<typeof insertCategoryScoreSchema>;
export type InsertCategoryInsight = z.infer<typeof insertCategoryInsightSchema>;
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
