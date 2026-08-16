-- ==============================================================================
-- Roshani Public School ERP - Phase 1 Security Hardening & Tenant Isolation Migration
-- ==============================================================================
-- 1. Hardens storage.objects RLS policies for tenant-isolated student documents.
-- 2. Enforces DB-level immutability on audit_logs (blocks UPDATE and DELETE).
-- 3. Ensures strict multi-tenant integrity across all shared tables.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HARDEN STORAGE OBJECTS RLS POLICIES (student-documents bucket)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "student_docs_objects_select" ON storage.objects;
CREATE POLICY "student_docs_objects_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents' AND (
      public.has_role('Super Admin') OR
      (
        public.has_any_role(ARRAY['Admin', 'Principal']) AND
        (storage.foldername(name))[1] IN (
          SELECT s.id::text FROM public.students s
          WHERE s.school_id = public.get_current_school_id()
        )
      ) OR
      (
        (storage.foldername(name))[1] IN (
          SELECT s.id::text FROM public.students s
          WHERE s.school_id = public.get_current_school_id()
            AND (
              public.is_guardian_of_student(s.id) OR
              (s.profile_id IS NOT NULL AND s.profile_id = public.get_current_profile_id() AND public.has_role('Student'))
            )
        )
      )
    )
  );

DROP POLICY IF EXISTS "student_docs_objects_insert" ON storage.objects;
CREATE POLICY "student_docs_objects_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents' AND (
      public.has_role('Super Admin') OR
      (
        public.has_any_role(ARRAY['Admin', 'Principal']) AND
        (storage.foldername(name))[1] IN (
          SELECT s.id::text FROM public.students s
          WHERE s.school_id = public.get_current_school_id()
        )
      )
    )
  );

DROP POLICY IF EXISTS "student_docs_objects_update" ON storage.objects;
CREATE POLICY "student_docs_objects_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'student-documents' AND (
      public.has_role('Super Admin') OR
      (
        public.has_any_role(ARRAY['Admin', 'Principal']) AND
        (storage.foldername(name))[1] IN (
          SELECT s.id::text FROM public.students s
          WHERE s.school_id = public.get_current_school_id()
        )
      )
    )
  );

DROP POLICY IF EXISTS "student_docs_objects_delete" ON storage.objects;
CREATE POLICY "student_docs_objects_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-documents' AND (
      public.has_role('Super Admin') OR
      (
        public.has_any_role(ARRAY['Admin', 'Principal']) AND
        (storage.foldername(name))[1] IN (
          SELECT s.id::text FROM public.students s
          WHERE s.school_id = public.get_current_school_id()
        )
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 2. DB-LEVEL IMMUTABILITY TRIGGER ON audit_logs
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_audit_log_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs table is strictly append-only. UPDATE and DELETE operations are prohibited.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutability_update ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutability_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_audit_log_immutability();

DROP TRIGGER IF EXISTS trg_audit_logs_immutability_delete ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutability_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_audit_log_immutability();

COMMENT ON FUNCTION public.enforce_audit_log_immutability() IS
  'Phase 1 Security Hardening: Enforces append-only immutability on audit_logs at DB engine level.';

-- ------------------------------------------------------------------------------
-- 3. AUDIT LOGS INSERT & SELECT HARDENING
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      public.has_role('Super Admin') OR
      (
        school_id = public.get_current_school_id() AND
        public.has_any_role(ARRAY['Admin', 'Principal'])
      )
    )
  );

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (school_id IS NULL OR school_id = public.get_current_school_id() OR public.has_role('Super Admin'))
  );
