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
- **AI Configuration**: GPT-4o with temperature 0.8, max tokens 3000 per section, frequency penalty 0.8 to prevent repetition, structured JSON output. Each insight must cite evidence from at least 2 data sources.
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
- **AI Service**: OpenAI GPT-4o (via Replit AI Integrations)
- **Database**: PostgreSQL (via Neon Serverless)
- **Text-to-Speech**: Eleven Labs
- **Authentication**: Replit Auth (OpenID Connect)
- **Frontend Framework**: React
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend Framework**: Express.js
- **ORM**: Drizzle ORM
- **State Management**: TanStack Query (React Query)

## Recent Changes

### November 23, 2025 - Multi-Pass Tiered Analysis System
- Implemented three-tier personality analysis pricing model (Free/$0, Standard/$9, Premium/$29)
- Replaced single-pass AI generation with multi-pass system (9 separate focused calls per section)
- Added tier field to personalityReflections database schema
- Created TIER_CONFIG defining which sections are included at each tier
- Built tier selection UI with pricing cards and feature comparison
- Sections generated in parallel for speed, each with 8-12 evidence-based insights
- Premium tier includes "Holy Shit Moment" - devastating synthesis of all patterns
- All non-included sections initialized to empty arrays to satisfy NOT NULL constraints