-- Migration 011: RLS Policies for schools, school_settings, academic_sessions, classes, sections

CREATE POLICY "schools_select" ON public.schools FOR SELECT TO authenticated
  USING (id = (SELECT public.get_current_school_id()));
CREATE POLICY "schools_insert" ON public.schools FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "schools_update" ON public.schools FOR UPDATE TO authenticated
  USING (id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "school_settings_select" ON public.school_settings FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()));
CREATE POLICY "school_settings_insert" ON public.school_settings FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "school_settings_update" ON public.school_settings FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "school_settings_delete" ON public.school_settings FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "academic_sessions_select" ON public.academic_sessions FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()));
CREATE POLICY "academic_sessions_insert" ON public.academic_sessions FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "academic_sessions_update" ON public.academic_sessions FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "academic_sessions_delete" ON public.academic_sessions FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "classes_select" ON public.classes FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()));
CREATE POLICY "classes_insert" ON public.classes FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "classes_update" ON public.classes FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "classes_delete" ON public.classes FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "sections_select" ON public.sections FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()));
CREATE POLICY "sections_insert" ON public.sections FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "sections_update" ON public.sections FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "sections_delete" ON public.sections FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
