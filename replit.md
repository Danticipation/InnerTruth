# Mirror - AI Personality Analyzer

## Overview
Mirror is an AI-powered personality analysis application designed to provide users with deep insights into their personality through conversations and journal entries. It aims to uncover personality traits, blind spots, and growth opportunities by offering "the hard truth" through comprehensive AI analysis. The project's ambition is to empower users with self-awareness and personal growth.

## User Preferences
I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
Mirror utilizes a modern web stack with a focus on AI-driven personality analysis.

### UI/UX Decisions
- **Design System**: React, TypeScript, Tailwind CSS, and Shadcn UI for a consistent and professional look and feel.
- **Branding**: Custom Chakrai logo (two-face mirror design) integrated throughout for consistent branding.
- **Responsiveness**: Fully responsive design optimized for mobile (hamburger menu, touch-friendly UI) to desktop, ensuring a seamless experience across devices.
- **User Experience Focus**: Designed to be trustworthy, encourage honest self-reflection, provide actionable insights, balance empathy with direct truth-telling, and help users discover blind spots.

### Technical Implementations
- **Frontend**: React for dynamic user interfaces, TypeScript for type safety.
- **Backend**: Express.js with TypeScript for robust API handling.
- **Database**: PostgreSQL via Neon Serverless for persistent storage, managed with Drizzle ORM for schema migrations and type-safe queries.
- **State Management**: TanStack Query (React Query) for efficient data fetching, caching, and synchronization.
- **Authentication**: Multi-user authentication using Replit Auth (OpenID Connect via Google, GitHub, X, Apple, email/password) with PostgreSQL-backed session storage and 7-day TTL.
  - **OIDC Claim Mapping**: Standard OIDC claims (`given_name`, `family_name`) are properly mapped to user profile fields, with fallback to parsing `name` claim if needed (November 2025 fix).
- **Data Isolation**: Strict per-user data isolation for all sensitive information (conversations, journal entries, insights, memory facts) enforced at the API level with `isAuthenticated` middleware and ownership verification.
- **AI Memory System**: Asynchronous GPT-4o calls extract, store, and deduplicate facts from conversations and journal entries into a PostgreSQL-based memory system. These facts (up to 20 per interaction) are injected into AI prompts to provide personalized responses.
- **Speech Integration**:
    - **Speech-to-Text (STT)**: Browser-based Web Speech API for real-time voice input (Chrome/Edge).
    - **Text-to-Speech (TTS)**: Eleven Labs integration for natural, high-quality AI voice responses with server-side API calls for security. Includes markdown stripping to prevent literal reading of formatting symbols (asterisks, underscores, etc.).
    - **Section-Level Playback**: Individual TTS play buttons on each section of personality reflection (archetype, behavioral patterns, strengths, blind spots, etc.) to work within Eleven Labs' 10k character limit. Each section can be played independently.
    - **Journal TTS**: Text-to-speech playback for individual journal entries with speaker button controls.
- **Conversation Management**: Persistent conversation history with PostgreSQL storage. All conversations start with a welcome message saved to the database (not just client state), ensuring data persists across server restarts. Three-tier loading priority: stored ID, most recent, new conversation with "New Chat" button.
- **Journal Management**: Features include saving, editing, and deleting journal entries with ownership verification and automatic AI analysis triggers.
- **Personality Analysis**:
    - **Continuous Insight Generation**: Level 1 analysis triggered on journal saves (min 2 entries), analyzing up to 10 journal entries + recent conversations to generate Blind Spots and Growth Opportunities.
    - **Comprehensive Personality Analysis**: Level 2 analysis on dashboard load/manual refresh, analyzing 20 conversation messages + 10 journal entries to determine Big 5 Traits, Core Patterns, Blind Spots, and Strengths.
- **Category Tracking**: A system for users to select improvement categories (e.g., Relationships, Emotional Regulation) with tier-based limits (free, standard, premium), goal tracking, and AI-generated scores and insights specific to each category.

### Feature Specifications
- **AI Chat Interface**: Direct AI personality analyst using GPT-4o, with conversation history, speech-to-text, and text-to-speech.
- **Digital Journal**: Private journaling with prompts, automatic word count, and AI analysis upon saving.
- **Personality Dashboard**: Displays live stats, AI-analyzed Big 5 traits, core behavioral patterns, blind spots, and growth opportunities.
- **Memory System**: GPT-4o extracts and stores facts from user interactions, providing personalized context to AI responses.
- **Comprehensive Intake Assessment**: 5-step guided questionnaire collecting basic information, life satisfaction ratings, Big 5 personality self-assessments, current challenges, and goals. Saves as a special journal entry for AI analysis to personalize insights.

### API Endpoints
**Core Features:**
- `POST /api/conversations` - Create new conversation
- `POST /api/messages` - Send message, get AI response
- `POST /api/journal-entries` - Save journal entry
- `GET /api/journal-entries` - Get all journal entries
- `PUT /api/journal-entries/:id` - Update journal entry (with ownership verification)
- `DELETE /api/journal-entries/:id` - Delete journal entry (with ownership verification)
- `POST /api/analyze-personality` - Run comprehensive analysis
- `GET /api/insights` - Get AI-generated insights
- `GET /api/stats` - Get user statistics
- `POST /api/text-to-speech` - Generate speech audio from text (Eleven Labs)

**Category Tracking (NEW):**
- `GET /api/categories` - List all 8 improvement categories with tier metadata
- `GET /api/user-categories` - Get user's selected categories
- `POST /api/user-categories` - Select a category (validates tier limits)
- `PUT /api/user-categories/:categoryId` - Update category goals (goalScore, baselineScore)
- `POST /api/category-scores/:categoryId/generate` - Generate AI score for a category
- `GET /api/category-scores/:categoryId` - Get score history (query: period, limit)
- `GET /api/category-insights/:categoryId` - Get AI insights for a category

