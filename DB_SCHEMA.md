# DB_SCHEMA.md - Supabase PostgreSQL Database Schema

## 1. Overview & Architecture
This document details the PostgreSQL database schema for **MutaCare**, hosted on Supabase.
The schema is designed to support:
- User profiling & baseline psychological assessments
- Daily mood tracking & dynamic therapy mission assignment
- Graded exposure pathway (Weeks, Modules, Lessons)
- Audio simulation sessions, voice recording references (Supabase Storage), and transcript turn histories
- Post-session CBT reflections & longitudinal progress metrics (Confidence, Anxiety trends, speaking duration)
- Gamification (Streak & Milestone badges)

---

## 2. Entity Relationship Diagram (Textual Representation)

```text
auth.users (Supabase Auth)
    │ 1:1
    ▼
profiles ──────────────┬───────────────┬────────────────┬──────────────┐
    │ 1:N              │ 1:N           │ 1:N            │ 1:N          │ 1:N
    ▼                  ▼               ▼                ▼              ▼
assessments       daily_moods    therapy_plans    simulations    user_badges
                                       │ 1:N            │ 1:N
                                       ▼                ▼
                                 daily_missions   simulation_messages
                                       │ 1:1
                                       ▼
                                  reflections
```

---

## 3. Detailed Table Definitions & DDL (SQL)

### Enable UUID Extension
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

### 3.1. `profiles`
Extends `auth.users` with personal profile and aggregated gamification stats.

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    nickname VARCHAR(50),
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);
```

---

### 3.2. `assessments`
Stores baseline and periodic psychological evaluations (Selective Mutism severity, trigger environments, baseline anxiety).

```sql
CREATE TYPE assessment_type_enum AS ENUM ('initial', 'periodic', 'post_treatment');

CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type assessment_type_enum DEFAULT 'initial',
    anxiety_score INT NOT NULL, -- e.g., 0 - 100
    mutism_severity VARCHAR(50) NOT NULL, -- 'mild', 'moderate', 'severe'
    primary_triggers TEXT[], -- ['school', 'store', 'strangers', 'presentation']
    answers_payload JSONB NOT NULL, -- Full questionnaire responses
    ai_analysis_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessments_user_id ON public.assessments(user_id);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own assessments"
    ON public.assessments FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.3. `daily_moods`
Logs daily mood and anxiety check-ins used to dynamically adjust daily recommendations.

```sql
CREATE TYPE mood_status_enum AS ENUM ('happy', 'neutral', 'anxious', 'scared', 'sad');

CREATE TABLE public.daily_moods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood mood_status_enum NOT NULL,
    anxiety_level INT NOT NULL CHECK (anxiety_level BETWEEN 1 AND 5), -- 1: Calm, 5: Extreme anxiety
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_daily_mood UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_moods_user_date ON public.daily_moods(user_id, date);
ALTER TABLE public.daily_moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily moods"
    ON public.daily_moods FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.4. `therapy_plans` & `journey_modules`
Curated graded exposure milestones and generated weekly therapy plans.

```sql
CREATE TYPE module_category_enum AS ENUM (
    'psychoeducation',
    'somatic_relaxation',
    'micro_exposure',
    'informal_social',
    'transactional',
    'academic_authority',
    'group_presentation'
);

-- Master table for the journey hierarchy
CREATE TABLE public.journey_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_number INT NOT NULL,
    order_index INT NOT NULL,
    category module_category_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    target_criteria JSONB, -- { "min_duration_seconds": 30, "required_turns": 3 }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active user plan state
CREATE TABLE public.therapy_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_week INT DEFAULT 1,
    status VARCHAR(30) DEFAULT 'active', -- 'active', 'completed', 'paused'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_module_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.journey_modules(id) ON DELETE CASCADE,
    is_unlocked BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_user_module UNIQUE (user_id, module_id)
);

ALTER TABLE public.therapy_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own therapy plans"
    ON public.therapy_plans FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can access own module progress"
    ON public.user_module_progress FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.5. `daily_missions`
The personalized daily tasks presented on the Home dashboard.

