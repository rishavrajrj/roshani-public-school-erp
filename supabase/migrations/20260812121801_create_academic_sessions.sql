-- Migration 002: Academic Sessions

CREATE TABLE public.academic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_sessions_school_name_unique UNIQUE (school_id, name),
  CONSTRAINT academic_sessions_dates_valid CHECK (end_date > start_date)
);

CREATE UNIQUE INDEX idx_academic_sessions_one_current
  ON public.academic_sessions (school_id)
  WHERE is_current = true;

COMMENT ON TABLE public.academic_sessions IS 'Academic year sessions (e.g. 2026-27)';

ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
