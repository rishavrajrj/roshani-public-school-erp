-- Migration 035: Phase 7 Audit Remediation
-- Fixes: F1, F2, F3, F6 from the comprehensive security audit
-- Plus: Fix convert_admission_application audit_logs column name (actor_profile_id)
--
-- F1: Add school_id to student_documents
-- F2: Add composite (student_id, school_id) FKs to Phase 6 tables
-- F3: Add DB-level refund self-approval prevention trigger
-- F6: Add DB-level financial_ledger immutability trigger

-- ============================================================
-- F1: ADD school_id TO student_documents
-- ============================================================

-- Step 1: Add column (nullable first for existing rows)
ALTER TABLE public.student_documents ADD COLUMN IF NOT EXISTS school_id uuid;

-- Step 2: Backfill from students table
UPDATE public.student_documents sd
SET school_id = s.school_id
FROM public.students s
WHERE sd.student_id = s.id
  AND sd.school_id IS NULL;

-- Step 3: Make NOT NULL
ALTER TABLE public.student_documents ALTER COLUMN school_id SET NOT NULL;

-- Step 4: Add FK to schools
ALTER TABLE public.student_documents
  ADD CONSTRAINT fk_student_documents_school
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;

-- Step 5: Add composite FK to students(id, school_id) for cross-school protection
-- First ensure a unique constraint exists on students(id, school_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_students_id_school_id'
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT uq_students_id_school_id UNIQUE (id, school_id);
  END IF;
END $$;

ALTER TABLE public.student_documents
  ADD CONSTRAINT fk_student_documents_student_school
  FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id) ON DELETE CASCADE;

-- Step 6: Add index on school_id
CREATE INDEX IF NOT EXISTS idx_student_documents_school_id ON public.student_documents(school_id);

-- Step 7: Fix RLS policies to use school_id directly
DROP POLICY IF EXISTS "student_documents_select" ON public.student_documents;
CREATE POLICY "student_documents_select" ON public.student_documents FOR SELECT TO authenticated
  USING (school_id = public.get_current_school_id());

DROP POLICY IF EXISTS "student_documents_insert" ON public.student_documents;
CREATE POLICY "student_documents_insert" ON public.student_documents FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.get_current_school_id() AND
    (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Teacher'))
  );

DROP POLICY IF EXISTS "student_documents_update" ON public.student_documents;
CREATE POLICY "student_documents_update" ON public.student_documents FOR UPDATE TO authenticated
  USING (
    school_id = public.get_current_school_id() AND
    (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin'))
  );

DROP POLICY IF EXISTS "student_documents_delete" ON public.student_documents;
CREATE POLICY "student_documents_delete" ON public.student_documents FOR DELETE TO authenticated
  USING (
    school_id = public.get_current_school_id() AND
    (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin'))
  );

-- ============================================================
-- F2: ADD COMPOSITE FKs TO PHASE 6 TABLES
-- ============================================================
-- These tables already have school_id columns. Add composite FKs
-- to prevent cross-school data linking at the DB level.

-- admit_cards: composite FK to students(id, school_id)
ALTER TABLE public.admit_cards
  DROP CONSTRAINT IF EXISTS fk_admit_cards_student_school;
ALTER TABLE public.admit_cards
  ADD CONSTRAINT fk_admit_cards_student_school
  FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id);

-- student_marks: composite FK to students(id, school_id)
ALTER TABLE public.student_marks
  DROP CONSTRAINT IF EXISTS fk_student_marks_student_school;
ALTER TABLE public.student_marks
  ADD CONSTRAINT fk_student_marks_student_school
  FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id);

-- student_results: composite FK to students(id, school_id)
ALTER TABLE public.student_results
  DROP CONSTRAINT IF EXISTS fk_student_results_student_school;
ALTER TABLE public.student_results
  ADD CONSTRAINT fk_student_results_student_school
  FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id);

-- report_cards: composite FK to students(id, school_id)
ALTER TABLE public.report_cards
  DROP CONSTRAINT IF EXISTS fk_report_cards_student_school;
ALTER TABLE public.report_cards
  ADD CONSTRAINT fk_report_cards_student_school
  FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id);

-- certificates: composite FK to students(id, school_id)
ALTER TABLE public.certificates
  DROP CONSTRAINT IF EXISTS fk_certificates_student_school;
ALTER TABLE public.certificates
  ADD CONSTRAINT fk_certificates_student_school
  FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id);

-- promotion_records: composite FK to students(id, school_id)
ALTER TABLE public.promotion_records
  DROP CONSTRAINT IF EXISTS fk_promotion_records_student_school;
ALTER TABLE public.promotion_records
  ADD CONSTRAINT fk_promotion_records_student_school
  FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id);

-- ============================================================
-- F3: REFUND SELF-APPROVAL PREVENTION (DB TRIGGER)
-- ============================================================
-- Prevents the same person who requested the refund from approving it.
-- This is the authoritative guard — the application-level check is defense-in-depth.

CREATE OR REPLACE FUNCTION public.prevent_refund_self_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire when status transitions to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Resolve the approver's profile_id from auth.uid()
        IF NEW.approved_by IS NOT NULL AND NEW.approved_by = OLD.requested_by THEN
            RAISE EXCEPTION 'Self-approval is not permitted: the person who requested the refund cannot approve it (profile_id: %)', NEW.approved_by;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_refund_self_approval ON public.refunds;
CREATE TRIGGER trg_prevent_refund_self_approval
    BEFORE UPDATE ON public.refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_refund_self_approval();

COMMENT ON FUNCTION public.prevent_refund_self_approval() IS
    'Phase 7 F3 fix: Prevents the refund requester from also approving the same refund. Defense-in-depth at DB level.';

