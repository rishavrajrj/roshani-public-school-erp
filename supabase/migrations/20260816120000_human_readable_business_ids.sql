-- ==============================================================================
-- Migration: Human-Readable Business ID Standardization & Atomic Sequence Architecture
-- Ensures strict separation between internal UUID PKs/FKs and user-facing business IDs.
-- ==============================================================================

-- 1. Atomic Multi-Tenant Sequence Counter Table
CREATE TABLE IF NOT EXISTS public.business_id_sequences (
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  year_val TEXT NOT NULL,
  last_val BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (school_id, entity_type, year_val)
);

CREATE INDEX IF NOT EXISTS idx_business_id_sequences_lookup
ON public.business_id_sequences (school_id, entity_type, year_val);

-- Enable RLS on sequences
ALTER TABLE public.business_id_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_id_sequences_select ON public.business_id_sequences
  FOR SELECT TO authenticated
  USING (school_id = public.get_current_school_id() OR public.has_role('Super Admin'));

-- 2. Concurrency-Safe Sequence Increment Function
CREATE OR REPLACE FUNCTION public.get_next_business_sequence(
  p_school_id UUID,
  p_entity_type TEXT,
  p_year TEXT DEFAULT 'GLOBAL'
)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_next_val BIGINT;
BEGIN
  INSERT INTO public.business_id_sequences (school_id, entity_type, year_val, last_val, updated_at)
  VALUES (p_school_id, upper(p_entity_type), p_year, 1, now())
  ON CONFLICT (school_id, entity_type, year_val)
  DO UPDATE SET
    last_val = public.business_id_sequences.last_val + 1,
    updated_at = now()
  RETURNING last_val INTO v_next_val;

  RETURN v_next_val;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_business_sequence(UUID, TEXT, TEXT) TO authenticated;

-- 3. Add Business ID Columns to Core Tables
DO $$
BEGIN
  -- students: student_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'student_code'
  ) THEN
    ALTER TABLE public.students ADD COLUMN student_code TEXT;
  END IF;

  -- guardians: guardian_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'guardians' AND column_name = 'guardian_code'
  ) THEN
    ALTER TABLE public.guardians ADD COLUMN guardian_code TEXT;
  END IF;

  -- profiles: employee_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'employee_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN employee_code TEXT;
  END IF;

  -- academic_sessions: session_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'academic_sessions' AND column_name = 'session_code'
  ) THEN
    ALTER TABLE public.academic_sessions ADD COLUMN session_code TEXT;
  END IF;

  -- classes: class_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'class_code'
  ) THEN
    ALTER TABLE public.classes ADD COLUMN class_code TEXT;
  END IF;

  -- sections: section_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sections' AND column_name = 'section_code'
  ) THEN
    ALTER TABLE public.sections ADD COLUMN section_code TEXT;
  END IF;
END $$;

-- 4. Central Business ID Generation Database Functions
CREATE OR REPLACE FUNCTION public.generate_student_code(p_school_id UUID, p_year TEXT DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_code TEXT;
  v_year TEXT;
  v_seq BIGINT;
BEGIN
  SELECT code INTO v_school_code FROM public.schools WHERE id = p_school_id;
  IF v_school_code IS NULL THEN
    v_school_code := 'RPS-NOIDA';
  END IF;

  IF p_year IS NOT NULL AND p_year <> '' THEN
    v_year := p_year;
  ELSE
    v_year := to_char(now(), 'YYYY');
  END IF;

  v_seq := public.get_next_business_sequence(p_school_id, 'STUDENT', v_year);
  RETURN 'STU-' || v_school_code || '-' || v_year || '-' || lpad(v_seq::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_admission_number(p_school_id UUID, p_year TEXT DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_code TEXT;
  v_year TEXT;
  v_seq BIGINT;
BEGIN
  SELECT code INTO v_school_code FROM public.schools WHERE id = p_school_id;
  IF v_school_code IS NULL THEN
    v_school_code := 'RPS-NOIDA';
  END IF;

  IF p_year IS NOT NULL AND p_year <> '' THEN
    v_year := p_year;
  ELSE
    v_year := to_char(now(), 'YYYY');
  END IF;

  v_seq := public.get_next_business_sequence(p_school_id, 'ADMISSION', v_year);
  RETURN 'ADM-' || v_school_code || '-' || v_year || '-' || lpad(v_seq::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_guardian_code(p_school_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_code TEXT;
  v_seq BIGINT;
BEGIN
  SELECT code INTO v_school_code FROM public.schools WHERE id = p_school_id;
  IF v_school_code IS NULL THEN
    v_school_code := 'RPS-NOIDA';
  END IF;

  v_seq := public.get_next_business_sequence(p_school_id, 'GUARDIAN', 'GLOBAL');
  RETURN 'GDN-' || v_school_code || '-' || lpad(v_seq::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_employee_code(p_school_id UUID, p_year TEXT DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_code TEXT;
  v_year TEXT;
  v_seq BIGINT;
BEGIN
  SELECT code INTO v_school_code FROM public.schools WHERE id = p_school_id;
  IF v_school_code IS NULL THEN
    v_school_code := 'RPS-NOIDA';
  END IF;

  IF p_year IS NOT NULL AND p_year <> '' THEN
    v_year := p_year;
  ELSE
    v_year := to_char(now(), 'YYYY');
  END IF;

  v_seq := public.get_next_business_sequence(p_school_id, 'EMPLOYEE', v_year);
  RETURN 'EMP-' || v_school_code || '-' || v_year || '-' || lpad(v_seq::TEXT, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_student_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_admission_number(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_guardian_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_employee_code(UUID, TEXT) TO authenticated;

-- 5. Backfill Existing Records Deterministically
DO $$
DECLARE
  r_school RECORD;
  r_student RECORD;
  r_guardian RECORD;
  r_profile RECORD;
  r_class RECORD;
  r_section RECORD;
  r_session RECORD;
  v_seq INT;
  v_code TEXT;
BEGIN
  -- Backfill Academic Sessions
  FOR r_session IN SELECT s.id, s.name, sc.code as school_code FROM public.academic_sessions s JOIN public.schools sc ON s.school_id = sc.id WHERE s.session_code IS NULL LOOP
    v_code := 'SES-' || r_session.school_code || '-' || split_part(r_session.name, '-', 1);
    UPDATE public.academic_sessions SET session_code = v_code WHERE id = r_session.id;
  END LOOP;

  -- Backfill Classes
  FOR r_class IN SELECT c.id, c.name, sc.code as school_code FROM public.classes c JOIN public.schools sc ON c.school_id = sc.id WHERE c.class_code IS NULL LOOP
    v_code := 'CLS-' || r_class.school_code || '-' || upper(replace(replace(r_class.name, 'Class ', ''), ' ', ''));
    UPDATE public.classes SET class_code = v_code WHERE id = r_class.id;
  END LOOP;

  -- Backfill Sections
  FOR r_section IN 
    SELECT sec.id, sec.name, c.name as class_name, sc.code as school_code 
    FROM public.sections sec 
    JOIN public.classes c ON sec.class_id = c.id
    JOIN public.schools sc ON sec.school_id = sc.id 
    WHERE sec.section_code IS NULL 
  LOOP
    v_code := 'SEC-' || r_section.school_code || '-' || upper(replace(replace(r_section.class_name, 'Class ', ''), ' ', '')) || '-' || upper(r_section.name);
    UPDATE public.sections SET section_code = v_code WHERE id = r_section.id;
  END LOOP;

  -- Backfill Guardians
  FOR r_school IN SELECT id, code FROM public.schools LOOP
    v_seq := 1;
    FOR r_guardian IN SELECT id FROM public.guardians WHERE school_id = r_school.id ORDER BY created_at ASC, id ASC LOOP
      UPDATE public.guardians 
      SET guardian_code = 'GDN-' || r_school.code || '-' || lpad(v_seq::TEXT, 6, '0')
      WHERE id = r_guardian.id AND (guardian_code IS NULL OR guardian_code = '');
      v_seq := v_seq + 1;
    END LOOP;
  END LOOP;

  -- Backfill Profiles (Staff / Employees)
  FOR r_school IN SELECT id, code FROM public.schools LOOP
    v_seq := 1;
    FOR r_profile IN SELECT id FROM public.profiles WHERE school_id = r_school.id ORDER BY created_at ASC, id ASC LOOP
      UPDATE public.profiles 
      SET employee_code = 'EMP-' || r_school.code || '-2026-' || lpad(v_seq::TEXT, 6, '0')
      WHERE id = r_profile.id AND (employee_code IS NULL OR employee_code = '');
      v_seq := v_seq + 1;
    END LOOP;
  END LOOP;

  -- Backfill Students
  FOR r_school IN SELECT id, code FROM public.schools LOOP
    v_seq := 1;
    FOR r_student IN SELECT id, admission_number FROM public.students WHERE school_id = r_school.id ORDER BY created_at ASC, id ASC LOOP
      -- Update student_code
      UPDATE public.students 
      SET student_code = 'STU-' || r_school.code || '-2026-' || lpad(v_seq::TEXT, 6, '0'),
          admission_number = CASE 
            WHEN admission_number LIKE 'ADM-%' THEN admission_number
            ELSE 'ADM-' || r_school.code || '-2026-' || lpad(v_seq::TEXT, 6, '0')
          END
      WHERE id = r_student.id;
      v_seq := v_seq + 1;
    END LOOP;
  END LOOP;

  -- Backfill Admission Applications
  FOR r_school IN SELECT id, code FROM public.schools LOOP
    v_seq := 1;
    FOR r_student IN SELECT id, application_number FROM public.admission_applications WHERE school_id = r_school.id ORDER BY created_at ASC, id ASC LOOP
      UPDATE public.admission_applications
      SET application_number = 'ADM-' || r_school.code || '-2026-' || lpad(v_seq::TEXT, 6, '0')
      WHERE id = r_student.id AND (application_number NOT LIKE 'ADM-%');
      v_seq := v_seq + 1;
    END LOOP;
  END LOOP;
END $$;

-- 6. Add Indexes and Constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_code_unique ON public.students (student_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_guardian_code_unique ON public.guardians (guardian_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_employee_code_unique ON public.profiles (employee_code) WHERE employee_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_academic_sessions_session_code ON public.academic_sessions (school_id, session_code);
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON public.classes (school_id, class_code);
CREATE INDEX IF NOT EXISTS idx_sections_section_code ON public.sections (school_id, section_code);
