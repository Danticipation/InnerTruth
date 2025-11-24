# Mirror - AI Personality Analyzer

## Overview
Mirror is an AI-powered personality analysis application that provides deep insights into user personality through conversations and journal entries. Its core purpose is to uncover personality traits, blind spots, and growth opportunities via comprehensive AI analysis, ultimately empowering users with self-awareness and personal growth.

## User Preferences
I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
Mirror employs a modern web stack focused on AI-driven personality analysis, user experience, and robust data management.

### UI/UX Decisions
The design utilizes React, TypeScript, Tailwind CSS, and Shadcn UI for a professional and consistent aesthetic. Branding is reinforced with a custom Chakrai logo. The application is fully responsive, optimized for all devices, and designed to foster trust, encourage self-reflection, provide actionable insights, and balance empathy with direct truth-telling.

### Technical Implementations
- **Frontend**: React and TypeScript.
- **Backend**: Express.js with TypeScript for API handling.
- **Database**: PostgreSQL via Neon Serverless, managed with Drizzle ORM for type-safe queries and migrations.
- **State Management**: TanStack Query for data fetching and caching.
- **Authentication**: Multi-user authentication via Replit Auth (OpenID Connect) with PostgreSQL-backed sessions and per-user data isolation.
- **AI Memory System**: GPT-4o asynchronously extracts, stores, and deduplicates facts from user interactions into a PostgreSQL memory system, injecting them into prompts for personalized responses.
- **Speech Integration**: Web Speech API for Speech-to-Text (STT) and Eleven Labs for high-quality Text-to-Speech (TTS), including advanced text processing to remove markdown and analytical labels. TTS is implemented for individual sections and journal entries.
- **Conversation Management**: Persistent conversation history stored in PostgreSQL, with a three-tier loading priority and a "New Chat" option.
- **Journal Management**: Features for saving, editing, and deleting journal entries with ownership verification and AI analysis triggers.
- **Tiered Personality Analysis**: Uses professional psychological frameworks (Schema Therapy, IFS, Attachment Theory, etc.) with three tiers:
  - **Free Tier**: 2 sections (Behavioral Patterns, Growth Areas) - basic insights
  - **Standard Tier**: 6 sections (adds Emotional Patterns, Relationship Dynamics, Strengths, Blind Spots) - deep dive analysis
  - **Premium Tier**: 9 sections (all Standard + Coping Mechanisms, Values & Beliefs, Therapeutic Insights) + Holy Shit Moment + Growth Leverage Point - devastating truth
- **Multi-Pass Generation System**: Instead of single monolithic AI call, generates each of the 9 sections separately with focused prompts. Each section gets 8-12 insights using section-specific analytical formats (e.g., Behavioral Patterns use [TRIGGER] → [ACTION] → [CONSEQUENCE] format). Sections are generated in parallel for speed (~2-3 min total). Premium tier includes final "Holy Shit Moment" synthesis.
- **Senior AI Quality Controls** (Complete Formula Implementation): Each section uses an "unforgiving, world-class personality analyst" system message with strict analytical principles:
  - **Persona Enforcement**: "If you have nothing new or deep to say, you say 'Insufficient data for meaningful analysis' rather than bullshit"
  - **Triangulation Mandatory**: Every insight must cite evidence from 2+ data sources
  - **Inference Over Echoing**: Go 2 inferential steps deeper than surface observations
  - **Contradiction Detection**: Ruthlessly expose gaps between stated vs. actual behavior
  - **Anti-Echo Guardrails**: Forbidden phrases list prevents therapeutic clichés
  - **Two-Step Chain-of-Thought**: First pass generates analysis, second pass (senior clinical supervisor) critiques and rewrites with mandatory rejection criteria
  - **Few-Shot Examples**: 6 devastating analysis examples integrated into every section prompt to raise quality floor
  - **Jaccard Similarity**: Automatically removes duplicate insights (>60% overlap) within each section
  - **Quality Threshold**: Every insight must make user think "holy shit, how did you know that?" or be explicitly marked "Insufficient depth"
- **AI Configuration**: GPT-4o with temperature 0.8-0.9 for analysis, temperature 0.3 for fact extraction, top_p 0.95, presence_penalty 0.2, frequency_penalty 0.8, max tokens 3000 per section, structured JSON output.
- **Multi-Level Memory System**: Extracts facts at 4 abstraction levels (raw_fact, inferred_belief, defense_mechanism, ifs_part) with deterministic temperature 0.3
- **Category Tracking**: Allows users to select improvement categories with tier-based limits, goal tracking, and AI-generated scores and insights.

### Feature Specifications
- **AI Chat Interface**: Direct AI personality analyst with conversation history, STT, and TTS.
- **Digital Journal**: Private journaling with prompts and AI analysis.
- **Personality Dashboard**: Displays live stats, AI-analyzed traits, patterns, blind spots, and growth opportunities.
- **Memory System**: GPT-4o-powered fact extraction for personalized AI context.
- **Comprehensive Intake Assessment**: A 5-step guided questionnaire to personalize insights.

### System Design Choices
The system enforces strict per-user data isolation for all sensitive information. AI analysis prioritizes "holy shit" revelations over surface-level observations by integrating diverse psychological frameworks and employing sophisticated anti-echo and duplicate detection mechanisms. Category tracking provides targeted self-improvement with AI-powered scoring and trend visualization.

