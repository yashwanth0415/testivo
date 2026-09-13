-- Testivo hardening migration.
-- Run after 001_initial_schema.sql.

-- Add email to profiles for admin/user management screens.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Populate email for existing profiles where possible.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.auth_user_id = u.id AND (p.email IS NULL OR p.email = '');

-- Avoid duplicate AI models for the same provider/model pair.
CREATE UNIQUE INDEX IF NOT EXISTS ai_models_provider_model_uidx
  ON public.ai_models(provider_id, model_id);

-- At most one active configuration.
CREATE UNIQUE INDEX IF NOT EXISTS ai_configurations_one_active_uidx
  ON public.ai_configurations(is_active) WHERE is_active = true;

-- Updated timestamp helper.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Safe admin predicate to avoid recursive RLS policies on profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND is_admin = true
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Replace recursive/broad admin policies with the SECURITY DEFINER predicate.
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read all exams" ON public.exams;
CREATE POLICY "Admins read all exams" ON public.exams FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage AI providers" ON public.ai_providers;
CREATE POLICY "Admins manage AI providers" ON public.ai_providers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Authenticated read AI providers" ON public.ai_providers;

DROP POLICY IF EXISTS "Admins manage AI models" ON public.ai_models;
CREATE POLICY "Admins manage AI models" ON public.ai_models FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Authenticated read AI models" ON public.ai_models;

DROP POLICY IF EXISTS "Admins manage AI config" ON public.ai_configurations;
CREATE POLICY "Admins manage AI config" ON public.ai_configurations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Authenticated read AI config" ON public.ai_configurations;

DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

-- Admins can manage all exam-related data through server-side/admin JWT checks.
CREATE POLICY "Admins read all sections" ON public.exam_sections FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all questions" ON public.questions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all options" ON public.question_options FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all attempts" ON public.exam_attempts FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all answers" ON public.attempt_answers FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all results" ON public.results FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all section results" ON public.section_results FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins read all processing jobs" ON public.processing_jobs FOR SELECT USING (public.is_admin());

-- Storage buckets.
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-pdfs', 'exam-pdfs', false), ('question-images', 'question-images', false), ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Private PDF ownership policy: first path segment is auth user id.
DROP POLICY IF EXISTS "Users upload own exam PDFs" ON storage.objects;
CREATE POLICY "Users upload own exam PDFs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exam-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users read own exam PDFs" ON storage.objects;
CREATE POLICY "Users read own exam PDFs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exam-pdfs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
DROP POLICY IF EXISTS "Users delete own exam PDFs" ON storage.objects;
CREATE POLICY "Users delete own exam PDFs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exam-pdfs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

-- Question images are private; users may read images referenced by their own exams.
DROP POLICY IF EXISTS "Users read question images" ON storage.objects;
CREATE POLICY "Users read question images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'question-images' AND public.is_admin());

-- Avatars are public by design; uploads are scoped to the user's folder.
DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
CREATE POLICY "Users upload own avatars" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
CREATE POLICY "Users update own avatars" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- NOTE: ai_providers.encrypted_secret_reference contains ciphertext only after the
-- server hardening deployed with this migration. Do not write plaintext API keys.

CREATE UNIQUE INDEX IF NOT EXISTS ai_providers_provider_type_uidx ON public.ai_providers(provider_type);

-- These tables are written by the privileged Edge Function. Do not expose broad
-- client-side write policies; the service role bypasses RLS safely.
DROP POLICY IF EXISTS "Service can insert sections" ON public.exam_sections;
DROP POLICY IF EXISTS "Service can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Service can manage options" ON public.question_options;
DROP POLICY IF EXISTS "Service can insert results" ON public.results;
DROP POLICY IF EXISTS "Service can insert section results" ON public.section_results;
DROP POLICY IF EXISTS "Service can update jobs" ON public.processing_jobs;
DROP POLICY IF EXISTS "Service can insert audit logs" ON public.audit_logs;
