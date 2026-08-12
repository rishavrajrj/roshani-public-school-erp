-- Migration 012: RLS Policies for subjects, class_subjects, profiles, roles, user_roles

CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal', 'Teacher']));
CREATE POLICY "subjects_insert" ON public.subjects FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "subjects_update" ON public.subjects FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "subjects_delete" ON public.subjects FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "class_subjects_select" ON public.class_subjects FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal', 'Teacher']));
CREATE POLICY "class_subjects_insert" ON public.class_subjects FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "class_subjects_update" ON public.class_subjects FOR UPDATE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']))
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "class_subjects_delete" ON public.class_subjects FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()) OR (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = (SELECT auth.uid()) OR public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()) OR (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin'])))
  WITH CHECK (auth_user_id = (SELECT auth.uid()) OR (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin'])));

CREATE POLICY "roles_select" ON public.roles FOR SELECT TO authenticated
  USING (public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']));

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']));
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()) AND public.has_any_role(ARRAY['Super Admin', 'Admin']));
