# VoiceHub - AI Voice Agent Management Platform

## Overview
VoiceHub is an AI-powered business communication platform that integrates with Retell.ai for voice agents and manages Google Reviews. The platform allows businesses to create and manage AI voice agents for after-hours call handling, lead intake, and automated customer service.

## Recent Changes (February 2026)
- **Webhook Integration for Lead Sources (Angi, Google LSA, Thumbtack)**:
  - Added `webhook_logs` and `webhook_secrets` tables for tracking and securing webhooks
  - Webhook endpoints: `/api/webhooks/angi`, `/api/webhooks/google-lsa`, `/api/webhooks/:source`
  - Per-tenant authentication via secret key in query param (?key=) or X-API-KEY header
  - Each webhook auto-creates a Contact with proper tenant attribution
  - Webhook management API: generate/revoke keys, send test webhooks, view logs
  - Webhooks page in dashboard (Deploy section) with Endpoints, Test, and Activity Log tabs
  - Payload parsing matches real Angi JSON feed and Google LSA Lead Form formats
- **Agent Creation Fix (snake_case/camelCase)**: Fixed critical naming convention mismatch:
  - Standardized frontend Agent interface to use snake_case (matching form components)
  - Added `mapAgentFromApi()` helper in useAgents.ts to convert Drizzle's camelCase API responses to snake_case
  - Added `normalizeAgentConfig()` in backend to accept both naming conventions
  - Updated all agent pages (Dashboard, Playground, AgentsList, AgentEdit) to use snake_case
  - Fixed `updateRetellAgent` to use normalized values with proper numeric type conversions for DB
  - Cleaned up `createRetellAgent` to use normalized config consistently
  - Data flow: Form (snake_case) → useAgents hook (snake_case) → API → backend normalizes → Drizzle DB (camelCase columns)
- **Lead Analytics Dashboard**: Synced from GitHub/Lovable commit (abaa9da):
  - Added LeadAnalytics component with recharts (area chart, pie chart, bar chart, sentiment)
  - Created useLeadAnalytics hook using Express API endpoint
  - Added `/api/lead-analytics` backend endpoint aggregating contacts + call_logs
  - Updated Dashboard with Overview/Lead Analytics tabs
- **GitHub Sync - SMS & Campaign Features**: Synced 20+ Lovable commits including:
  - SMS agent editing with full CRUD (Prompt, Settings, Campaigns, Test tabs)
  - Campaigns page with campaign management placeholder
  - Contacts page with stats cards and contact table
  - SMS Analytics page placeholder
  - SMS Simulator page placeholder
  - VariableInserter component for campaign template variables
  - SmsCampaigns component for agent-level campaign management
  - Updated AgentSidebar with grouped navigation (Build/Deploy/Monitor/System)
  - Renamed Knowledge Base to Business Profile
  - Created useSmsAgents and useSmsCampaigns hooks using Express API
- **Hybrid Authentication System**: Implemented dual authentication supporting:
  - **Google OAuth** via Replit Auth (OIDC) - redirects to `/api/login`
  - **Email/Password** login with bcrypt password hashing - uses `/api/auth/login` and `/api/auth/register`
  - Both methods use PostgreSQL session storage (`sessions` table)
  - User data stored in `auth_users` table with optional `password_hash` column
- **Migration from Lovable/Supabase to Replit**: Complete migration of the project infrastructure
  - Replaced Supabase with Replit PostgreSQL database using Drizzle ORM
  - Converted Supabase Edge Functions to Express server routes
  - Implemented session-based authentication with Passport.js
  - Updated all frontend hooks to use React Query with new API endpoints

## Project Architecture

### Backend (Node.js/Express)
- `server/index.ts` - Main Express server with Vite middleware integration
- `server/routes.ts` - All API routes including migrated Edge Functions
- `server/auth.ts` - Passport.js authentication with local strategy
- `server/storage.ts` - Database storage layer using Drizzle ORM
- `server/db.ts` - PostgreSQL connection using node-postgres

### Database Schema (Drizzle ORM)
- `shared/schema.ts` - Contains all table definitions and Zod validation schemas
  - users, profiles, ai_agents, reviews, call_logs, user_settings
  - knowledge_base_entries, phone_numbers, google_integrations

### Frontend (React + Vite)
- `src/App.tsx` - Main application with routing (react-router-dom)
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/hooks/` - React Query hooks for all data fetching
  - useAgents, useCallLogs, useKnowledgeBase, usePhoneNumbers
  - useReviews, useSettings, useRetell, useLeadAnalytics
  - useSmsAgents, useSmsCampaigns (Express API integration)
- `src/lib/api.ts` - API client for server communication

### Key API Endpoints
- `/api/login` - Google OAuth initiation (Replit Auth)
- `/api/callback` - OAuth callback handler
- `/api/logout` - OAuth logout
- `/api/auth/user` - Get current authenticated user
- `/api/auth/login` - Email/password login (POST)
- `/api/auth/register` - Email/password registration (POST)
- `/api/auth/logout` - Local auth logout (POST)
- `/api/agents` - AI agent management
- `/api/retell-sync` - Retell.ai integration (agents, calls, phone numbers)
- `/api/scrape-business` - Business data extraction
- `/api/scrape-knowledge-base` - URL content scraping for knowledge base
- `/api/lead-analytics` - Lead analytics aggregation (contacts + call_logs)
- `/api/call-logs`, `/api/reviews`, `/api/settings`, `/api/profile`

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `RETELL_API_KEY` - Retell.ai API key for voice agent integration
- `FIRECRAWL_API_KEY` - Firecrawl API key for web scraping
- `SESSION_SECRET` - Session encryption secret (optional, has default)
- `NODE_ENV` - Set to "development" for dev server

## Running the Project
```bash
npm run dev        # Start development server (Express + Vite)
npm run db:push    # Push database schema changes
npm run build      # Build for production
```

## User Preferences
- Using Tailwind CSS with custom design system for styling
- React Query for data fetching and caching
- Passport.js with local strategy for authentication
- Drizzle ORM for type-safe database access
