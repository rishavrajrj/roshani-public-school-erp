-- Migration 023: Create Attendance Management & Teacher Assignments

-- 1. Teacher Assignments Table
CREATE TABLE public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ta_school_session_fk FOREIGN KEY (academic_session_id, school_id) REFERENCES public.academic_sessions(id, school_id),
  CONSTRAINT ta_school_class_fk FOREIGN KEY (class_id, school_id) REFERENCES public.classes(id, school_id),
  CONSTRAINT ta_school_section_fk FOREIGN KEY (section_id, school_id) REFERENCES public.sections(id, school_id)
);

CREATE UNIQUE INDEX idx_teacher_assignments_active_unique
  ON public.teacher_assignments (school_id, academic_session_id, teacher_profile_id, class_id, section_id)
  WHERE active = true;

CREATE INDEX idx_teacher_assignments_search
  ON public.teacher_assignments (school_id, academic_session_id, class_id, section_id, active);

CREATE INDEX idx_teacher_assignments_teacher
  ON public.teacher_assignments (teacher_profile_id, active);

COMMENT ON TABLE public.teacher_assignments IS 'Teacher section assignments per academic session.';

-- 2. Attendance Sessions Table
CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'locked')),
  marked_by uuid NOT NULL REFERENCES public.profiles(id),
  marked_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_sessions_unique UNIQUE (school_id, academic_session_id, class_id, section_id, attendance_date),
  CONSTRAINT att_sess_session_fk FOREIGN KEY (academic_session_id, school_id) REFERENCES public.academic_sessions(id, school_id),
  CONSTRAINT att_sess_class_fk FOREIGN KEY (class_id, school_id) REFERENCES public.classes(id, school_id),
  CONSTRAINT att_sess_section_fk FOREIGN KEY (section_id, school_id) REFERENCES public.sections(id, school_id)
);

CREATE INDEX idx_attendance_sessions_lookup
  ON public.attendance_sessions (school_id, academic_session_id, class_id, section_id, attendance_date);

COMMENT ON TABLE public.attendance_sessions IS 'Tracks daily logical attendance session state (submitted/locked) for a section.';

-- 3. Attendance Records Table
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
  remarks text,
  marked_by uuid NOT NULL REFERENCES public.profiles(id),
  marked_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_records_student_date_unique UNIQUE (school_id, academic_session_id, student_id, attendance_date),
  CONSTRAINT att_rec_student_fk FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id),
  CONSTRAINT att_rec_session_fk FOREIGN KEY (academic_session_id, school_id) REFERENCES public.academic_sessions(id, school_id),
  CONSTRAINT att_rec_class_fk FOREIGN KEY (class_id, school_id) REFERENCES public.classes(id, school_id),
  CONSTRAINT att_rec_section_fk FOREIGN KEY (section_id, school_id) REFERENCES public.sections(id, school_id)
);

CREATE INDEX idx_attendance_records_student
  ON public.attendance_records (school_id, academic_session_id, student_id, attendance_date);

CREATE INDEX idx_attendance_records_section_date
  ON public.attendance_records (school_id, academic_session_id, class_id, section_id, attendance_date);

COMMENT ON TABLE public.attendance_records IS 'Daily student attendance status records.';

-- 4. Database Trigger: Student Class/Section Enrollment Validation
CREATE OR REPLACE FUNCTION public.validate_student_attendance_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.student_academic_history sah
    WHERE sah.student_id = NEW.student_id
      AND sah.school_id = NEW.school_id
      AND sah.academic_session_id = NEW.academic_session_id
      AND sah.class_id = NEW.class_id
      AND sah.section_id = NEW.section_id
      AND sah.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Student % is not actively enrolled in class %, section % for session %',
      NEW.student_id, NEW.class_id, NEW.section_id, NEW.academic_session_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_student_attendance_enrollment
  BEFORE INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_student_attendance_enrollment();

-- 5. RLS Helper Function for Teacher Assignment
CREATE OR REPLACE FUNCTION public.is_assigned_teacher_of_section(
  p_academic_session_id uuid,
  p_class_id uuid,
  p_section_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_assignments ta
    JOIN public.profiles p ON p.id = ta.teacher_profile_id
    WHERE p.auth_user_id = (SELECT auth.uid())
      AND ta.school_id = p.school_id
      AND ta.academic_session_id = p_academic_session_id
      AND ta.class_id = p_class_id
      AND ta.section_id = p_section_id
      AND ta.active = true
  ) AND public.has_role('Teacher');
$$;

REVOKE EXECUTE ON FUNCTION public.is_assigned_teacher_of_section(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_assigned_teacher_of_section(uuid, uuid, uuid) TO authenticated;

-- 6. Enable RLS
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;

-- 7. RLS Policies

-- teacher_assignments policies
CREATE POLICY "ta_select" ON public.teacher_assignments FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR teacher_profile_id = (SELECT public.get_current_profile_id())
    )
  );

CREATE POLICY "ta_all_admin" ON public.teacher_assignments FOR ALL TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  )
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

-- attendance_sessions policies
CREATE POLICY "att_sess_select" ON public.attendance_sessions FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
    )
  );

CREATE POLICY "att_sess_insert" ON public.attendance_sessions FOR INSERT TO authenticated
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
    )
  );

CREATE POLICY "att_sess_update" ON public.attendance_sessions FOR UPDATE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND status != 'locked'
      )
    )
  )
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND status != 'locked'
      )
    )
  );

CREATE POLICY "att_sess_delete" ON public.attendance_sessions FOR DELETE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

-- attendance_records policies
CREATE POLICY "att_rec_select" ON public.attendance_records FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
      OR public.is_guardian_of_student(student_id)
      OR (
        student_id IN (SELECT id FROM public.students WHERE profile_id = (SELECT public.get_current_profile_id()))
        AND public.has_role('Student')
      )
    )
  );

CREATE POLICY "att_rec_insert" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND NOT EXISTS (
          SELECT 1 FROM public.attendance_sessions s
          WHERE s.id = session_id AND s.status = 'locked'
        )
      )
    )
  );

CREATE POLICY "att_rec_update" ON public.attendance_records FOR UPDATE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND NOT EXISTS (
          SELECT 1 FROM public.attendance_sessions s
          WHERE s.id = session_id AND s.status = 'locked'
        )
      )
    )
  )
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND NOT EXISTS (
          SELECT 1 FROM public.attendance_sessions s
          WHERE s.id = session_id AND s.status = 'locked'
        )
      )
    )
  );

CREATE POLICY "att_rec_delete" ON public.attendance_records FOR DELETE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );
