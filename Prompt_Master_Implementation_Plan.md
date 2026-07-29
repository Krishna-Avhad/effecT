# Prompt Master -- Implementation Plan

## Goal

Build an AI platform that transforms a raw software idea into
architecture, implementation plans, and optimized multi-stage prompts
for AI coding agents.

## MVP (Weeks 1--6)

### Sprint 1

-   Authentication (Google, GitHub, Email)
-   Dashboard
-   Project CRUD

### Sprint 2

-   Idea Parser
-   Intent Detection
-   Domain Detection

### Sprint 3

-   Architecture Generator
-   Folder Structure
-   Database Design
-   API Design

### Sprint 4

-   Prompt Generator
-   Prompt Optimizer
-   Prompt Splitter

### Sprint 5

-   Agent Adapters (Claude Code, Codex, Cursor, Gemini CLI)
-   Export (Markdown, JSON, PDF)

### Sprint 6

-   Testing
-   Deployment
-   Landing Page
-   Performance Optimization

## AI Pipeline

``` text
Raw Idea
   ↓
Idea Parser
   ↓
Intent Detection
   ↓
Domain Detection
   ↓
Architecture Generator
   ↓
Task Planner
   ↓
Prompt Generator
   ↓
Prompt Optimizer
   ↓
Prompt Splitter
   ↓
Export
```

## Core Modules

-   Authentication
-   Dashboard
-   Project Management
-   AI Analysis
-   Architecture Generator
-   Prompt Generator
-   Prompt History
-   Export Service

## Database Tables

-   Users
-   Projects
-   AIAnalysis
-   PromptHistory
-   Exports

## Recommended Tech Stack

### Frontend

-   Next.js
-   TypeScript
-   Tailwind CSS
-   shadcn/ui

### Backend

-   FastAPI
-   Redis
-   Celery

### Database

-   PostgreSQL
-   Prisma

### AI

-   GPT-5.5
-   Claude
-   Gemini

### Deployment

-   Vercel
-   Railway
-   Supabase

## Folder Structure

``` text
apps/
  web/

packages/
  ai/
  prompts/
  parser/
  adapters/
  ui/

services/
  api/
  workers/

tests/
docs/
```

## Future Features

-   Team collaboration
-   Architecture diagrams
-   GitHub integration
-   Cost estimation
-   Sprint planning
-   One-click deployment

-   hehe
