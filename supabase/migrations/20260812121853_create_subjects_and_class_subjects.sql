-- Migration 004: Subjects and Class Subjects

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subjects_school_code_unique UNIQUE (school_id, code)
);

COMMENT ON TABLE public.subjects IS 'School subjects (Mathematics, English, etc.)';

ALTER TABLE public.subjects ADD CONSTRAINT subjects_id_school_unique UNIQUE (id, school_id);

CREATE TABLE public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_subjects_unique UNIQUE (school_id, class_id, subject_id)
);

ALTER TABLE public.class_subjects
  ADD CONSTRAINT class_subjects_class_school_fk
  FOREIGN KEY (class_id, school_id)
  REFERENCES public.classes(id, school_id);

ALTER TABLE public.class_subjects
  ADD CONSTRAINT class_subjects_subject_school_fk
  FOREIGN KEY (subject_id, school_id)
  REFERENCES public.subjects(id, school_id);

COMMENT ON TABLE public.class_subjects IS 'Maps subjects to classes (many-to-many)';

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