```sql
CREATE TYPE mission_type_enum AS ENUM ('relaxation', 'guided_practice', 'simulation', 'reflection');
CREATE TYPE mission_status_enum AS ENUM ('pending', 'completed', 'skipped');

CREATE TABLE public.daily_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.therapy_plans(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mission_type mission_type_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    target_reference_id UUID, -- References module_id or scenario_id
    status mission_status_enum DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_missions_user_date ON public.daily_missions(user_id, date);
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily missions"
    ON public.daily_missions FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.6. `simulation_scenarios`, `simulations`, & `simulation_messages`
Handles the virtual exposure roleplays, Google STT audio references, and Claude AI responses.

```sql
CREATE TYPE scenario_category_enum AS ENUM ('daily_life', 'academic', 'professional', 'social_family', 'custom');

-- Master scenarios catalogue
CREATE TABLE public.simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category scenario_category_enum NOT NULL,
    title VARCHAR(150) NOT NULL, -- e.g., 'Kasir Minimarket'
    persona_role VARCHAR(100) NOT NULL, -- e.g., 'Kasir Ramah'
    description TEXT NOT NULL,
    difficulty_level INT DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    system_prompt_template TEXT NOT NULL,
    initial_ai_greeting TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulation session instances
CREATE TABLE public.simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES public.simulation_scenarios(id) ON DELETE SET NULL,
    total_duration_seconds INT DEFAULT 0,
    turns_count INT DEFAULT 0,
    confidence_score INT, -- Evaluated post-session (1-100)
    anxiety_score_after INT, -- User self-assessment (1-5)
    feedback_summary TEXT, -- LLM therapeutic feedback
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Dialogue turns
CREATE TABLE public.simulation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'assistant')),
    audio_storage_path TEXT, -- Supabase Storage path: 'audio-sessions/{user_id}/{file}.m4a'
    transcription_text TEXT,
    speech_duration_seconds NUMERIC(6, 2) DEFAULT 0.0,
    ai_empathy_score INT, -- AI internal metric for user response comfort
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_simulation_user_id ON public.simulations(user_id);
CREATE INDEX idx_simulation_messages_session ON public.simulation_messages(simulation_id);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own simulations"
    ON public.simulations FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own simulation messages"
    ON public.simulation_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.simulations s
            WHERE s.id = simulation_messages.simulation_id AND s.user_id = auth.uid()
        )
    );
```

---

### 3.7. `reflections`
Post-exposure CBT journaling entries.

```sql
CREATE TABLE public.reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.daily_missions(id) ON DELETE SET NULL,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE SET NULL,
    perceived_anxiety_before INT CHECK (perceived_anxiety_before BETWEEN 1 AND 5),
    perceived_anxiety_after INT CHECK (perceived_anxiety_after BETWEEN 1 AND 5),
    what_went_well TEXT,
    negative_thought_identified TEXT,
    rational_reframing TEXT,
    ai_encouragement_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_user_id ON public.reflections(user_id);
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reflections"
    ON public.reflections FOR ALL
    USING (auth.uid() = user_id);
```

---

### 3.8. `badges` & `user_badges`
Gamification elements for milestone achievements.

```sql
CREATE TABLE public.badges (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'first_voice', 'first_conversation', 'public_voice'
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by all authenticated users"
    ON public.badges FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view own earned badges"
    ON public.user_badges FOR SELECT
    USING (auth.uid() = user_id);
```

---

## 4. Supabase Storage Buckets
Configure the following storage buckets in the Supabase Dashboard:

| Bucket Name | Access Level | MIME Types | Max Size | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `audio-sessions` | Private | `audio/m4a`, `audio/wav`, `audio/mp3`, `audio/aac` | 25 MB | User voice recordings uploaded for STT processing & therapy session logs |
| `avatars` | Public / Authenticated | `image/png`, `image/jpeg`, `image/webp` | 5 MB | User profile avatars |

### Storage Security Policies (SQL)
```sql
-- Allow users to upload their own audio files in folder audio-sessions/{user_id}/
CREATE POLICY "Allow authenticated user uploads"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'audio-sessions' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow users to read own audio"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'audio-sessions' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
```
