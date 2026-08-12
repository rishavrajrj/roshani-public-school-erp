-- Migration 006: Guardians, Students, and Student-Guardian relationship

CREATE TABLE public.guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  relationship text,
  phone text,
  alternate_phone text,
  email text,
  address text,
  occupation text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guardians ADD CONSTRAINT guardians_id_school_unique UNIQUE (id, school_id);

COMMENT ON TABLE public.guardians IS 'Parent/guardian records. A guardian may have multiple children.';

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  admission_number text NOT NULL,
  roll_number text,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  photo_url text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'alumni', 'transferred')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT students_school_admission_unique UNIQUE (school_id, admission_number)
);

ALTER TABLE public.students ADD CONSTRAINT students_id_school_unique UNIQUE (id, school_id);

COMMENT ON TABLE public.students IS 'Core student entity. Admission number is unique per school, NOT the PK.';

CREATE TABLE public.student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_id uuid NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  relationship text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_guardians_unique UNIQUE (student_id, guardian_id)
);

COMMENT ON TABLE public.student_guardians IS 'Many-to-many relationship: students <-> guardians';

ALTER TABLE public.student_guardians ADD COLUMN school_id uuid;
ALTER TABLE public.student_guardians ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.student_guardians ADD CONSTRAINT student_guardians_school_fk FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;

ALTER TABLE public.student_guardians
  ADD CONSTRAINT student_guardians_student_school_fk
  FOREIGN KEY (student_id, school_id)
  REFERENCES public.students(id, school_id);

ALTER TABLE public.student_guardians
  ADD CONSTRAINT student_guardians_guardian_school_fk
  FOREIGN KEY (guardian_id, school_id)
  REFERENCES public.guardians(id, school_id);

ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
