-- Migration 001: Create schools and school_settings tables

CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  address text,
  city text,
  state text,
  country text NOT NULL DEFAULT 'India',
  phone text,
  email text,
  website text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schools_code_unique UNIQUE (code)
);

COMMENT ON TABLE public.schools IS 'Multi-tenant school/organization entity';

CREATE TABLE public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_settings_school_key_unique UNIQUE (school_id, key)
);

COMMENT ON TABLE public.school_settings IS 'Configurable school-level settings';

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
