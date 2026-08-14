# 🌿 MutaCare Backend API

> **AI Therapy Companion & Graded Exposure System for Selective Mutism**  
> Developed for **PKM-KC 2026**

---

## 📌 About MutaCare

**MutaCare** is a personalized psychological therapy companion platform applying Cognitive Behavioral Therapy (CBT) and Graded Exposure principles specifically designed for individuals experiencing **Selective Mutism**. 

Unlike general public speaking platforms, MutaCare focuses on psychological progress, providing a safe, non-judgmental, virtual environment where users can gradually desensitize social anxiety, practice voice interactions through AI-driven roleplays, and track confidence milestones over time.

---

## 🚀 Tech Stack & Infrastructure

- **Runtime & Language**: Node.js, TypeScript (Strict Mode enabled)
- **Web Framework**: Express.js
- **Database & Storage**: Supabase (PostgreSQL + Supabase Storage for session audio archives)
- **AI & Speech Processing Engine**:
  - **LLM Engine**: Anthropic Claude 3.5 Sonnet API (Empathic CBT companion, dynamic roleplay persona, performance analysis)
  - **ASR (Speech-to-Text)**: Google Cloud Speech-to-Text API (Indonesian voice recognition)
- **Validation**: Zod (Payloads, Query Params, and Environment Variables)
- **File Handling**: Multer (Memory Storage buffer processing for STT and Supabase Storage)
- **Security & Utilities**: Cors, Helmet, Dotenv, Supabase JWT Auth Verification

---

## 📁 Project Architecture & Structure

The codebase strictly adheres to a clean, 3-tier modular architecture:

```text
Be-MutaCare/
├── src/
│   ├── config/             # Environment configs (Zod validator), Supabase client, Anthropic SDK
│   ├── constants/          # Application constants, HTTP status codes, error code enums
│   ├── controllers/        # Lightweight Express route handlers (Request extraction & response helpers)
│   ├── middlewares/        # Supabase JWT authentication, Zod request validator, global error handler
│   ├── routes/             # Express API router definitions mapped under /api/v1
│   ├── schemas/            # Zod validation schemas
│   ├── services/           # Core business logic, Claude LLM prompt orchestration, STT & DB queries
│   ├── types/              # TypeScript interfaces, DTOs, and Express request extensions
│   ├── utils/              # Helper utilities (AppError class, standardized JSON response envelope, logger)
│   ├── app.ts              # Express application setup and global middleware registration
│   └── server.ts           # HTTP server listener, port binding, and graceful shutdown handlers
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore configuration
├── AGENTS.md               # Backend coding agent guidelines
├── AI_PROMPTS.md           # System prompts & LLM engineering specifications
├── API_CONTRACT.md         # Full REST API specifications
├── DB_SCHEMA.md            # Supabase PostgreSQL DDL & RLS policies
├── PRODUCT_SPEC.md         # Comprehensive product specification
├── package.json            # Dependencies and npm scripts
└── tsconfig.json           # TypeScript configuration (ES2022, NodeNext)
```

---

## 🛠️ Getting Started & Local Setup

### Prerequisites

- Node.js (v18.x or higher recommended)
- npm or yarn
- Supabase Project (URL, Anon Key, Service Role Key)
- Anthropic API Key (Claude 3.5 Sonnet)
- Google Cloud Service Account (Speech-to-Text API)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/MBobyPratama/Be-MutaCare.git
cd Be-MutaCare
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
PORT=5000
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI & Speech Services
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_APPLICATION_CREDENTIALS=./path-to-gcp-key.json
```

### 3. Run Development Server

```bash
npm run dev
```

The API will start running at `http://localhost:5000/api/v1`.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 🌐 API Contract Overview

All API endpoints are prefixed with `/api/v1`.

### Core API Route Groups

| Module | Base Path | Description |
| :--- | :--- | :--- |
| **Health** | `GET /api/v1/health` | System health check and uptime status |
| **Users** | `/api/v1/users` | Get and update user profile data |
| **Assessments** | `/api/v1/assessments` | Submit initial assessment & generate therapy plan |
| **Moods** | `/api/v1/moods` | Daily mood check-in & adaptive recommendations |
| **Dashboard** | `/api/v1/dashboard` | Fetch daily therapy dashboard summary |
| **Journey** | `/api/v1/journey` | Graded exposure pathway hierarchy and progress |
| **Simulations** | `/api/v1/simulations` | Virtual roleplay sessions, STT turn processing & feedback |
| **Reflections** | `/api/v1/reflections` | Post-session CBT journaling entries |
| **Progress** | `/api/v1/progress` | Confidence timeline, anxiety trends, and badges |

For complete payload details, refer to [`API_CONTRACT.md`](./API_CONTRACT.md).

---

## 📐 Standardized Response Envelope Format

All responses from the API follow a uniform JSON structure.

### Success Response (`2xx`)

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response (`4xx` / `5xx`)

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

---

## 🛡️ Security & Best Practices

- **Strict Fail-Fast Startup**: Validates all environment variables using Zod before launching the server.
- **JWT Verification**: Endpoints require Supabase Authentication Bearer tokens.
- **Row Level Security (RLS)**: Enforced across PostgreSQL tables in Supabase.
- **Centralized Error Handling**: Custom `AppError` class ensures internal stack traces and database details are never leaked in production responses.

---

## 📄 License

This project is developed as part of **PKM-KC 2026**. All rights reserved.
