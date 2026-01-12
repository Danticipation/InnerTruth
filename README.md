# InnerTruth - AI Personality Analyzer

## Overview
InnerTruth is an enterprise-grade, AI-powered personality analysis application designed to provide in-depth insights into user personality through conversational interactions, mood tracking, and journal entries. Its primary goal is to enhance self-awareness and personal growth by identifying personality traits, behavioral patterns, blind spots, and opportunities for development through comprehensive, multi-layered AI analysis.

## 🚨 Production & Security Standards
This application is built to production healthcare standards, prioritizing security and data integrity.
- **Security First**: Implements robust authentication and per-user data isolation.
- **HIPAA Compliance Ready**: Designed with PHI safeguard principles, encryption in transit, and least-privilege access.
- **Zero Hardcoded Secrets**: All credentials and API keys are managed via environment variables.
- **Data Integrity**: Strict schema validation using Zod and Drizzle ORM.

## System Architecture
InnerTruth utilizes a modern, full-stack TypeScript architecture designed for scalability, resilience, and sophisticated AI integration.

### UI/UX Decisions
- **Framework**: React with TypeScript and Vite for a high-performance frontend.
- **Styling**: Tailwind CSS (v4) and Shadcn UI for a professional, responsive, and accessible design.
- **Animations**: Framer Motion for smooth, meaningful transitions.
- **Data Visualization**: Recharts for insightful personality and category trend tracking.
- **Design Philosophy**: Optimized for all devices, aiming to build trust and encourage self-reflection with a balance of empathy and directness.

### Technical Implementations
- **Frontend**: React, TypeScript, TanStack Query (State Management & Caching), Wouter (Routing).
- **Backend**: Express.js with TypeScript for robust API handling.
- **Database**: PostgreSQL via Neon Serverless, managed with Drizzle ORM for type-safe migrations and queries.
- **Authentication**: Supabase Auth with JWT verification, providing secure multi-user isolation and session management.
- **AI Memory System**: GPT-4o asynchronously extracts, stores, and deduplicates facts from user interactions into a multi-level memory system (raw facts, inferred beliefs, defense mechanisms, IFS parts).
- **Speech Integration**: Web Speech API for Speech-to-Text (STT) and Eleven Labs for high-quality Text-to-Speech (TTS).
- **Personality Reflection Engine**: A tiered (Free, Standard, Premium) background processing system that generates comprehensive psychological profiles using multi-pass sequential generation.
- **Category Tracking (MVP)**: Allows users to select specific improvement categories with AI-powered scoring, trend visualization, and actionable insights.
- **Senior AI Quality Controls**: Employs strict persona enforcement, mandatory triangulation (2+ data sources), contradiction detection, and supervisor-critique loops to ensure world-class analytical quality.

### Feature Specifications
- **AI Chat Interface**: Direct AI personality analyst with persistent conversation history, memory context, STT, and TTS.
- **Digital Journal**: Private journaling with AI-triggered insights and ownership verification.
- **Mood Tracking**: Daily mood and activity logging to correlate emotional states with behavioral patterns.
- **Personality Dashboard**: Live stats, streaks, analyzed traits, and growth opportunities.
- **Intake Assessment**: A 5-step guided questionnaire to personalize the initial AI experience.

## External Dependencies
- **AI Service**: OpenAI GPT-4o
- **Database**: PostgreSQL (via Neon Serverless)
- **Authentication**: Supabase Auth
- **Text-to-Speech**: Eleven Labs
- **Frontend Framework**: React
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend Framework**: Express.js
- **ORM**: Drizzle ORM
- **State Management**: TanStack Query

## Development
### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- OpenAI API Key
- Supabase Project (for Auth)
- Eleven Labs API Key (optional, for TTS)

### Setup
1. Clone the repository.
2. Install dependencies: `npm install`
3. Configure environment variables in `.env` (see `.env.example`).
4. Push database schema: `npm run db:push`
5. Start development server: `npm run dev`
