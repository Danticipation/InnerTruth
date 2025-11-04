# Mirror - AI Personality Analyzer

## Overview
Mirror is an AI-powered personality analysis application that helps users discover deep insights about themselves through conversations, journal entries, and comprehensive AI analysis. The app provides "the hard truth" about personality traits, blind spots, and growth opportunities.

## Current Implementation

### Core Features
1. **AI Chat Interface** (`/chat`)
   - Direct, insightful AI personality analyst using GPT-4o
   - Confronts patterns and contradictions compassionately
   - Asks probing questions that challenge assumptions
   - Stores full conversation history for analysis
   - **Speech-to-Text**: Voice input using Web Speech API (Chrome/Edge)
   - **Text-to-Speech**: Natural AI voice responses via Eleven Labs
   - Visual feedback for recording and speaking states

2. **Digital Journal** (`/journal`)
   - Private journaling with writing prompts
   - Automatic word count and date tracking
   - Previous entries browsing with edit and delete capabilities
   - Edit dialog with full content modification
   - Delete confirmation with undo protection
   - AI analysis triggered after entries are saved

3. **Personality Dashboard** (`/dashboard`)
   - Live stats: profile completion, streak tracking, insight count
   - Big 5 personality traits (AI-analyzed from user data)
   - Core behavioral patterns detection
   - Blind spots and growth opportunities
   - Manual refresh for updated analysis

### AI Analysis System

#### Level 1: Continuous Insight Generation
- Automatically triggered when saving journal entries
- Requires minimum 2 journal entries
- Analyzes up to 10 journal entries + recent conversations
- Uses GPT-4o for deep pattern recognition
- Generates insights categorized as:
  - **Blind Spots**: Things user can't see about themselves
  - **Growth Opportunities**: Actionable improvements

#### Level 2: Comprehensive Personality Analysis
- Triggered on dashboard load or manual refresh
- Analyzes last 20 conversation messages + 10 journal entries
- Uses GPT-4o for synthesis across all data sources
- Returns:
  - **Big 5 Traits**: Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Stability (0-100 scores)
  - **Core Patterns**: Recurring behavioral/emotional themes
  - **Blind Spots**: Hidden aspects of personality
  - **Strengths**: Underutilized capabilities

### Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript
- **AI**: OpenAI GPT-4o via Replit AI Integrations (no API key required)
- **Database**: PostgreSQL via Neon Serverless (persistent storage)
- **ORM**: Drizzle ORM with migrations
- **State Management**: TanStack Query (React Query)

### API Endpoints
- `POST /api/conversations` - Create new conversation
- `POST /api/messages` - Send message, get AI response
- `POST /api/journal-entries` - Save journal entry
- `GET /api/journal-entries` - Get all journal entries
- `PUT /api/journal-entries/:id` - Update journal entry (with ownership verification)
- `DELETE /api/journal-entries/:id` - Delete journal entry (with ownership verification)
- `POST /api/analyze-personality` - Run comprehensive analysis
- `GET /api/insights` - Get AI-generated insights
- `GET /api/stats` - Get user statistics

### Data Model
```typescript
- Users: User accounts with authentication via Replit Auth (OIDC)
- Sessions: PostgreSQL-backed session storage with 7-day TTL
- Conversations: User chat sessions (per-user isolation)
- Messages: Individual chat messages (user/assistant)
- Journal Entries: Daily reflections with word count (per-user isolation)
- Personality Insights: AI-generated observations (per-user isolation)
- Memory Facts: Extracted factual knowledge about the user (per-user isolation)
- Memory Fact Mentions: Evidence linking facts to specific messages/journals
- Memory Snapshots: Periodic summaries of memory state (schema ready, not yet used)
```

## Recent Changes (November 2025)

### Speech Integration (November 2025)
- **Speech-to-Text (STT)**: Browser-based voice input using Web Speech API
  - Real-time transcription as you speak
  - Visual "Recording" badge indicator
  - Works in Chrome, Edge, and other Chromium-based browsers
  - Seamlessly integrates with text input (can type or speak)
- **Text-to-Speech (TTS)**: High-quality AI voice using Eleven Labs
  - Click speaker button on any AI message to hear it aloud
  - Natural, human-like voice synthesis (Rachel voice by default)
  - Visual indicator shows which message is currently playing
  - Server-side API integration for security
  - Requires Eleven Labs API key (configured in secrets)
- **Visual Feedback**:
  - Microphone button turns red when recording
  - "Recording" badge pulses while listening
  - Volume icons toggle between play/stop states
  - Seamless UX with loading states

## Recent Changes (November 2025)

### Conversation Persistence (November 2025)
- **SessionStorage Implementation**: Current conversation ID persists across page navigation
- **Three-Tier Loading Priority**: (1) Load stored conversation ID, (2) Load most recent, (3) Create new only if none exist
- **Seamless Navigation**: Chat conversations persist when switching between Dashboard, Journal, and Insights pages
- **New Chat Button**: Users can start fresh conversations while preserving conversation history
- **Auto-Scroll**: Messages automatically scroll into view for seamless conversation flow
- **Zero Data Loss**: All messages stored in PostgreSQL and retrieved on page reload

### Branding & Logo (November 2025)
- **Custom Logo Integration**: Chakrai logo (two-face mirror design) now appears throughout the app
- **Reusable Logo Component**: Flexible sizes (sm/md/lg) and optional text display
- **Consistent Branding**: Logo appears on landing page, home page, and all authenticated pages