### Data Model
**Core Tables:**
- Users: User accounts with authentication via Replit Auth (OIDC)
- Sessions: PostgreSQL-backed session storage with 7-day TTL
- Conversations: User chat sessions (per-user isolation)
- Messages: Individual chat messages (user/assistant)
- Journal Entries: Daily reflections with word count (per-user isolation)
- Personality Insights: AI-generated observations (per-user isolation)
- Memory Facts: Extracted factual knowledge about the user (per-user isolation)
- Memory Fact Mentions: Evidence linking facts to specific messages/journals
- Memory Snapshots: Periodic summaries of memory state (schema ready, not yet used)

**Category Tracking (NEW):**
- Categories: 8 improvement areas (Relationships, Emotional Regulation, Confidence, Career, Decision-Making, Work-Life Balance, Conflict Resolution, Authenticity)
  - Each has tier (free/standard/premium), description, scoring criteria
- User Selected Categories: Many-to-many with tier enforcement
  - Free plan: 1 category, Standard: 3, Premium: unlimited
  - Tracks selection timestamp, goalScore (target 0-100), baselineScore (starting point)
- Category Scores: Time-series AI-generated scores (unique on userId+categoryId+periodType+periodStart)
  - Fields: score (0-100), reasoning, confidenceLevel (low/medium/high)
  - Evidence: keyPatterns[], progressIndicators[], areasForGrowth[], evidenceSnippets[]
  - Metadata: periodType (daily/weekly), periodStart/periodEnd, contributors (journal/message counts)
- Category Insights: Long-form AI analysis
  - Recurring themes, blind spots, strengths, growth recommendations

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

## Category Tracking Architecture (November 2025)

### System Overview
Mirror's category tracking system provides targeted self-improvement through AI-powered scoring and trend visualization. Users select specific life areas to improve and receive daily/weekly scores based on AI analysis of their journal entries and chat messages.

### Core Workflow
1. **Category Selection**: User selects 1-8 categories based on subscription tier (Free=1, Standard=3, Premium=unlimited)
2. **Natural Usage**: User journals and chats normally over 7+ days, building up data
3. **Score Generation**: Manual or automatic trigger analyzes recent activity
4. **AI Analysis**: GPT-4o generates 0-100 score with reasoning, key patterns, and evidence snippets
5. **Trend Tracking**: Scores persist for 30-day visualization with deltas and weekly summaries

### AI Scoring Pipeline
**Input Data Sources:**
- Last 10 journal entries (filtered by lookbackDays cutoff date)
- Last 20 conversation messages from 3 most recent conversations (user messages only, not assistant responses)
- All data filtered by cutoff date BEFORE slicing to ensure accuracy

**Data Gating (Prevents Junk Scores):**
- Requires minimum 5 user messages OR 2 journal entries within lookback window
- Throws 400 error if insufficient data (prevents zero-score pollution)
- Rejects low-confidence zero-scores before database persistence
- lookbackDays parameter bounded to 1-30 days (default 7)

**Structured Output:**
- Uses JSON schema with response_format for reliability and consistency
- Required fields: score (0-100), reasoning, confidenceLevel (low/medium/high)
- Array fields: keyPatterns[], progressIndicators[], areasForGrowth[], evidenceSnippets[]
- All outputs validated against schema before persistence

**Duplicate Prevention:**
- Normalizes periodStart to start of day (daily) or start of week (weekly)
- Unique database constraint on (userId, categoryId, periodType, periodStart)
- Pre-insert existence check queries for exact periodStart match
- Returns existing score data instead of attempting duplicate insert
- Returns 409 status with existing score on conflict

**Contributor Tracking:**
- Metadata shows exact count of journals and user messages analyzed
- Filtered by lookbackDays window to match score generation logic
- Enables debugging, transparency, and confidence assessment

### Security & Validation
- All endpoints require authentication via isAuthenticated middleware
- Tier enforcement prevents selecting more categories than plan allows
- Zod validation on all request bodies (categoryId, periodType, lookbackDays)
- Bounded parameters: lookbackDays (1-30), periodType (enum: daily/weekly)
- Per-user data isolation enforced at database query level (filter by userId)
- Ownership verification before score generation (category must be selected)

### API Response Codes
- **200**: Score generated successfully, existing score returned
- **400**: Insufficient data, invalid parameters, or validation error
- **403**: Category not selected or tier limit exceeded
- **409**: Duplicate score attempt (returns existing score data)
- **500**: Server error (AI API failure, database error)

## Development
- Start server: Use "Start application" workflow button
- Database migrations: Use `npm run db:push` to sync schema changes
- Force migrations (data loss warning): `npm run db:push --force`
- Authentication: Navigate to /api/login (supports Google, GitHub, X, Apple, email/password)
- Data persists in PostgreSQL across restarts
- Workflow auto-restarts on code changes

## Security Architecture
- **Authentication**: Replit Auth with OpenID Connect (passport.js)
- **Session Storage**: PostgreSQL sessions table with secure httpOnly cookies, 7-day TTL
- **Authorization**: isAuthenticated middleware on all protected routes
- **Data Scoping**: All queries filter by req.user.claims.sub (authenticated user ID)
- **Ownership Checks**: Category selection verified before score generation, conversation ownership verified before message access
- **Input Validation**: Zod schemas prevent parameter injection and validate bounds
- **Error Handling**: 401 errors redirect to login, 403 errors block unauthorized access, 409 handles conflicts gracefully
