-- ====================================================
-- FOX FORD — Standard PostgreSQL Database Schema
-- Production Ready for Contabo VPS / Docker / Local
-- ====================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom ENUM Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'cancelled', 'expired', 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'scored', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE vocabulary_mastery AS ENUM ('new', 'learning', 'review', 'mastered');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE writing_task_type AS ENUM ('task_1', 'task_2');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Users Table (Independent of Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role user_role DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    telegram_id BIGINT UNIQUE,
    telegram_username TEXT,
    target_band NUMERIC(3,1) DEFAULT 7.0,
    challenges TEXT[] DEFAULT '{}',
    plan_timeline TEXT,
    has_taken_ielts BOOLEAN DEFAULT false,
    previous_score NUMERIC(3,1),
    estimated_level TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    role user_role DEFAULT 'student',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Plans & Subscriptions
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    price INTEGER NOT NULL, -- in cents
    currency TEXT DEFAULT 'USD',
    interval TEXT CHECK (interval IN ('monthly', 'yearly', 'lifetime')),
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status subscription_status DEFAULT 'pending',
    provider TEXT NOT NULL,
    provider_subscription_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    provider TEXT NOT NULL,
    provider_payment_id TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_usd', 'fixed_uzs')),
    discount_value NUMERIC(10,2) NOT NULL,
    min_order_amount NUMERIC(10,2) DEFAULT 0,
    max_uses INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Content Modules: Reading Passages & Listening Audio
CREATE TABLE IF NOT EXISTS reading_passages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    word_count INTEGER,
    difficulty difficulty_level DEFAULT 'medium',
    status content_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listening_audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    transcript TEXT,
    is_premium BOOLEAN DEFAULT false,
    status content_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tests & Test Structure
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    skill TEXT NOT NULL, -- 'reading', 'listening', 'writing', 'speaking', 'mock'
    difficulty difficulty_level DEFAULT 'medium',
    is_premium BOOLEAN DEFAULT false,
    access_type TEXT DEFAULT 'free',
    status content_status DEFAULT 'draft',
    time_limit_minutes INTEGER NOT NULL DEFAULT 60,
    total_questions INTEGER NOT NULL DEFAULT 0,
    slug TEXT,
    ielts_type TEXT DEFAULT 'academic',
    cover_image TEXT,
    tags TEXT[] DEFAULT '{}',
    is_archived BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    instructions TEXT,
    description TEXT,
    time_limit_minutes INTEGER,
    passage_id UUID REFERENCES reading_passages(id) ON DELETE SET NULL,
    audio_id UUID REFERENCES listening_audio(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    skill TEXT,
    description TEXT,
    schema_config JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES test_sections(id) ON DELETE CASCADE,
    title TEXT,
    instruction TEXT,
    passage_id UUID REFERENCES reading_passages(id) ON DELETE SET NULL,
    media_id UUID REFERENCES listening_audio(id) ON DELETE SET NULL,
    order_number INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES test_sections(id) ON DELETE CASCADE,
    group_id UUID REFERENCES question_groups(id) ON DELETE CASCADE,
    question_type_id UUID REFERENCES question_types(id) ON DELETE SET NULL,
    question_type TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    instruction TEXT,
    question_text TEXT NOT NULL,
    question_html TEXT,
    correct_answer TEXT,
    accepted_answers JSONB DEFAULT '[]'::JSONB,
    passage_reference TEXT,
    image_url TEXT,
    audio_url TEXT,
    tags TEXT[] DEFAULT '{}',
    points INTEGER DEFAULT 1,
    difficulty difficulty_level DEFAULT 'medium',
    metadata JSONB DEFAULT '{}'::JSONB,
    explanation TEXT,
    status content_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_key TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_number INTEGER NOT NULL DEFAULT 1
);

-- 8. Writing & Speaking Prompts & Submissions
CREATE TABLE IF NOT EXISTS writing_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type writing_task_type NOT NULL,
    title TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    image_url TEXT,
    difficulty difficulty_level DEFAULT 'medium',
    is_premium BOOLEAN DEFAULT false,
    status content_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS writing_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES writing_prompts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS writing_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES writing_submissions(id) ON DELETE CASCADE UNIQUE,
    task_achievement NUMERIC(3,1),
    coherence_cohesion NUMERIC(3,1),
    lexical_resource NUMERIC(3,1),
    grammatical_range NUMERIC(3,1),
    estimated_band NUMERIC(3,1),
    feedback_text TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speaking_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number INTEGER NOT NULL CHECK (part_number IN (1, 2, 3)),
    title TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    follow_up_questions TEXT[] DEFAULT '{}',
    difficulty difficulty_level DEFAULT 'medium',
    is_premium BOOLEAN DEFAULT false,
    status content_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speaking_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_id UUID NOT NULL REFERENCES speaking_prompts(id) ON DELETE CASCADE,
    audio_path TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    transcript TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speaking_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES speaking_submissions(id) ON DELETE CASCADE UNIQUE,
    fluency_coherence NUMERIC(3,1),
    lexical_resource NUMERIC(3,1),
    grammatical_range NUMERIC(3,1),
    pronunciation NUMERIC(3,1),
    estimated_band NUMERIC(3,1),
    feedback_text TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Test Attempts & User Progress
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    status attempt_status DEFAULT 'in_progress',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_used_seconds INTEGER DEFAULT 0,
    raw_score INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    estimated_band NUMERIC(3,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer JSONB,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMPTZ,
    marked_for_review BOOLEAN DEFAULT false,
    UNIQUE(attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS section_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES test_sections(id) ON DELETE CASCADE,
    raw_score INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    estimated_band NUMERIC(3,1),
    UNIQUE(attempt_id, section_id)
);

CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    estimated_band NUMERIC(3,1),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Vocabulary with SRS (Spaced Repetition System)
CREATE TABLE IF NOT EXISTS vocabulary_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    definition TEXT NOT NULL,
    example_sentence TEXT,
    pronunciation TEXT,
    part_of_speech TEXT,
    topic TEXT NOT NULL,
    difficulty difficulty_level DEFAULT 'medium',
    is_premium BOOLEAN DEFAULT false,
    status content_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id UUID NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
    status vocabulary_mastery DEFAULT 'new',
    mastery_level INTEGER DEFAULT 0,
    next_review_at TIMESTAMPTZ,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, word_id)
);