### Multi-User Authentication & Data Isolation (CRITICAL SECURITY)
- **Replit Auth Integration**: OpenID Connect with Google, GitHub, X, Apple, email/password login
- **Session Management**: PostgreSQL-backed sessions with 7-day TTL and secure httpOnly cookies
- **Complete Data Isolation**: All queries scoped to authenticated user ID (req.user.claims.sub)
- **Landing Page**: Unauthenticated users see landing page with login options
- **Protected Routes**: All API endpoints require authentication via isAuthenticated middleware
- **Ownership Verification**: Conversation/message access verified before allowing read/write
- **Server-Side Security**: userId injected server-side for journals/insights (cannot be forged by client)
- **Type Safety**: Separate schemas for client validation vs server operations ensure security

### Mobile Optimization (November 2025)
- **Mobile Navigation**: Hamburger menu with Sheet drawer for easy navigation on mobile devices
- **Responsive Design**: All pages optimized for screens from 320px to desktop widths
- **Touch-Friendly UI**: Appropriately sized buttons and touch targets throughout
- **Adaptive Layouts**: Grids stack vertically on mobile, expand on desktop
- **Responsive Typography**: Text sizes adjust for readability across all screen sizes
- **Mobile Cards**: Compact padding and spacing optimized for small screens
- **No Horizontal Scroll**: All content fits within viewport width on mobile
- **Tested Pages**: Home, Chat, Journal, PersonalityReflection, Dashboard, Insights, Profile

### Journal Entry Management (November 2025)
- **Edit Functionality**: Full journal entry editing with dialog interface
- **Delete Functionality**: Entry deletion with confirmation dialog to prevent accidents
- **Ownership Verification**: PUT/DELETE endpoints verify user owns entry before allowing modification
- **Seamless UX**: Edit and delete buttons on each previous entry card
- **Word Count Tracking**: Automatically updates word count when editing entries
- **Cache Invalidation**: Mutations properly invalidate TanStack Query cache for instant UI updates
- **Security**: Server-side ownership checks prevent cross-user data manipulation

### Persistent Memory System (MAJOR)
- **Migrated to PostgreSQL**: All data now persists permanently (no more data loss on restart)
- **AI Memory Extraction**: GPT-4o automatically extracts facts from every conversation and journal entry
- **Intelligent Deduplication**: Similar facts increase confidence scores rather than creating duplicates
- **Memory Context Injection**: AI receives up to 20 categorized facts in every prompt for personalized responses
- **Evidence Tracking**: Each fact links to source messages/journals with excerpts for traceability
- **Progressive Learning**: Memory builds cumulatively day-by-day across sessions
- **Per-User Memory**: Memory facts completely isolated per authenticated user

### Earlier Changes
- Upgraded chat AI from gpt-4o-mini to gpt-4o for deeper conversations
- Enhanced chat prompt to be more direct and confrontational
- Improved journal analysis to cross-reference conversations
- Added comprehensive personality analysis endpoint
- Dashboard now shows real AI-analyzed traits (not static values)
- Reduced insight generation threshold to 2 journal entries
- Fixed pluralization bug in streak display

## Future Enhancements (Not Yet Implemented)
- Semantic embeddings for better memory deduplication
- Memory snapshot generation to prevent prompt bloat at scale
- Personality questionnaires
- Trend tracking over time (visualizations of personality changes)
- Export personality reports (PDF/JSON download)
- Multiple insight surfacing (display multiple insights per category)
- Contradiction tracking across time (flag inconsistencies)
- Sentiment analysis trends (mood tracking over journal entries)
- Privacy controls and data export (GDPR compliance)
- Error handling and retry logic for AI API failures
- Email notifications for insights/reminders
- Social sharing of anonymous personality summaries

## Development
- Run: `npm run dev`
- Database: `npm run db:push` (push schema changes)
- Authentication: Use /api/login to authenticate (supports Google, GitHub, X, Apple, email/password)
- Data persists in PostgreSQL across restarts
- Workflow auto-restarts on code changes
- Sessions stored in PostgreSQL with 7-day TTL

## Security Architecture
- **Authentication**: Replit Auth with OpenID Connect (passport.js)
- **Session Storage**: PostgreSQL sessions table with secure cookies
- **Authorization**: isAuthenticated middleware on all protected routes
- **Data Scoping**: All queries filter by req.user.claims.sub (authenticated user ID)
- **Ownership Checks**: Conversations verified before message access
- **Input Validation**: Zod schemas prevent userId forgery (omitted from client schemas, injected server-side)
- **Error Handling**: 401 errors redirect to login, 403 errors block unauthorized access

## User Experience
The app is designed to:
1. Feel trustworthy and professional
2. Encourage honest self-reflection
3. Provide actionable insights
4. Balance empathy with direct truth-telling
5. Help users discover blind spots they genuinely didn't know about

## Architecture Notes

### Memory System Architecture
- **Fact Extraction**: Fire-and-forget async GPT-4o calls after each message/journal
- **Storage**: PostgreSQL with Drizzle ORM, facts categorized by type (personal_info, work_career, relationships, etc.)
- **Retrieval**: Top 20 facts by confidence, grouped by category, injected into AI system prompts
- **Deduplication**: Similarity threshold (0.8) detects similar facts, boosts confidence instead of duplicating
- **Evidence**: Each fact stores source IDs and text excerpts for traceability

### General Architecture
- PostgreSQL database with WebSocket support (Neon Serverless)
- OpenAI integration uses Replit AI Integrations (charges billed to Replit credits)
- Multi-user authentication via Replit Auth (OpenID Connect)
- Complete data isolation per user across all tables
- All personality analysis is client-triggered (no automatic background analysis)
- Insights are generated one at a time per journal save
- Dashboard personality analysis is cached until manually refreshed
- Session-based authentication with PostgreSQL session storage
