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

2. **Digital Journal** (`/journal`)
   - Private journaling with writing prompts
   - Automatic word count and date tracking
   - Previous entries browsing
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
- **Storage**: In-memory storage (MemStorage)
- **State Management**: TanStack Query (React Query)

### API Endpoints
- `POST /api/conversations` - Create new conversation
- `POST /api/messages` - Send message, get AI response
- `POST /api/journal-entries` - Save journal entry
- `GET /api/journal-entries` - Get all journal entries
- `POST /api/analyze-personality` - Run comprehensive analysis
- `GET /api/insights` - Get AI-generated insights
- `GET /api/stats` - Get user statistics

### Data Model
```typescript
- Conversations: User chat sessions
- Messages: Individual chat messages (user/assistant)
- Journal Entries: Daily reflections with word count
- Personality Insights: AI-generated observations
- Users: Basic user data (currently using default user)
```

## Recent Changes
- Upgraded chat AI from gpt-4o-mini to gpt-4o for deeper conversations
- Enhanced chat prompt to be more direct and confrontational
- Improved journal analysis to cross-reference conversations
- Added comprehensive personality analysis endpoint
- Dashboard now shows real AI-analyzed traits (not static values)
- Reduced insight generation threshold to 2 journal entries
- Fixed pluralization bug in streak display

## Future Enhancements (Not Yet Implemented)
- Personality questionnaires
- User authentication system
- Persistent database (PostgreSQL)
- Trend tracking over time
- Export personality reports
- Multiple insight surfacing
- Contradiction tracking across time
- Sentiment analysis trends
- Privacy controls and data export

## Development
- Run: `npm run dev`
- Default user ID: `default-user-id`
- Data persists during server runtime only
- Workflow auto-restarts on code changes

## User Experience
The app is designed to:
1. Feel trustworthy and professional
2. Encourage honest self-reflection
3. Provide actionable insights
4. Balance empathy with direct truth-telling
5. Help users discover blind spots they genuinely didn't know about

## Architecture Notes
- In-memory storage means data resets on server restart
- OpenAI integration uses Replit AI Integrations (charges billed to Replit credits)
- All personality analysis is client-triggered (no automatic background analysis)
- Insights are generated one at a time per journal save
- Dashboard personality analysis is cached until manually refreshed
