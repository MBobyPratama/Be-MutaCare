# AGENTS.md - Backend Coding Agent Guidelines

## 1. Project Identity & Domain Understanding
- **Project Name**: MutaCare Backend API
- **Domain**: AI Therapy Companion & Graded Exposure System for Selective Mutism (PKM-KC 2026).
- **Core Concept**: MutaCare is NOT a public speaking course platform. It is a personalized psychological therapy companion applying Cognitive Behavioral Therapy (CBT) and Graded Exposure principles.
- **Tone & Domain Empathy**: Empathetic, supportive, safe, non-judgmental, and structured.

---

## 2. Tech Stack & Tools
- **Runtime & Language**: Node.js, TypeScript (strict mode enabled).
- **Web Framework**: Express.js (`express`).
- **Database & Storage**: Supabase (PostgreSQL + Supabase Storage for audio recordings).
- **AI & Speech Services**:
  - LLM: Anthropic Claude 3.5 Sonnet API (for CBT conversation, scenario roleplay, and therapeutic analysis).
  - ASR / Speech-to-Text: Google Cloud Speech-to-Text API.
- **Validation**: Zod for request payloads, query parameters, and environment variables.
- **File Handling**: Multer (memory storage for processing audio streams to STT and Supabase Storage).
- **Security & Utilities**: `cors`, `helmet`, `dotenv`, `jsonwebtoken` / `@supabase/supabase-js`.

---

## 3. Project Structure Convention
Maintain a clean, modular 3-tier architecture:
```text
src/
├── config/             # Supabase client, LLM client, Google Cloud credentials, env configs
├── constants/          # App constants, HTTP status codes, error messages
├── controllers/        # Express route handlers (parsing request, delegating to service, sending response)
├── middlewares/        # Auth verification (Supabase JWT), validation middleware, multer upload, error handler
├── routes/             # Express routers mapped to /api/v1/...
├── schemas/            # Zod validation schemas
├── services/           # Pure business logic, AI prompts, STT orchestration, metrics computation
├── types/              # TypeScript interfaces, DTOs, and custom Express request augmentations
├── utils/              # Helper functions (response formatters, logger, mathematical metrics)
├── app.ts              # Express app setup and global middlewares
└── server.ts           # HTTP server listener and graceful shutdown
```

---

## 4. Coding & Architecture Rules

### TypeScript Standards
- Never use `any`. Use `unknown` with type narrowing or define explicit interfaces / types.
- Ensure strict null checks.
- Keep domain types and DTOs synchronized with the Supabase schema and Zod validation.

### Request-Response Envelope
All API responses must follow a consistent JSON envelope format:

**Success Response:**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [ ... ]
  }
}
```

### Controller & Service Pattern
- **Controllers** should be lightweight: extract inputs, run validation middleware, call the appropriate Service, and return using the standard response helper.
- **Services** contain all business logic, database queries (via Supabase client), external API calls (Claude, Google STT), and throw structured ApplicationErrors when business logic fails.
- Never place SQL/Supabase queries directly inside controller files.

### Error Handling
- Use a central `AppError` class inheriting from `Error` with `statusCode`, `errorCode`, and optional `details`.
- Always forward unhandled exceptions to the central error handling middleware (`errorHandler`).
- Do not leak internal stack traces or database errors in production responses.

### Audio & AI Pipeline Flow
1. Audio input (`multipart/form-data`) is buffered in memory.
2. Sent concurrently/sequentially to Google Cloud Speech-to-Text for transcription and to Supabase Storage bucket (`audio-sessions/`) for audit/therapy history.
3. Transcribed text + scenario metadata is passed to the Claude 3.5 Sonnet prompt generator.
4. Response contains roleplay reply text, CBT empathy cues, confidence metric estimation, and speech duration tracking.

---

## 5. Security & Best Practices
- **Environment Variables**: Load and validate all env variables on startup using Zod in `src/config/env.ts`. Fail fast if required keys (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, etc.) are missing.
- **Authentication**: Protect all private endpoints with a Supabase JWT verification middleware (`verifyAuth`). Extract `user.id` into `req.user`.
- **Database Safety**: Enforce Row Level Security (RLS) policies on Supabase tables where applicable. Use parameterized queries/Supabase client methods.
