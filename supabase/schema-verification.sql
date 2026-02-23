-- ============================================================
-- EEE Roadmap — Verification System Schema
-- Run this in the Supabase SQL Editor (not a migration file).
-- ============================================================

-- TABLE: user_roles
-- Stores admin and verifier role assignments.
-- Only admins can read/write this table (RLS enforced).
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('admin', 'verifier')),
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- TABLE: verifications
-- One active row per (topic_key, aspect) at any time.
-- topic_key format: "trackSlug/topicId"  e.g. "fundamentals/dc-circuits"
-- Soft-deleted by setting revoked_at (null = active).
CREATE TABLE IF NOT EXISTS public.verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_key     text NOT NULL,
  aspect        text NOT NULL CHECK (aspect IN ('content', 'resources', 'pedagogy')),
  verified_by   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verifier_name text,
  verified_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz,
  revoked_by    uuid REFERENCES auth.users(id)
);

-- Partial unique index: only one active verification per (topic_key, aspect).
-- Must use CREATE UNIQUE INDEX syntax — PostgreSQL does not support partial
-- constraints via table-level UNIQUE (...) WHERE ... syntax.
CREATE UNIQUE INDEX IF NOT EXISTS verifications_active_unique
  ON public.verifications (topic_key, aspect)
  WHERE revoked_at IS NULL;

-- Index for fast per-track queries (LIKE 'trackSlug/%')
CREATE INDEX IF NOT EXISTS verifications_topic_key_idx
  ON public.verifications (topic_key)
  WHERE revoked_at IS NULL;

-- ============================================================
-- HELPER FUNCTION: public.has_role(p_user_id, p_role)
-- Used in RLS policies. SECURITY DEFINER so it can read user_roles
-- even when the calling user's RLS would block direct reads.
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = p_role
  );
$$;

-- ============================================================
-- RLS: user_roles
-- Only admins can read, insert, or delete role assignments.
-- ============================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_insert_roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_delete_roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS: verifications
-- Public read (badges visible to all), verifier/admin write,
-- admin-only revocation (UPDATE to set revoked_at).
-- ============================================================
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_verifications"
  ON public.verifications FOR SELECT
  USING (revoked_at IS NULL);

CREATE POLICY "verifiers_insert"
  ON public.verifications FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'verifier')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "admins_revoke"
  ON public.verifications FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SEED — run separately after setting up the tables.
-- Replace <owner-uuid> with the UUID from auth.users for the
-- project owner (visible in Supabase Authentication → Users).
-- ============================================================
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('<owner-uuid>', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;
