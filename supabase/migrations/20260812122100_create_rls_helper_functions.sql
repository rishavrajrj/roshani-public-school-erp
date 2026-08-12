-- Migration 010: RLS Helper Functions

CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = (SELECT auth.uid()) LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.profiles WHERE auth_user_id = (SELECT auth.uid()) LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    JOIN public.profiles p ON p.id = ur.profile_id
    WHERE p.auth_user_id = (SELECT auth.uid())
      AND ur.school_id = p.school_id
      AND r.name = role_name
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(role_names text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    JOIN public.profiles p ON p.id = ur.profile_id
    WHERE p.auth_user_id = (SELECT auth.uid())
      AND ur.school_id = p.school_id
      AND r.name = ANY(role_names)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_guardian_of_student(p_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_guardians sg
    JOIN public.guardians g ON g.id = sg.guardian_id
    WHERE sg.student_id = p_student_id
      AND g.profile_id = (SELECT public.get_current_profile_id())
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_current_profile_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_current_school_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(text[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_guardian_of_student(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_current_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_guardian_of_student(uuid) TO authenticated;
