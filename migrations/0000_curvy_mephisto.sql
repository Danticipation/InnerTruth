CREATE TABLE "analytics_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"timeframe" text NOT NULL,
	"summary" text NOT NULL,
	"key_patterns" text[] NOT NULL,
	"recommended_actions" text[] NOT NULL,
	"severity" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"period_type" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"score" integer NOT NULL,
	"delta" integer,
	"reasoning" text,
	"key_patterns" text[],
	"progress_indicators" text[],
	"areas_for_growth" text[],
	"confidence_level" text,
	"evidence_snippets" jsonb,
	"dynamic_nudge" text,
	"contributors" jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_period_score" UNIQUE("user_id","category_id","period_type","period_start")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"prompt" text,
	"word_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_fact_mentions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fact_id" varchar NOT NULL,
	"source_type" text NOT NULL,
	"source_id" varchar NOT NULL,
	"evidence_excerpt" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_facts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"fact_content" text NOT NULL,
	"category" text NOT NULL,
	"abstraction_level" text DEFAULT 'raw_fact' NOT NULL,
	"confidence" integer DEFAULT 50 NOT NULL,
	"time_context" text,
	"emotional_tone" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"snapshot_type" text NOT NULL,
	"content" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mood_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"mood" text NOT NULL,
	"intensity" integer NOT NULL,
	"activities" text[],
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personality_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personality_reflections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_section" text,
	"error_message" text,
	"summary" text DEFAULT '' NOT NULL,
	"core_traits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"behavioral_patterns" text[] DEFAULT '{}' NOT NULL,
	"emotional_patterns" text[] DEFAULT '{}' NOT NULL,
	"relationship_dynamics" text[] DEFAULT '{}' NOT NULL,
	"coping_mechanisms" text[] DEFAULT '{}' NOT NULL,
	"growth_areas" text[] DEFAULT '{}' NOT NULL,
	"strengths" text[] DEFAULT '{}' NOT NULL,
	"blind_spots" text[] DEFAULT '{}' NOT NULL,
	"values_and_beliefs" text[] DEFAULT '{}' NOT NULL,
	"therapeutic_insights" text[] DEFAULT '{}' NOT NULL,
	"meta_reflections" text[] DEFAULT '{}' NOT NULL,
	"holy_shit_moment" text,
	"growth_leverage_point" text,
	"statistics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"target_type" text NOT NULL,
	"target_id" varchar NOT NULL,
	"is_accurate" boolean NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_selected_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"baseline_score" integer,
	"goal_score" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"paused_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_category" UNIQUE("user_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"plan_tier" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "score_user_category_idx" ON "category_scores" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE INDEX "score_user_period_idx" ON "category_scores" USING btree ("user_id","period_start");--> statement-breakpoint
CREATE INDEX "conv_user_id_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conv_user_created_idx" ON "conversations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "journal_user_id_idx" ON "journal_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "journal_user_created_idx" ON "journal_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "fact_user_id_idx" ON "memory_facts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fact_user_status_idx" ON "memory_facts" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "msg_conv_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "msg_conv_created_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "insight_user_id_idx" ON "personality_insights" USING btree ("user_id");