-- Migration 013: RLS Policies for guardians, students, student_guardians, student_academic_history, student_documents, audit_logs

CREATE POLICY "guardians_select" ON public.guardians FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND (public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR profile_id = (SELECT public.get_current_profile_id())));
CREATE POLICY "guardians_insert" ON public.guardians FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "guardians_update" ON public.guardians FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "guardians_delete" ON public.guardians FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND (public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR public.is_guardian_of_student(id) OR (profile_id IS NOT NULL AND profile_id = (SELECT public.get_current_profile_id()) AND public.has_role('Student'))));
CREATE POLICY "students_insert" ON public.students FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "students_update" ON public.students FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "students_delete" ON public.students FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "student_guardians_select" ON public.student_guardians FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND (public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR guardian_id IN (SELECT g.id FROM public.guardians g WHERE g.profile_id = (SELECT public.get_current_profile_id())) OR student_id IN (SELECT s.id FROM public.students s WHERE s.profile_id = (SELECT public.get_current_profile_id()))));
CREATE POLICY "student_guardians_insert" ON public.student_guardians FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "student_guardians_update" ON public.student_guardians FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "student_guardians_delete" ON public.student_guardians FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "sah_select" ON public.student_academic_history FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND (public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR public.is_guardian_of_student(student_id) OR (student_id IN (SELECT s.id FROM public.students s WHERE s.profile_id = (SELECT public.get_current_profile_id())) AND public.has_role('Student'))));
CREATE POLICY "sah_insert" ON public.student_academic_history FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "sah_update" ON public.student_academic_history FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "sah_delete" ON public.student_academic_history FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "student_documents_select" ON public.student_documents FOR SELECT TO authenticated
  USING (public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR public.is_guardian_of_student(student_id) OR (student_id IN (SELECT s.id FROM public.students s WHERE s.profile_id = (SELECT public.get_current_profile_id())) AND public.has_role('Student')));
CREATE POLICY "student_documents_insert" ON public.student_documents FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "student_documents_update" ON public.student_documents FOR UPDATE TO authenticated
  USING (public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "student_documents_delete" ON public.student_documents FOR DELETE TO authenticated
  USING (public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']));
