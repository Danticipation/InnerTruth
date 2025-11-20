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
- **Personality Analysis**: Uses professional psychological frameworks (Schema Therapy, IFS, Attachment Theory, etc.) to generate deep, non-obvious insights. It employs section-specific analytical formats, anti-echo guardrails to prevent superficial analysis, and a quality gate with Jaccard similarity to reject duplicate insights. AI configuration uses GPT-4o with temperature 0.8 and structured JSON output. Analysis is triggered continuously, with Level 1 (blind spots, growth opportunities) on journal saves and Level 2 (Big 5, core patterns, etc.) on dashboard load.
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