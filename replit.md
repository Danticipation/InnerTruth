# Mirror - AI Personality Analyzer

## Overview
Mirror is an AI-powered personality analysis application designed to provide in-depth insights into user personality through conversational interactions and journal entries. Its primary goal is to enhance self-awareness and personal growth by identifying personality traits, blind spots, and opportunities for development through comprehensive AI analysis.

## User Preferences
I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
Mirror utilizes a modern web stack for AI-driven personality analysis, user experience, and robust data management.

### UI/UX Decisions
The application uses React, TypeScript, Tailwind CSS, and Shadcn UI for a professional and responsive design. It features a custom Chakrai logo and is optimized for all devices, aiming to build trust, encourage self-reflection, and deliver actionable insights with a balance of empathy and directness.

### Technical Implementations
- **Frontend**: React and TypeScript.
- **Backend**: Express.js with TypeScript for API handling.
- **Database**: PostgreSQL via Neon Serverless, managed with Drizzle ORM.
- **State Management**: TanStack Query for data fetching and caching.
- **Authentication**: Multi-user authentication via Replit Auth (OpenID Connect) with PostgreSQL-backed sessions and per-user data isolation.
- **AI Memory System**: GPT-4o asynchronously extracts, stores, and deduplicates facts from user interactions into a PostgreSQL memory system, used to personalize AI responses.
- **Speech Integration**: Web Speech API for Speech-to-Text (STT) and Eleven Labs for high-quality Text-to-Speech (TTS), with advanced text processing. TTS is implemented for individual sections and journal entries.
- **Conversation Management**: Persistent conversation history stored in PostgreSQL, with a three-tier loading priority and a "New Chat" option.
- **Journal Management**: Features for saving, editing, and deleting journal entries with ownership verification and AI analysis triggers.
- **Tiered Personality Analysis**: Utilizes professional psychological frameworks across three tiers (Free, Standard, Premium) offering increasing depth of analysis (2, 6, and 9 sections respectively, plus "Holy Shit Moment" and "Growth Leverage Point" for Premium).
- **Multi-Pass Generation System**: Each analysis section is generated sequentially using focused prompts to avoid rate limits, with 8-12 insights per section in specific analytical formats.
- **Senior AI Quality Controls**: Employs an "unforgiving, world-class personality analyst" system message with strict principles including persona enforcement, mandatory triangulation (2+ data sources), inference over echoing, contradiction detection, anti-echo guardrails, two-step Chain-of-Thought with supervisor critique, few-shot examples, Jaccard similarity for duplicate removal, and a high-quality threshold for insights.
- **AI Configuration**: GPT-4o with specific temperature settings (0.8-0.9 for analysis, 0.3 for fact extraction), top_p 0.95, presence_penalty 0.2, frequency_penalty 0.8, max tokens 3000 per section, and structured JSON output.
- **Multi-Level Memory System**: Extracts facts at 4 abstraction levels (raw_fact, inferred_belief, defense_mechanism, ifs_part) with deterministic temperature.
- **Category Tracking**: Allows users to select improvement categories with tier-based limits, goal tracking, and AI-generated scores and insights.

### Feature Specifications
- **AI Chat Interface**: Direct AI personality analyst with conversation history, STT, and TTS.
- **Digital Journal**: Private journaling with prompts and AI analysis.
- **Personality Dashboard**: Displays live stats, AI-analyzed traits, patterns, blind spots, and growth opportunities.
- **Memory System**: GPT-4o-powered fact extraction for personalized AI context.
- **Comprehensive Intake Assessment**: A 5-step guided questionnaire to personalize insights.

### System Design Choices
The system enforces strict per-user data isolation. AI analysis prioritizes "holy shit" revelations over surface-level observations by integrating diverse psychological frameworks and employing sophisticated anti-echo and duplicate detection mechanisms. Category tracking provides targeted self-improvement with AI-powered scoring and trend visualization.

## External Dependencies
- **AI Service**: OpenAI GPT-4o (direct API via user's `OPENAI_API_KEY`)
- **Database**: PostgreSQL (via Neon Serverless)
- **Text-to-Speech**: Eleven Labs
- **Authentication**: Replit Auth (OpenID Connect)
- **Frontend Framework**: React
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend Framework**: Express.js
- **ORM**: Drizzle ORM
- **State Management**: TanStack Query