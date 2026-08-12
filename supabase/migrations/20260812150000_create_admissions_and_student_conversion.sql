-- Migration 019: Admission Applications, Status Workflow, Auto-numbering and Atomic Conversion Function

CREATE TABLE public.admission_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  application_number text NOT NULL,
  applicant_first_name text NOT NULL,
  applicant_middle_name text,
  applicant_last_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  applying_for_class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  guardian_name text NOT NULL,
  guardian_phone text NOT NULL,
  guardian_email text,
  address text,
  city text,
  state text,
  source text,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn', 'converted')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  converted_at timestamptz,
  converted_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admission_applications_school_app_no_unique UNIQUE (school_id, application_number)
);

-- Cross-school composite FK integrity
ALTER TABLE public.admission_applications
  ADD CONSTRAINT adm_app_session_school_fk
  FOREIGN KEY (academic_session_id, school_id)
  REFERENCES public.academic_sessions(id, school_id);

ALTER TABLE public.admission_applications
  ADD CONSTRAINT adm_app_class_school_fk
  FOREIGN KEY (applying_for_class_id, school_id)
  REFERENCES public.classes(id, school_id);

-- Indexes for querying, filtering, and searching admission applications
CREATE INDEX idx_adm_app_school_id ON public.admission_applications(school_id);
CREATE INDEX idx_adm_app_status ON public.admission_applications(school_id, status);
CREATE INDEX idx_adm_app_session ON public.admission_applications(school_id, academic_session_id);
CREATE INDEX idx_adm_app_class ON public.admission_applications(school_id, applying_for_class_id);
CREATE INDEX idx_adm_app_number ON public.admission_applications(school_id, application_number);

COMMENT ON TABLE public.admission_applications IS 'Admission applications workflow entity. Applicant != Enrolled Student.';

-- Enable RLS
ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "admission_applications_select" ON public.admission_applications
  FOR SELECT TO authenticated
  USING (
    school_id = public.get_current_school_id() AND
    public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

CREATE POLICY "admission_applications_insert" ON public.admission_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.get_current_school_id() AND
    public.has_any_role(ARRAY['Super Admin', 'Admin'])
  );

CREATE POLICY "admission_applications_update" ON public.admission_applications
  FOR UPDATE TO authenticated
  USING (
    school_id = public.get_current_school_id() AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin']) OR
      (public.has_role('Principal') AND status IN ('submitted', 'under_review'))
    )
  )
  WITH CHECK (
    school_id = public.get_current_school_id() AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin']) OR
      (public.has_role('Principal') AND status IN ('submitted', 'under_review', 'approved', 'rejected'))
    )
  );

CREATE POLICY "admission_applications_delete" ON public.admission_applications
  FOR DELETE TO authenticated
  USING (
    school_id = public.get_current_school_id() AND
    public.has_any_role(ARRAY['Super Admin', 'Admin'])
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admission_applications TO authenticated;

-- Generator function for unique application number scoped by school and session
CREATE OR REPLACE FUNCTION public.generate_application_number(p_school_id uuid, p_session_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_code text;
  v_year text;
  v_seq integer;
  v_app_no text;
BEGIN
  SELECT code INTO v_school_code FROM public.schools WHERE id = p_school_id;
  IF v_school_code IS NULL THEN
    v_school_code := 'RPS';
  END IF;

  SELECT split_part(name, '-', 1) INTO v_year FROM public.academic_sessions WHERE id = p_session_id;
  IF v_year IS NULL OR v_year = '' THEN
    v_year := to_char(now(), 'YYYY');
  END IF;

  SELECT COALESCE(MAX(CAST(split_part(application_number, '-', 4) AS integer)), 0) + 1
  INTO v_seq
  FROM public.admission_applications
  WHERE school_id = p_school_id
    AND application_number LIKE v_school_code || '-ADM-' || v_year || '-%';

  v_app_no := v_school_code || '-ADM-' || v_year || '-' || lpad(v_seq::text, 4, '0');
  RETURN v_app_no;
END;
$$;

-- Generator function for unique student admission number scoped by school
CREATE OR REPLACE FUNCTION public.generate_admission_number(p_school_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_school_code text;
  v_year text;
  v_seq integer;
  v_adm_no text;
BEGIN
  SELECT code INTO v_school_code FROM public.schools WHERE id = p_school_id;
  IF v_school_code IS NULL THEN
    v_school_code := 'RPS';
  END IF;

  v_year := to_char(now(), 'YYYY');

  SELECT COALESCE(MAX(CAST(split_part(admission_number, '-', 3) AS integer)), 0) + 1
  INTO v_seq
  FROM public.students
  WHERE school_id = p_school_id
    AND admission_number LIKE v_school_code || '-' || v_year || '-%';

  v_adm_no := v_school_code || '-' || v_year || '-' || lpad(v_seq::text, 3, '0');
  RETURN v_adm_no;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_application_number(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_admission_number(uuid) TO authenticated;

-- Atomic function to convert approved application into enrolled student
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

  -- 10. Audit log
  INSERT INTO public.audit_logs (
    school_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    details
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