## External Dependencies
- **AI Service**: OpenAI GPT-4o (direct API via user's OPENAI_API_KEY - bypasses Azure content filtering)
- **Database**: PostgreSQL (via Neon Serverless)
- **Text-to-Speech**: Eleven Labs
- **Authentication**: Replit Auth (OpenID Connect)
- **Frontend Framework**: React
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend Framework**: Express.js
- **ORM**: Drizzle ORM
- **State Management**: TanStack Query (React Query)

## Recent Changes

### November 23, 2025 - Direct OpenAI API Integration & Unfiltered Prompts
- **Switched to direct OpenAI API**: All OpenAI clients (routes.ts, memory-service.ts, comprehensive-analytics.ts, category-scoring.ts) now prioritize user's OPENAI_API_KEY over Replit's Azure-filtered AI_INTEGRATIONS_OPENAI_API_KEY
- **Removed Azure content filtering**: Bypasses Azure OpenAI's strict content policy that blocked "brutal/devastating/ruthless" language in prompts
- **Restored original brutal prompts**: Multi-pass system messages reverted from softened "experienced clinical" language back to "unforgiving, world-class personality analyst" with "uncomfortable truths", "ruthless contradiction detection", and "devastating accuracy"
- **Fixed JSON parsing bugs**: Added robust markdown stripping in memory-service.ts and comprehensive-analytics.ts to handle GPT-4o wrapping JSON in ```json code blocks (prevents SyntaxError during fact extraction)
- **Trade-off accepted**: User pays directly for OpenAI API usage (~$0.01-0.03 per analysis) in exchange for complete control over prompt content without corporate filtering
- **Anti-word-salad rules preserved**: Max 2 hyphens per insight, clear sentence structure, no jargon stacking - maintained regardless of API source

### November 24, 2025 - Evidence-Based Analysis with Citation Enforcement
- **Citation handle system**: All evidence sources now include explicit IDs ([MSG-xxxxx], [JOURNAL-xxxxx], [MOOD-xxxxx], [FACT-xxxxx]) for precise cross-source referencing
- **Cross-source triangulation enforcement**: Each insight MUST cite ≥2 different source types (e.g., conversation + journal, mood + fact) to prevent single-source echoing
- **Post-generation citation validation**: Automatic validation rejects insights lacking proper cross-source citations before they reach the user
- **Enhanced supervisor with rejection enforcement**: Second-pass supervisor has explicit 30-40% rejection target with 6 mandatory criteria (citation verification, echo check, revelation test, therapeutic nerve test, word salad check, duplicate check)
- **Rejection metrics logging**: System now logs rejectionCount and rejectionReasons to track quality gate effectiveness
- **Cross-source summary aggregation**: Added generateCrossSourceSummary() that provides mood trends (avg intensity, dominant moods), conversation activity, journal consistency patterns, and memory fact distribution
- **Strengthened few-shot examples**: All 7 examples now demonstrate proper cross-source citation format with explicit handles to teach GPT-4o proper triangulation
- **Quality gate reporting**: Automatic warnings when citation pass rate drops below 50% or supervisor approval rate exceeds 70%

### November 23, 2025 - Mood Tracking UI & Message Count Display
- **Added complete mood tracking interface**: Created Mood page (client/src/pages/Mood.tsx) with MoodInterface component for logging moods with intensity, activities, and notes
- **Fixed mood intensity slider scale**: Changed from incorrect 1-10 scale to proper 0-100 scale matching database schema (min=0, max=100, step=5)
- **Enhanced stats display**: Personality reflection stats now show "X total (Y messages)" format for clarity instead of just conversation count
- **Fixed loading state**: Removed premature "0 messages" display during personality reflection generation, now shows generic "Analyzing..." message
- **Mood entry persistence**: Fully functional POST /api/mood-entries endpoint creates mood entries with correct user_id isolation
- **Navigation integration**: Added Mood link to DashboardNav for easy access

### November 23, 2025 - Multi-Pass Tiered Analysis System with Senior AI Quality Controls
- Implemented three-tier personality analysis pricing model (Free/$0, Standard/$9, Premium/$29)
- Replaced single-pass AI generation with multi-pass system (9 separate focused calls per section)
- Added tier field to personalityReflections database schema
- Created TIER_CONFIG defining which sections are included at each tier
- Built tier selection UI with pricing cards, feature comparison, and upgrade dialog
- Sections generated in parallel for speed, each with 8-12 evidence-based insights
- Premium tier includes "Holy Shit Moment" - devastating synthesis of all patterns
- All non-included sections initialized to empty arrays to satisfy NOT NULL constraints
- **Integrated senior AI quality controls**: Each section now uses the same rigorous system message as the legacy implementation with anti-echo guardrails, contradiction detection, and forbidden phrases
- **Added Jaccard similarity duplicate detection**: Automatically removes insights with >60% overlap within each section AND across sections
- **Frequency penalty 0.8**: Prevents AI from repeating similar patterns across insights
- **Type safety improvements**: Added validation to handle non-string AI responses gracefully, preventing crashes during deduplication