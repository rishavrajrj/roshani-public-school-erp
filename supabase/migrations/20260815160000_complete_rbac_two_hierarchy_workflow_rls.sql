-- ==============================================================================
-- Migration: Complete RBAC + Two-Hierarchy + Workflow + RLS Architecture
-- ==============================================================================
-- 1. Separates System Authority (Super Admin -> Admin) from School Authority
--    (Principal -> Vice Principal / Admin -> Coordinator -> Teacher -> Student).
-- 2. Workflow states on fee_structures: draft -> submitted -> approved -> active.
-- 3. Workflow states on certificates: DRAFT -> SUBMITTED -> APPROVED -> ISSUED -> LOCKED.
-- 4. Scoped teacher assignments (optional subject_id).
-- 5. Hardened RLS policies for Role + Permission + Scope + Workflow State.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- A. FEE STRUCTURES WORKFLOW ENHANCEMENT
-- ------------------------------------------------------------------------------
ALTER TABLE public.fee_structures
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'submitted', 'under_review', 'rejected', 'approved', 'active', 'archived')),
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ------------------------------------------------------------------------------
-- B. CERTIFICATES WORKFLOW ENHANCEMENT
-- ------------------------------------------------------------------------------
-- Update status check constraint to include full workflow
ALTER TABLE public.certificates
  DROP CONSTRAINT IF EXISTS certificates_status_check;

ALTER TABLE public.certificates
  ADD CONSTRAINT certificates_status_check
  CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'ISSUED', 'LOCKED', 'REVOKED'));

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- ------------------------------------------------------------------------------
-- C. TEACHER ASSIGNMENTS SUBJECT SCOPING
-- ------------------------------------------------------------------------------
ALTER TABLE public.teacher_assignments
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject
  ON public.teacher_assignments (school_id, academic_session_id, teacher_profile_id, class_id, section_id, subject_id, active);

-- ------------------------------------------------------------------------------
-- D. POSTGRESQL HELPER FUNCTIONS FOR SCOPE & WORKFLOW
-- ------------------------------------------------------------------------------

-- Helper: Check if a teacher is assigned to a section AND optionally a subject
CREATE OR REPLACE FUNCTION public.is_assigned_teacher_of_subject(
  p_teacher_profile_id UUID,
  p_class_id UUID,
  p_section_id UUID,
  p_subject_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_assignments ta
    WHERE ta.teacher_profile_id = p_teacher_profile_id
      AND ta.class_id = p_class_id
      AND (p_section_id IS NULL OR ta.section_id = p_section_id)
      AND (ta.subject_id IS NULL OR p_subject_id IS NULL OR ta.subject_id = p_subject_id)
      AND ta.active = TRUE
  );
$$;

-- Helper: Check if fee structure is mutable (only draft, submitted, under_review or rejected)
CREATE OR REPLACE FUNCTION public.is_fee_structure_mutable(p_fee_structure_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fee_structures
    WHERE id = p_fee_structure_id
      AND status IN ('draft', 'submitted', 'under_review', 'rejected')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_assigned_teacher_of_subject(UUID, UUID, UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_fee_structure_mutable(UUID) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- E. HARDENED ROW LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------

-- 1. FEE STRUCTURES POLICIES
DROP POLICY IF EXISTS "Fee structures manageable by Admin/Principal" ON public.fee_structures;
DROP POLICY IF EXISTS "Fee structures viewable by authenticated users" ON public.fee_structures;
DROP POLICY IF EXISTS "fee_struct_select" ON public.fee_structures;
DROP POLICY IF EXISTS "fee_struct_all_admin" ON public.fee_structures;

-- Viewable: Admin, Super Admin, Principal view all. Accountant views approved/active.
CREATE POLICY "fee_structures_select_policy"
  ON public.fee_structures FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR
      (public.has_role('Accountant') AND status IN ('approved', 'active')) OR
      (public.has_any_role(ARRAY['Teacher', 'Student', 'Parent']) AND status = 'active')
    )
  );

-- Insert: Super Admin, Admin can create draft fee structures
CREATE POLICY "fee_structures_insert_policy"
  ON public.fee_structures FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

-- Update: Super Admin, Admin, Principal can update subject to workflow constraints
CREATE POLICY "fee_structures_update_policy"
  ON public.fee_structures FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