-- 11. Saved Items & Activity Logs
CREATE TABLE IF NOT EXISTS saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('question', 'vocabulary', 'writing', 'speaking', 'test')),
    item_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS band_score_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill TEXT NOT NULL,
    test_type TEXT NOT NULL DEFAULT 'academic',
    raw_score_min INTEGER NOT NULL,
    raw_score_max INTEGER NOT NULL,
    band_score NUMERIC(3,1) NOT NULL
);

-- 12. Admin & Production Readiness Tables
CREATE TABLE IF NOT EXISTS imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL,
    file_url TEXT,
    status TEXT DEFAULT 'uploaded',
    raw_text TEXT,
    raw_json JSONB,
    parsed_json JSONB,
    error_message TEXT,
    warnings JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID REFERENCES imports(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    duration_seconds INTEGER,
    module TEXT,
    transcript TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#f59e0b',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Production Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_tests_skill_status ON tests(skill, status);
CREATE INDEX IF NOT EXISTS idx_questions_test_section ON questions (test_id, section_id, question_number);
CREATE INDEX IF NOT EXISTS idx_question_options_q_correct ON question_options (question_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_test_sections_test_order ON test_sections (test_id, order_number);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_test ON test_attempts (user_id, test_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_q ON attempt_answers (attempt_id, question_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_user_next_rev ON user_vocabulary (user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_progress_user_skill ON progress (user_id, skill);

-- 14. Trigger Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_modtime ON plans;
CREATE TRIGGER update_plans_modtime BEFORE UPDATE ON plans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_tests_modtime ON tests;
CREATE TRIGGER update_tests_modtime BEFORE UPDATE ON tests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_modtime ON questions;
CREATE TRIGGER update_questions_modtime BEFORE UPDATE ON questions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
