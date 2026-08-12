-- Migration 015: Add profile_id to students + student self-access RLS

ALTER TABLE public.students
  ADD COLUMN profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students (profile_id);

COMMENT ON COLUMN public.students.profile_id IS 'Links student to their auth profile for self-access. NULL until student has a login.';

DROP POLICY IF EXISTS "students_select" ON public.students;
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR public.is_guardian_of_student(id)
      OR (
        profile_id IS NOT NULL
        AND profile_id = (SELECT public.get_current_profile_id())
        AND public.has_role('Student')
      )
    )
  );

DROP POLICY IF EXISTS "sah_select" ON public.student_academic_history;
CREATE POLICY "sah_select" ON public.student_academic_history FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR public.is_guardian_of_student(student_id)
      OR (
        student_id IN (SELECT s.id FROM public.students s WHERE s.profile_id = (SELECT public.get_current_profile_id()))
        AND public.has_role('Student')
      )
    )
  );

DROP POLICY IF EXISTS "student_documents_select" ON public.student_documents;
CREATE POLICY "student_documents_select" ON public.student_documents FOR SELECT TO authenticated
  USING (
    public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
    OR public.is_guardian_of_student(student_id)
    OR (
      student_id IN (SELECT s.id FROM public.students s WHERE s.profile_id = (SELECT public.get_current_profile_id()))
      AND public.has_role('Student')
    )
  );

DROP POLICY IF EXISTS "student_guardians_select" ON public.student_guardians;
CREATE POLICY "student_guardians_select" ON public.student_guardians FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR guardian_id IN (SELECT g.id FROM public.guardians g WHERE g.profile_id = (SELECT public.get_current_profile_id()))
      OR student_id IN (SELECT s.id FROM public.students s WHERE s.profile_id = (SELECT public.get_current_profile_id()))
    )
  );
