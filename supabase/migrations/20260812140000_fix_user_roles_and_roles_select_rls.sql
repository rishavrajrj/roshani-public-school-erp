-- ============================================================
-- Fix user_roles and roles SELECT RLS Policies
-- Allows authenticated users to resolve their own assigned roles
-- ============================================================

-- 1. Allow authenticated users to read role definitions (reference data)
DROP POLICY IF EXISTS roles_select ON roles;

CREATE POLICY roles_select ON roles
  FOR SELECT TO authenticated
  USING (true);

-- 2. Allow authenticated users to read their own assigned roles or admin/principal to read school roles
DROP POLICY IF EXISTS user_roles_select ON user_roles;

CREATE POLICY user_roles_select ON user_roles
  FOR SELECT TO authenticated
  USING (
    profile_id IN (SELECT p.id FROM profiles p WHERE p.auth_user_id = (SELECT auth.uid()))
    OR (
      school_id = (SELECT get_current_school_id())
      AND has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
    )
  );
