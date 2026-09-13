-- Testivo Database Schema
-- Run this in your Supabase SQL Editor

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_file_path TEXT,
  total_questions INTEGER DEFAULT 0,
  total_marks NUMERIC DEFAULT 0,
  duration_seconds INTEGER DEFAULT 3600,
  negative_marking NUMERIC DEFAULT 0.25,
  allow_navigation BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','processing','ready','disabled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Exam Sections
CREATE TABLE IF NOT EXISTS exam_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  section_order INTEGER NOT NULL,
  start_question INTEGER NOT NULL,
  end_question INTEGER NOT NULL,
  duration_seconds INTEGER
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES exam_sections(id) ON DELETE SET NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT,
  question_type TEXT DEFAULT 'single_choice' CHECK (question_type IN ('single_choice','multiple_choice')),
  correct_answer JSONB DEFAULT '[]',
  marks NUMERIC DEFAULT 1,
  negative_marks NUMERIC DEFAULT 0,
  question_image_url TEXT,
  question_image_alt TEXT,
  source_page INTEGER,
  source_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Question Options
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  option_key TEXT NOT NULL,
  option_text TEXT,
  option_image_url TEXT,
  option_order INTEGER NOT NULL
);

-- Question Images
CREATE TABLE IF NOT EXISTS question_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  page_number INTEGER,
  metadata JSONB DEFAULT '{}'
);

-- Exam Attempts
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','expired')),
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  submitted_at TIMESTAMPTZ,
  current_section INTEGER DEFAULT 0,
  current_question INTEGER DEFAULT 0,
  time_remaining_seconds INTEGER
);

-- Attempt Answers
CREATE TABLE IF NOT EXISTS attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  selected_answer JSONB DEFAULT '[]',
  is_marked_review BOOLEAN DEFAULT false,
  saved_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(attempt_id, question_id)
);

-- Results
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  unanswered_count INTEGER DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Section Results
CREATE TABLE IF NOT EXISTS section_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID REFERENCES results(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES exam_sections(id) ON DELETE SET NULL,
  section_name TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  attempted INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  incorrect INTEGER DEFAULT 0,
  unanswered INTEGER DEFAULT 0,
  accuracy NUMERIC DEFAULT 0
);

-- Processing Jobs
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
  source_file_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  progress INTEGER DEFAULT 0,
  questions_found INTEGER DEFAULT 0,
  answers_found INTEGER DEFAULT 0,
  sections_found INTEGER DEFAULT 0,
  images_found INTEGER DEFAULT 0,
  provider_id UUID,
  model_id UUID,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- AI Providers
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  base_url TEXT NOT NULL,
  encrypted_secret_reference TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- AI Models
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE NOT NULL,
  model_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true
);

-- AI Configurations
CREATE TABLE IF NOT EXISTS ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE NOT NULL,
  model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exams_owner ON exams(owner_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_processing_user ON processing_jobs(user_id);

-- ==================================================
-- ROW LEVEL SECURITY
-- ==================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
);

-- Exams: users manage their own
CREATE POLICY "Users manage own exams" ON exams FOR ALL USING (
  owner_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Admins read all exams" ON exams FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
);

-- Exam sections: follow exam ownership
CREATE POLICY "Users read exam sections" ON exam_sections FOR SELECT USING (
  exam_id IN (SELECT id FROM exams WHERE owner_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "Service can insert sections" ON exam_sections FOR INSERT WITH CHECK (true);

-- Questions: follow exam ownership
CREATE POLICY "Users read own questions" ON questions FOR SELECT USING (
  exam_id IN (SELECT id FROM exams WHERE owner_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "Service can manage questions" ON questions FOR ALL USING (true);

-- Question options: follow question ownership
CREATE POLICY "Users read question options" ON question_options FOR SELECT USING (
  question_id IN (
    SELECT q.id FROM questions q
    JOIN exams e ON q.exam_id = e.id
    WHERE e.owner_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
);
CREATE POLICY "Service can manage options" ON question_options FOR ALL USING (true);

-- Attempts: users manage their own
CREATE POLICY "Users manage own attempts" ON exam_attempts FOR ALL USING (
  user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);

-- Answers: through attempt
CREATE POLICY "Users manage own answers" ON attempt_answers FOR ALL USING (
  attempt_id IN (
    SELECT id FROM exam_attempts WHERE user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
);

-- Results: users read their own
CREATE POLICY "Users read own results" ON results FOR SELECT USING (
  attempt_id IN (
    SELECT id FROM exam_attempts WHERE user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
);
CREATE POLICY "Service can insert results" ON results FOR INSERT WITH CHECK (true);

-- Section results
CREATE POLICY "Users read own section results" ON section_results FOR SELECT USING (
  result_id IN (
    SELECT r.id FROM results r
    JOIN exam_attempts a ON r.attempt_id = a.id
    WHERE a.user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
);
CREATE POLICY "Service can insert section results" ON section_results FOR INSERT WITH CHECK (true);

-- Processing jobs: users manage their own
CREATE POLICY "Users manage own jobs" ON processing_jobs FOR ALL USING (
  user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Service can update jobs" ON processing_jobs FOR UPDATE USING (true);

-- AI config: admin only
CREATE POLICY "Admins manage AI providers" ON ai_providers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Authenticated read AI providers" ON ai_providers FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage AI models" ON ai_models FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Authenticated read AI models" ON ai_models FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage AI config" ON ai_configurations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Authenticated read AI config" ON ai_configurations FOR SELECT USING (auth.uid() IS NOT NULL);

-- Audit logs: admin only
CREATE POLICY "Admins read audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Service can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- ==================================================
-- STORAGE BUCKETS
-- ==================================================
-- Run these in Supabase dashboard > Storage:
-- 1. Create bucket: exam-pdfs (private)
-- 2. Create bucket: question-images (private)
-- 3. Create bucket: avatars (public)

-- Storage policies (run after creating buckets):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exam-pdfs', 'exam-pdfs', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
