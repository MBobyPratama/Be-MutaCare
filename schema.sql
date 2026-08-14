-- ========================================================
-- MUTA CARE DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Copy and run this script in your Supabase Dashboard -> SQL Editor
-- ========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. PROFILES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------
-- 2. ASSESSMENTS TABLE
-- --------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE assessment_type_enum AS ENUM ('initial', 'periodic', 'post_treatment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type assessment_type_enum DEFAULT 'initial',
    anxiety_score INT NOT NULL,
    mutism_severity VARCHAR(50) NOT NULL,
    primary_triggers TEXT[],
    answers_payload JSONB NOT NULL,
    ai_analysis_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage own assessments" ON public.assessments FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------
-- 3. DAILY MOODS TABLE
-- --------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE mood_status_enum AS ENUM ('happy', 'neutral', 'anxious', 'scared', 'sad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.daily_moods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mood mood_status_enum NOT NULL,
    anxiety_level INT NOT NULL CHECK (anxiety_level BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_daily_mood UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_moods_user_date ON public.daily_moods(user_id, date);
ALTER TABLE public.daily_moods ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage own daily moods" ON public.daily_moods FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------
-- 4. THERAPY PLANS & JOURNEY MODULES
-- --------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE module_category_enum AS ENUM (
        'psychoeducation',
        'somatic_relaxation',
        'micro_exposure',
        'informal_social',
        'transactional',
        'academic_authority',
        'group_presentation'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.journey_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_number INT NOT NULL,
    order_index INT NOT NULL,
    category module_category_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    target_criteria JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.therapy_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_week INT DEFAULT 1,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_module_progress (
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

DO $$ BEGIN
    CREATE POLICY "Users can access own therapy plans" ON public.therapy_plans FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can access own module progress" ON public.user_module_progress FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------
-- 5. DAILY MISSIONS TABLE
-- --------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE mission_type_enum AS ENUM ('relaxation', 'guided_practice', 'simulation', 'reflection');
    CREATE TYPE mission_status_enum AS ENUM ('pending', 'completed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.daily_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.therapy_plans(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mission_type mission_type_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    target_reference_id UUID,
    status mission_status_enum DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON public.daily_missions(user_id, date);
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage own daily missions" ON public.daily_missions FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------
-- 6. SIMULATIONS & MESSAGES TABLE
-- --------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE scenario_category_enum AS ENUM ('daily_life', 'academic', 'professional', 'social_family', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category scenario_category_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    persona_role VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    difficulty_level INT DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    system_prompt_template TEXT NOT NULL,
    initial_ai_greeting TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES public.simulation_scenarios(id) ON DELETE SET NULL,
    total_duration_seconds INT DEFAULT 0,
    turns_count INT DEFAULT 0,
    confidence_score INT,
    anxiety_score_after INT,
    feedback_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.simulation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'assistant')),
    audio_storage_path TEXT,
    transcription_text TEXT,
    speech_duration_seconds NUMERIC(6, 2) DEFAULT 0.0,
    ai_empathy_score INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulation_user_id ON public.simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_messages_session ON public.simulation_messages(simulation_id);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage own simulations" ON public.simulations FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view own simulation messages" ON public.simulation_messages FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.simulations s
            WHERE s.id = simulation_messages.simulation_id AND s.user_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------
-- 7. REFLECTIONS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reflections (
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

CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON public.reflections(user_id);
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage own reflections" ON public.reflections FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------
-- 8. BADGES & USER BADGES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badges (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Badges are viewable by all authenticated users" ON public.badges FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view own earned badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