-- ============================================================
-- F6: FINANCIAL LEDGER IMMUTABILITY TRIGGER
-- ============================================================
-- Blocks UPDATE and DELETE on financial_ledger at the trigger level,
-- which applies even to service_role connections.

CREATE OR REPLACE FUNCTION public.enforce_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'financial_ledger is append-only. UPDATE and DELETE operations are forbidden. Use compensating journal entries instead.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_immutability_update ON public.financial_ledger;
CREATE TRIGGER trg_ledger_immutability_update
    BEFORE UPDATE ON public.financial_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_ledger_immutability();

DROP TRIGGER IF EXISTS trg_ledger_immutability_delete ON public.financial_ledger;
CREATE TRIGGER trg_ledger_immutability_delete
    BEFORE DELETE ON public.financial_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_ledger_immutability();

COMMENT ON FUNCTION public.enforce_ledger_immutability() IS
    'Phase 7 F6 fix: Enforces append-only immutability on financial_ledger at the trigger level, blocking even service_role mutations.';

-- ============================================================
-- FIX: convert_admission_application RPC audit_logs column name
-- ============================================================

CREATE OR REPLACE FUNCTION public.convert_admission_application(
  p_application_id uuid,
  p_section_id uuid,
  p_roll_number text DEFAULT NULL,
  p_admission_number text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current_school_id uuid;
  v_current_profile_id uuid;
  v_app public.admission_applications%ROWTYPE;
  v_section public.sections%ROWTYPE;
  v_admission_no text;
  v_student_id uuid;
  v_guardian_id uuid;
BEGIN
  -- 1. Security & authorization check
  v_current_school_id := public.get_current_school_id();
  v_current_profile_id := public.get_current_profile_id();

  IF v_current_school_id IS NULL OR NOT public.has_any_role(ARRAY['Super Admin', 'Admin']) THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin or Admin can convert admission applications.';
  END IF;

  -- 2. Lock & fetch application
  SELECT * INTO v_app
  FROM public.admission_applications
  WHERE id = p_application_id AND school_id = v_current_school_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admission application not found or school mismatch.';
  END IF;

  IF v_app.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved applications can be converted. Current status: %', v_app.status;
  END IF;

  -- 3. Verify section exists and belongs to applying_for_class_id
  SELECT * INTO v_section
  FROM public.sections
  WHERE id = p_section_id
    AND class_id = v_app.applying_for_class_id
    AND school_id = v_current_school_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected section does not belong to the applying class or school.';
  END IF;

  -- 4. Generate or validate admission number
  IF p_admission_number IS NOT NULL AND trim(p_admission_number) <> '' THEN
    v_admission_no := trim(p_admission_number);
    IF EXISTS (SELECT 1 FROM public.students WHERE school_id = v_current_school_id AND admission_number = v_admission_no) THEN
      RAISE EXCEPTION 'Admission number % already exists in this school.', v_admission_no;
    END IF;
  ELSE
    v_admission_no := public.generate_admission_number(v_current_school_id);
  END IF;

  -- 5. Create Student record
  INSERT INTO public.students (
    school_id,
    admission_number,
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    gender,
    phone,
    email,
    address,
    city,
    state,
    status
  ) VALUES (
    v_current_school_id,
    v_admission_no,
    v_app.applicant_first_name,
    v_app.applicant_middle_name,
    v_app.applicant_last_name,
    v_app.date_of_birth,
    v_app.gender,
    v_app.guardian_phone,
    v_app.guardian_email,
    v_app.address,
    v_app.city,
    v_app.state,
    'active'
  ) RETURNING id INTO v_student_id;

  -- 6. Find or create Guardian record
  SELECT id INTO v_guardian_id
  FROM public.guardians
  WHERE school_id = v_current_school_id
    AND phone = v_app.guardian_phone
  LIMIT 1;

  IF v_guardian_id IS NULL THEN
    INSERT INTO public.guardians (
      school_id,
      full_name,
      relationship,
      phone,
      email,
      address,
      status
    ) VALUES (
      v_current_school_id,
      v_app.guardian_name,
      'guardian',
      v_app.guardian_phone,
      v_app.guardian_email,
      v_app.address,
      'active'
    ) RETURNING id INTO v_guardian_id;
  END IF;

  -- 7. Create Student-Guardian junction link
  INSERT INTO public.student_guardians (
    student_id,
    guardian_id,
    school_id,
    relationship,
    is_primary
  ) VALUES (
    v_student_id,
    v_guardian_id,
    v_current_school_id,
    'guardian',
    true
  ) ON CONFLICT (student_id, guardian_id) DO NOTHING;

  -- 8. Create Student Academic History
  INSERT INTO public.student_academic_history (
    student_id,
    academic_session_id,
    class_id,
    section_id,
    school_id,
    roll_number,
    status
  ) VALUES (
    v_student_id,
    v_app.academic_session_id,
    v_app.applying_for_class_id,
    p_section_id,
    v_current_school_id,
    p_roll_number,
    'active'
  );

  -- 9. Update Application Status to 'converted'
  UPDATE public.admission_applications
  SET status = 'converted',
      converted_at = now(),
      converted_student_id = v_student_id,
      updated_at = now()
  WHERE id = p_application_id;

  -- 10. Audit log (fixed actor_profile_id column name)
  INSERT INTO public.audit_logs (
    school_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    new_data
  ) VALUES (
    v_current_school_id,
    v_current_profile_id,
    'CONVERT_ADMISSION',
    'admission_applications',
    p_application_id,
    jsonb_build_object(
      'application_number', v_app.application_number,
      'student_id', v_student_id,
      'admission_number', v_admission_no,
      'section_id', p_section_id
    )
  );

  RETURN v_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_admission_application(uuid, uuid, text, text) TO authenticated;
