-- Migration 003: Classes and Sections

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT classes_school_name_unique UNIQUE (school_id, name)
);

COMMENT ON TABLE public.classes IS 'School classes (Nursery, LKG, UKG, Class 1-12)';

CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity integer,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sections_school_class_name_unique UNIQUE (school_id, class_id, name)
);

ALTER TABLE public.classes ADD CONSTRAINT classes_id_school_unique UNIQUE (id, school_id);

ALTER TABLE public.sections
  ADD CONSTRAINT sections_class_school_fk
  FOREIGN KEY (class_id, school_id)
  REFERENCES public.classes(id, school_id);

COMMENT ON TABLE public.sections IS 'Sections within a class (A, B, C)';

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