-- Delete: Only draft or rejected fee structures can be removed
CREATE POLICY "fee_structures_delete_policy"
  ON public.fee_structures FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    public.has_any_role(ARRAY['Super Admin', 'Admin']) AND
    status IN ('draft', 'rejected')
  );

-- 2. STUDENT MARKS POLICIES
DROP POLICY IF EXISTS "Student marks viewable by Admin/Principal/Teacher" ON public.student_marks;
DROP POLICY IF EXISTS "Student marks manageable by Admin/Principal/Teacher" ON public.student_marks;

CREATE POLICY "student_marks_select_policy"
  ON public.student_marks FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR
      (
        public.has_role('Teacher') AND
        public.is_assigned_teacher_of_subject(public.get_current_profile_id(), class_id, section_id, subject_id)
      )
    )
  );

CREATE POLICY "student_marks_insert_policy"
  ON public.student_marks FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR
      (
        public.has_role('Teacher') AND
        public.is_assigned_teacher_of_subject(public.get_current_profile_id(), class_id, section_id, subject_id)
      )
    )
  );

CREATE POLICY "student_marks_update_policy"
  ON public.student_marks FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR
      (
        public.has_role('Teacher') AND
        status IN ('draft', 'submitted') AND
        public.is_assigned_teacher_of_subject(public.get_current_profile_id(), class_id, section_id, subject_id)
      )
    )
  );

-- 3. STUDENT RESULTS POLICIES
DROP POLICY IF EXISTS "Student results viewable by Admin/Principal/Teacher/Accountant" ON public.student_results;
DROP POLICY IF EXISTS "Student results viewable by Student for own published result" ON public.student_results;
DROP POLICY IF EXISTS "Student results viewable by Parent for child published result" ON public.student_results;
DROP POLICY IF EXISTS "Student results manageable by Admin/Principal" ON public.student_results;

CREATE POLICY "student_results_select_policy"
  ON public.student_results FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal', 'Accountant']) OR
      (
        public.has_role('Teacher') AND
        EXISTS (
          SELECT 1 FROM public.teacher_assignments ta
          WHERE ta.teacher_profile_id = public.get_current_profile_id()
            AND ta.class_id = student_results.class_id
            AND (ta.section_id IS NULL OR ta.section_id = student_results.section_id)
            AND ta.active = TRUE
        )
      ) OR
      (
        public.has_role('Student') AND
        status = 'published' AND
        student_id IN (
          SELECT id FROM public.students WHERE profile_id = public.get_current_profile_id()
        )
      ) OR
      (
        public.has_role('Parent') AND
        status = 'published' AND
        public.is_guardian_of_student(student_id)
      )
    )
  );

CREATE POLICY "student_results_manage_policy"
  ON public.student_results FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

-- 4. CERTIFICATES POLICIES
DROP POLICY IF EXISTS "Certificates viewable by Admin/Principal/Teacher/Accountant" ON public.certificates;
DROP POLICY IF EXISTS "Certificates viewable by Student for own issued certificate" ON public.certificates;
DROP POLICY IF EXISTS "Certificates viewable by Parent for child issued certificate" ON public.certificates;
DROP POLICY IF EXISTS "Certificates manageable by Admin/Principal" ON public.certificates;

CREATE POLICY "certificates_select_policy"
  ON public.certificates FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR
      (
        public.has_role('Student') AND
        status IN ('ISSUED', 'LOCKED') AND
        student_id IN (
          SELECT id FROM public.students WHERE profile_id = public.get_current_profile_id()
        )
      ) OR
      (
        public.has_role('Parent') AND
        status IN ('ISSUED', 'LOCKED') AND
        public.is_guardian_of_student(student_id)
      )
    )
  );

CREATE POLICY "certificates_manage_policy"
  ON public.certificates FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

-- 5. AUDIT LOGS IMMUTABILITY
-- Audit logs should only allow INSERT and SELECT, never UPDATE or DELETE
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;

CREATE POLICY "audit_logs_insert_policy"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id()
  );

CREATE POLICY "audit_logs_select_policy"
  ON public.audit_logs FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    school_id = public.get_current_school_id() AND
    public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );
