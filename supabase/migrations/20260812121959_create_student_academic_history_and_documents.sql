-- Migration 007: Student Academic History and Student Documents

ALTER TABLE public.academic_sessions ADD CONSTRAINT academic_sessions_id_school_unique UNIQUE (id, school_id);
ALTER TABLE public.sections ADD CONSTRAINT sections_id_school_unique UNIQUE (id, school_id);

CREATE TABLE public.student_academic_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  roll_number text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'promoted', 'detained', 'transferred', 'withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_student_academic_history_active
  ON public.student_academic_history (student_id, academic_session_id)
  WHERE status = 'active';

ALTER TABLE public.student_academic_history
  ADD CONSTRAINT sah_student_school_fk
  FOREIGN KEY (student_id, school_id)
  REFERENCES public.students(id, school_id);

ALTER TABLE public.student_academic_history
  ADD CONSTRAINT sah_session_school_fk
  FOREIGN KEY (academic_session_id, school_id)
  REFERENCES public.academic_sessions(id, school_id);

ALTER TABLE public.student_academic_history
  ADD CONSTRAINT sah_class_school_fk
  FOREIGN KEY (class_id, school_id)
  REFERENCES public.classes(id, school_id);

ALTER TABLE public.student_academic_history
  ADD CONSTRAINT sah_section_school_fk
  FOREIGN KEY (section_id, school_id)
  REFERENCES public.sections(id, school_id);

COMMENT ON TABLE public.student_academic_history IS 'Tracks student class/section per academic year. Preserves history.';

CREATE TABLE public.student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.student_documents IS 'Document metadata. Actual files stored in Supabase Storage (private bucket).';

ALTER TABLE public.student_academic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
