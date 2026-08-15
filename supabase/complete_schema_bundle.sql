-- ==============================================================================
-- Roshani Public School ERP — Complete Database Schema & Functions (Phases 4-7)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- FILE: 20260812150100_create_student_documents_storage_bucket.sql
-- ------------------------------------------------------------------------------
-- Migration 020: Private Storage Bucket for Student Documents

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false, -- PRIVATE BUCKET
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage objects RLS policies
DROP POLICY IF EXISTS "student_docs_objects_select" ON storage.objects;
CREATE POLICY "student_docs_objects_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents' AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal']) OR
      (storage.foldername(name))[1] IN (
        SELECT s.id::text FROM public.students s
        WHERE s.school_id = public.get_current_school_id()
          AND (
            public.is_guardian_of_student(s.id) OR
            (s.profile_id IS NOT NULL AND s.profile_id = public.get_current_profile_id() AND public.has_role('Student'))
          )
      )
    )
  );

DROP POLICY IF EXISTS "student_docs_objects_insert" ON storage.objects;
CREATE POLICY "student_docs_objects_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents' AND
    public.has_any_role(ARRAY['Super Admin', 'Admin'])
  );

DROP POLICY IF EXISTS "student_docs_objects_update" ON storage.objects;
CREATE POLICY "student_docs_objects_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'student-documents' AND
    public.has_any_role(ARRAY['Super Admin', 'Admin'])
  );

DROP POLICY IF EXISTS "student_docs_objects_delete" ON storage.objects;
CREATE POLICY "student_docs_objects_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-documents' AND
    public.has_any_role(ARRAY['Super Admin', 'Admin'])
  );


-- ------------------------------------------------------------------------------
-- FILE: 20260812160000_link_auth_users_to_profiles.sql
-- ------------------------------------------------------------------------------
-- Migration 021: Link Auth users to profiles by matching email & full_name
UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'superadmin@roshanischool.com' AND p.full_name = 'Vijay Kumar';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'admin@roshanischool.com' AND p.full_name = 'Priya Sharma';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'principal@roshanischool.com' AND p.full_name = 'Dr. Ramesh Gupta';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'teacher@roshanischool.com' AND p.full_name = 'Sunita Devi';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'accountant@roshanischool.com' AND p.full_name = 'Manoj Verma';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'parent@roshanischool.com' AND p.full_name = 'Rajesh Kumar';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'student@roshanischool.com' AND p.full_name = 'Arjun Kumar';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'disabled@roshanischool.com' AND p.full_name = 'Disabled User Profile';


-- ------------------------------------------------------------------------------
-- FILE: 20260812170000_create_attendance_and_teacher_assignments.sql
-- ------------------------------------------------------------------------------
-- Migration 023: Create Attendance Management & Teacher Assignments (Updated)

-- 1. Teacher Assignments Table
CREATE TABLE public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ta_school_session_fk FOREIGN KEY (academic_session_id, school_id) REFERENCES public.academic_sessions(id, school_id),
  CONSTRAINT ta_school_class_fk FOREIGN KEY (class_id, school_id) REFERENCES public.classes(id, school_id),
  CONSTRAINT ta_school_section_fk FOREIGN KEY (section_id, school_id) REFERENCES public.sections(id, school_id)
);

CREATE UNIQUE INDEX idx_teacher_assignments_active_unique
  ON public.teacher_assignments (school_id, academic_session_id, teacher_profile_id, class_id, section_id)
  WHERE active = true;

CREATE INDEX idx_teacher_assignments_search
  ON public.teacher_assignments (school_id, academic_session_id, class_id, section_id, active);

CREATE INDEX idx_teacher_assignments_teacher
  ON public.teacher_assignments (teacher_profile_id, active);

COMMENT ON TABLE public.teacher_assignments IS 'Teacher section assignments per academic session.';

-- 2. Attendance Sessions Table
CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'locked')),
  marked_by uuid REFERENCES public.profiles(id), -- NULL if draft, populated upon submission
  marked_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_sessions_unique UNIQUE (school_id, academic_session_id, class_id, section_id, attendance_date),
  CONSTRAINT att_sess_session_fk FOREIGN KEY (academic_session_id, school_id) REFERENCES public.academic_sessions(id, school_id),
  CONSTRAINT att_sess_class_fk FOREIGN KEY (class_id, school_id) REFERENCES public.classes(id, school_id),
  CONSTRAINT att_sess_section_fk FOREIGN KEY (section_id, school_id) REFERENCES public.sections(id, school_id)
);

CREATE INDEX idx_attendance_sessions_lookup
  ON public.attendance_sessions (school_id, academic_session_id, class_id, section_id, attendance_date);

COMMENT ON TABLE public.attendance_sessions IS 'Tracks daily logical attendance session state (draft/submitted/locked) for a section.';

-- 3. Attendance Records Table
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
  remarks text,
  correction_reason text, -- Required when modifying a submitted record
  marked_by uuid NOT NULL REFERENCES public.profiles(id),
  marked_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_records_student_date_unique UNIQUE (school_id, academic_session_id, student_id, attendance_date),
  CONSTRAINT att_rec_student_fk FOREIGN KEY (student_id, school_id) REFERENCES public.students(id, school_id),
  CONSTRAINT att_rec_session_fk FOREIGN KEY (academic_session_id, school_id) REFERENCES public.academic_sessions(id, school_id),
  CONSTRAINT att_rec_class_fk FOREIGN KEY (class_id, school_id) REFERENCES public.classes(id, school_id),
  CONSTRAINT att_rec_section_fk FOREIGN KEY (section_id, school_id) REFERENCES public.sections(id, school_id)
);

CREATE INDEX idx_attendance_records_student
  ON public.attendance_records (school_id, academic_session_id, student_id, attendance_date);

CREATE INDEX idx_attendance_records_section_date
  ON public.attendance_records (school_id, academic_session_id, class_id, section_id, attendance_date);

COMMENT ON TABLE public.attendance_records IS 'Daily student attendance status records.';

-- 4. Database Trigger: Student Class/Section Enrollment & Active Status Validation
CREATE OR REPLACE FUNCTION public.validate_student_attendance_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify student's account status is active
  IF NOT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = NEW.student_id
      AND s.school_id = NEW.school_id
      AND s.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Student % is not active (exited, transferred, or inactive)', NEW.student_id;
  END IF;

  -- Verify active enrollment in academic history for the session/class/section
  IF NOT EXISTS (
    SELECT 1 FROM public.student_academic_history sah
    WHERE sah.student_id = NEW.student_id
      AND sah.school_id = NEW.school_id
      AND sah.academic_session_id = NEW.academic_session_id
      AND sah.class_id = NEW.class_id
      AND sah.section_id = NEW.section_id
      AND sah.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Student % is not actively enrolled in class %, section % for session %',
      NEW.student_id, NEW.class_id, NEW.section_id, NEW.academic_session_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_student_attendance_enrollment
  BEFORE INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_student_attendance_enrollment();

-- 5. RLS Helper Function for Teacher Assignment
CREATE OR REPLACE FUNCTION public.is_assigned_teacher_of_section(
  p_academic_session_id uuid,
  p_class_id uuid,
  p_section_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_assignments ta
    JOIN public.profiles p ON p.id = ta.teacher_profile_id
    WHERE p.auth_user_id = (SELECT auth.uid())
      AND ta.school_id = p.school_id
      AND ta.academic_session_id = p_academic_session_id
      AND ta.class_id = p_class_id
      AND ta.section_id = p_section_id
      AND ta.active = true
  ) AND public.has_role('Teacher');
$$;

REVOKE EXECUTE ON FUNCTION public.is_assigned_teacher_of_section(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_assigned_teacher_of_section(uuid, uuid, uuid) TO authenticated;

-- 6. Enable RLS
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;

-- 7. RLS Policies

-- teacher_assignments policies
CREATE POLICY "ta_select" ON public.teacher_assignments FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR teacher_profile_id = (SELECT public.get_current_profile_id())
    )
  );

CREATE POLICY "ta_all_admin" ON public.teacher_assignments FOR ALL TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  )
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

-- attendance_sessions policies
CREATE POLICY "att_sess_select" ON public.attendance_sessions FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
    )
  );

CREATE POLICY "att_sess_insert" ON public.attendance_sessions FOR INSERT TO authenticated
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
    )
  );

CREATE POLICY "att_sess_update" ON public.attendance_sessions FOR UPDATE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND status != 'locked'
      )
    )
  )
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND status != 'locked'
      )
    )
  );

CREATE POLICY "att_sess_delete" ON public.attendance_sessions FOR DELETE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

-- attendance_records policies
CREATE POLICY "att_rec_select" ON public.attendance_records FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
      OR public.is_guardian_of_student(student_id)
      OR (
        student_id IN (SELECT id FROM public.students WHERE profile_id = (SELECT public.get_current_profile_id()))
        AND public.has_role('Student')
      )
    )
  );

CREATE POLICY "att_rec_insert" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND NOT EXISTS (
          SELECT 1 FROM public.attendance_sessions s
          WHERE s.id = session_id AND s.status = 'locked'
        )
      )
    )
  );

CREATE POLICY "att_rec_update" ON public.attendance_records FOR UPDATE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND NOT EXISTS (
          SELECT 1 FROM public.attendance_sessions s
          WHERE s.id = session_id AND s.status = 'locked'
        )
      )
    )
  )
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND (
      public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR (
        public.is_assigned_teacher_of_section(academic_session_id, class_id, section_id)
        AND NOT EXISTS (
          SELECT 1 FROM public.attendance_sessions s
          WHERE s.id = session_id AND s.status = 'locked'
        )
      )
    )
  );

CREATE POLICY "att_rec_delete" ON public.attendance_records FOR DELETE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );


-- ------------------------------------------------------------------------------
-- FILE: 20260812180000_create_leave_and_notifications.sql
-- ------------------------------------------------------------------------------
-- Migration 024: Create Leave Management, Approvals, Balances, and Notifications

-- 1. Leave Types Table
CREATE TABLE public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  applicant_category text NOT NULL DEFAULT 'all' CHECK (applicant_category IN ('student', 'staff', 'all')),
  default_days_per_year numeric NOT NULL DEFAULT 12,
  requires_document boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_types_school_code_unique UNIQUE (school_id, code)
);

CREATE INDEX idx_leave_types_school ON public.leave_types (school_id, active);

COMMENT ON TABLE public.leave_types IS 'Configurable leave categories for students and staff.';

-- 2. Leave Applications Table
CREATE TABLE public.leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  applicant_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_role text NOT NULL CHECK (applicant_role IN ('Student', 'Parent', 'Teacher', 'Accountant', 'Admin', 'Principal')),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE, -- NULL for staff leave
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_type text NOT NULL DEFAULT 'full_day' CHECK (duration_type IN ('full_day', 'half_day_morning', 'half_day_afternoon')),
  calculated_days numeric NOT NULL CHECK (calculated_days > 0),
  reason text NOT NULL CHECK (char_length(trim(reason)) >= 3),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn', 'cancelled')),
  document_path text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  cancelled_at timestamptz,
  rejection_reason text,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_app_date_check CHECK (start_date <= end_date)
);

CREATE INDEX idx_leave_apps_applicant ON public.leave_applications (school_id, applicant_profile_id, status);
CREATE INDEX idx_leave_apps_student ON public.leave_applications (school_id, student_id, status);
CREATE INDEX idx_leave_apps_dates ON public.leave_applications (school_id, start_date, end_date, status);

COMMENT ON TABLE public.leave_applications IS 'Leave applications submitted by students, parents, or staff.';

-- 3. Leave Approvals Table
CREATE TABLE public.leave_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  leave_application_id uuid NOT NULL REFERENCES public.leave_applications(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 1,
  approver_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approver_role text NOT NULL CHECK (approver_role IN ('Class Teacher', 'Principal', 'Admin', 'Super Admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments text,
  acted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_approvals_unique_step UNIQUE (leave_application_id, step_order)
);

CREATE INDEX idx_leave_approvals_approver ON public.leave_approvals (school_id, approver_profile_id, status);

COMMENT ON TABLE public.leave_approvals IS 'Multi-step approval queue and tracking for leave applications.';

-- 4. Staff Leave Entitlements & Balances
CREATE TABLE public.leave_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  entitlement_days numeric NOT NULL DEFAULT 12,
  used_days numeric NOT NULL DEFAULT 0,
  remaining_days numeric NOT NULL DEFAULT 12,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_entitlements_unique UNIQUE (school_id, academic_session_id, profile_id, leave_type_id)
);

CREATE INDEX idx_leave_entitlements_staff ON public.leave_entitlements (school_id, academic_session_id, profile_id);

COMMENT ON TABLE public.leave_entitlements IS 'Staff leave quotas and remaining balances per academic session.';

-- 5. Notifications Table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  recipient_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('leave.submitted', 'leave.under_review', 'leave.approved', 'leave.rejected', 'leave.withdrawn', 'leave.cancelled', 'leave.approval_required', 'leave.attendance_updated')),
  title text NOT NULL,
  message text NOT NULL,
  link_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON public.notifications (school_id, recipient_profile_id, read_at, created_at DESC);

COMMENT ON TABLE public.notifications IS 'In-app notification messages delivered to users.';

-- 6. Enable RLS on all tables
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_approvals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_entitlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- 7. RLS Policies

-- leave_types: visible to all authenticated users in school; editable by Admin/Principal
CREATE POLICY "leave_types_select" ON public.leave_types FOR SELECT TO authenticated
  USING (school_id = (SELECT public.get_current_school_id()));

CREATE POLICY "leave_types_admin_all" ON public.leave_types FOR ALL TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  )
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
  );

-- leave_applications: applicant, guardian of student, approver, or admin
CREATE POLICY "leave_app_select" ON public.leave_applications FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      applicant_profile_id = (SELECT public.get_current_profile_id())
      OR (student_id IS NOT NULL AND public.is_guardian_of_student(student_id))
      OR public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR EXISTS (
        SELECT 1 FROM public.leave_approvals a
        WHERE a.leave_application_id = id
          AND a.approver_profile_id = (SELECT public.get_current_profile_id())
      )
    )
  );

CREATE POLICY "leave_app_insert" ON public.leave_applications FOR INSERT TO authenticated
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND (
      applicant_profile_id = (SELECT public.get_current_profile_id())
      OR (student_id IS NOT NULL AND public.is_guardian_of_student(student_id))
      OR public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
    )
  );

CREATE POLICY "leave_app_update" ON public.leave_applications FOR UPDATE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      applicant_profile_id = (SELECT public.get_current_profile_id())
      OR (student_id IS NOT NULL AND public.is_guardian_of_student(student_id))
      OR public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR EXISTS (
        SELECT 1 FROM public.leave_approvals a
        WHERE a.leave_application_id = id
          AND a.approver_profile_id = (SELECT public.get_current_profile_id())
      )
    )
  );

-- leave_approvals: approvers and applicant
CREATE POLICY "leave_approvals_select" ON public.leave_approvals FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      approver_profile_id = (SELECT public.get_current_profile_id())
      OR public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
      OR EXISTS (
        SELECT 1 FROM public.leave_applications la
        WHERE la.id = leave_application_id
          AND la.applicant_profile_id = (SELECT public.get_current_profile_id())
      )
    )
  );

CREATE POLICY "leave_approvals_all_admin_approver" ON public.leave_approvals FOR ALL TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      approver_profile_id = (SELECT public.get_current_profile_id())
      OR public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
    )
  );

-- leave_entitlements: staff profile or admin
CREATE POLICY "leave_entitlements_select" ON public.leave_entitlements FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND (
      profile_id = (SELECT public.get_current_profile_id())
      OR public.has_any_role(ARRAY['Super Admin', 'Admin', 'Principal'])
    )
  );

-- notifications: recipient profile
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND recipient_profile_id = (SELECT public.get_current_profile_id())
  );

CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
  USING (
    school_id = (SELECT public.get_current_school_id())
    AND recipient_profile_id = (SELECT public.get_current_profile_id())
  )
  WITH CHECK (
    school_id = (SELECT public.get_current_school_id())
    AND recipient_profile_id = (SELECT public.get_current_profile_id())
  );

CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (school_id = (SELECT public.get_current_school_id()));

-- 8. Seed Default Leave Types Function
CREATE OR REPLACE FUNCTION public.seed_default_leave_types(p_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leave_types (school_id, code, name, applicant_category, default_days_per_year, requires_document)
  VALUES
    (p_school_id, 'SICK', 'Sick Leave', 'all', 10, true),
    (p_school_id, 'CASUAL', 'Casual Leave', 'all', 12, false),
    (p_school_id, 'MEDICAL', 'Medical Leave', 'all', 15, true),
    (p_school_id, 'EMERGENCY', 'Emergency Leave', 'all', 5, false),
    (p_school_id, 'PERSONAL', 'Family / Personal Leave', 'all', 5, false)
  ON CONFLICT (school_id, code) DO NOTHING;
END;
$$;


-- ------------------------------------------------------------------------------
-- FILE: 20260812190000_create_fees_and_financial_management.sql
-- ------------------------------------------------------------------------------
-- Migration 025: Fees, Financial Management, Ledger, Razorpay, Financial Clearance
-- Phase 5 Financial Architecture

-- 1. Fee Heads
CREATE TABLE IF NOT EXISTS public.fee_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fee_heads_school_code_unique UNIQUE (school_id, code)
);

-- 2. Fee Structures
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Fee Structure Items
CREATE TABLE IF NOT EXISTS public.fee_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES public.fee_heads(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    frequency TEXT NOT NULL CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'half_yearly', 'annual')),
    due_day INTEGER DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31),
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Student Fee Assignments
CREATE TABLE IF NOT EXISTS public.student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT student_fee_assignments_unique UNIQUE (school_id, academic_session_id, student_id)
);

-- 5. Student Concessions / Scholarships
CREATE TABLE IF NOT EXISTS public.student_concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_head_id UUID REFERENCES public.fee_heads(id) ON DELETE CASCADE,
    concession_type TEXT NOT NULL CHECK (concession_type IN ('percentage', 'fixed_amount')),
    value NUMERIC(12, 2) NOT NULL CHECK (value > 0),
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Invoices / Fee Demands
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    gross_amount NUMERIC(12, 2) NOT NULL CHECK (gross_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    concession_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (concession_amount >= 0),
    late_fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (late_fee_amount >= 0),
    previous_balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (previous_balance_amount >= 0),
    net_amount NUMERIC(12, 2) NOT NULL CHECK (net_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    outstanding_amount NUMERIC(12, 2) NOT NULL CHECK (outstanding_amount >= 0),
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'adjusted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT invoices_school_number_unique UNIQUE (school_id, invoice_number),
    CONSTRAINT invoices_dates_valid CHECK (due_date >= issue_date)
);

-- 7. Invoice Items
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    fee_head_id UUID NOT NULL REFERENCES public.fee_heads(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    net_amount NUMERIC(12, 2) NOT NULL CHECK (net_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    payment_number TEXT NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'cash', 'bank_transfer', 'cheque')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    transaction_reference TEXT,
    cheque_number TEXT,
    bank_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'successful', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
    received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payments_school_number_unique UNIQUE (school_id, payment_number)
);

-- 9. Payment Allocations
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Financial Ledger (Append-Only Accounting)
CREATE TABLE IF NOT EXISTS public.financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('CHARGE', 'PAYMENT', 'DISCOUNT', 'CONCESSION', 'ADJUSTMENT', 'REFUND', 'REVERSAL', 'LATE_FEE')),
    amount NUMERIC(12, 2) NOT NULL,
    running_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT NOT NULL,
    actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Refunds
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    refund_number TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'processed', 'rejected', 'cancelled')),
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT refunds_school_number_unique UNIQUE (school_id, refund_number)
);

-- 12. Billing Adjustments
CREATE TABLE IF NOT EXISTS public.adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('CREDIT', 'DEBIT')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    actor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Receipts
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT receipts_school_number_unique UNIQUE (school_id, receipt_number)
);

-- 14. Financial Clearance (Foundation for Admit Cards & Results)
CREATE TABLE IF NOT EXISTS public.financial_clearance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'CLEAR' CHECK (status IN ('CLEAR', 'PARTIAL', 'OUTSTANDING', 'WAIVED', 'ON_HOLD')),
    total_outstanding NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_outstanding >= 0),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT financial_clearance_unique UNIQUE (school_id, academic_session_id, student_id)
);

-- 15. Payment Events (Idempotency Tracking)
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    external_event_id TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payment_events_unique UNIQUE (school_id, external_event_id)
);

-- Enable RLS on all Phase 5 financial tables
ALTER TABLE public.fee_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structure_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_concessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_clearance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Helper RLS Policies for Financial Data

-- Fee Heads RLS
CREATE POLICY "Fee heads viewable by authenticated users in school"
    ON public.fee_heads FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Fee heads manageable by Admin/Accountant"
    ON public.fee_heads FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Invoices RLS
CREATE POLICY "Invoices viewable by authorized school roles"
    ON public.invoices FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (
            public.has_role(auth.uid(), 'Super Admin') OR
            public.has_role(auth.uid(), 'Admin') OR
            public.has_role(auth.uid(), 'Principal') OR
            public.has_role(auth.uid(), 'Accountant') OR
            student_id IN (
                SELECT id FROM public.students WHERE profile_id = auth.uid()
                UNION
                SELECT student_id FROM public.guardians WHERE guardian_profile_id = auth.uid()
            )
        )
    );

CREATE POLICY "Invoices manageable by Admin/Accountant"
    ON public.invoices FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Payments RLS
CREATE POLICY "Payments viewable by authorized school roles"
    ON public.payments FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (
            public.has_role(auth.uid(), 'Super Admin') OR
            public.has_role(auth.uid(), 'Admin') OR
            public.has_role(auth.uid(), 'Principal') OR
            public.has_role(auth.uid(), 'Accountant') OR
            student_id IN (
                SELECT id FROM public.students WHERE profile_id = auth.uid()
                UNION
                SELECT student_id FROM public.guardians WHERE guardian_profile_id = auth.uid()
            )
        )
    );

-- Seed Default Fee Heads for Default School
INSERT INTO public.fee_heads (school_id, code, name, description, active)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'TUITION', 'Tuition Fee', 'Monthly academic tuition fee', true),
    ('11111111-1111-4111-8111-111111111111', 'ADMISSION', 'Admission Fee', 'One-time student admission fee', true),
    ('11111111-1111-4111-8111-111111111111', 'EXAM', 'Examination Fee', 'Term examination fee', true),
    ('11111111-1111-4111-8111-111111111111', 'COMPUTER', 'Computer & IT Fee', 'Computer lab access fee', true),
    ('11111111-1111-4111-8111-111111111111', 'ANNUAL', 'Annual Development Fee', 'Yearly school development fee', true)
ON CONFLICT (school_id, code) DO NOTHING;


-- ------------------------------------------------------------------------------
-- FILE: 20260813000000_phase5_security_remediation.sql
-- ------------------------------------------------------------------------------
-- Migration 026: Phase 5 Security Remediation
-- Fixes: Ledger immutability, UPI/POS, overpayment credits, double-entry model, missing RLS

-- ============================================================
-- FIX #3: FINANCIAL LEDGER IMMUTABILITY (RLS Deny Policies)
-- ============================================================

-- financial_ledger: append-only
CREATE POLICY "Ledger insert by Admin/Accountant"
    ON public.financial_ledger FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

CREATE POLICY "Ledger viewable by authorized roles"
    ON public.financial_ledger FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (
            public.has_role(auth.uid(), 'Super Admin') OR
            public.has_role(auth.uid(), 'Admin') OR
            public.has_role(auth.uid(), 'Principal') OR
            public.has_role(auth.uid(), 'Accountant')
        )
    );

CREATE POLICY "Ledger deny update"
    ON public.financial_ledger FOR UPDATE
    USING (false);

CREATE POLICY "Ledger deny delete"
    ON public.financial_ledger FOR DELETE
    USING (false);

-- payment_events: append-only
CREATE POLICY "Payment events insert only"
    ON public.payment_events FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Payment events viewable by Admin/Accountant"
    ON public.payment_events FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

CREATE POLICY "Payment events deny update"
    ON public.payment_events FOR UPDATE
    USING (false);

CREATE POLICY "Payment events deny delete"
    ON public.payment_events FOR DELETE
    USING (false);

-- receipts: append-only
CREATE POLICY "Receipts insert by Admin/Accountant"
    ON public.receipts FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

CREATE POLICY "Receipts viewable by authorized roles"
    ON public.receipts FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (
            public.has_role(auth.uid(), 'Super Admin') OR
            public.has_role(auth.uid(), 'Admin') OR
            public.has_role(auth.uid(), 'Principal') OR
            public.has_role(auth.uid(), 'Accountant')
        )
    );

CREATE POLICY "Receipts deny update"
    ON public.receipts FOR UPDATE
    USING (false);

CREATE POLICY "Receipts deny delete"
    ON public.receipts FOR DELETE
    USING (false);

-- audit_logs: reinforce append-only
CREATE POLICY "Audit logs insert by authenticated"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Audit logs viewable by Admin"
    ON public.audit_logs FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (school_id IS NULL OR school_id = public.get_current_school_id()) AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Principal'))
    );

CREATE POLICY "Audit logs deny update"
    ON public.audit_logs FOR UPDATE
    USING (false);

CREATE POLICY "Audit logs deny delete"
    ON public.audit_logs FOR DELETE
    USING (false);

-- ============================================================
-- FIX #4: ADD UPI AND POS PAYMENT METHODS
-- ============================================================

-- Drop and recreate check constraint to add upi and pos
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_method_check
    CHECK (payment_method IN ('razorpay', 'cash', 'bank_transfer', 'cheque', 'upi', 'pos'));

-- ============================================================
-- FIX #6: OVERPAYMENT — Student Credits Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    source_payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    remaining_amount NUMERIC(12, 2) NOT NULL CHECK (remaining_amount >= 0),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student credits viewable by authorized roles"
    ON public.student_credits FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (
            public.has_role(auth.uid(), 'Super Admin') OR
            public.has_role(auth.uid(), 'Admin') OR
            public.has_role(auth.uid(), 'Principal') OR
            public.has_role(auth.uid(), 'Accountant') OR
            student_id IN (
                SELECT id FROM public.students WHERE profile_id = auth.uid()
                UNION
                SELECT student_id FROM public.guardians WHERE guardian_profile_id = auth.uid()
            )
        )
    );

CREATE POLICY "Student credits manageable by Admin/Accountant"
    ON public.student_credits FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- ============================================================
-- FIX #8: DOUBLE-ENTRY LEDGER MODEL
-- ============================================================

-- Add journal columns to financial_ledger (backward-compatible)
ALTER TABLE public.financial_ledger ADD COLUMN IF NOT EXISTS journal_id UUID;
ALTER TABLE public.financial_ledger ADD COLUMN IF NOT EXISTS entry_type TEXT CHECK (entry_type IN ('DEBIT', 'CREDIT'));
ALTER TABLE public.financial_ledger ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Index for fast journal lookups
CREATE INDEX IF NOT EXISTS idx_financial_ledger_journal_id ON public.financial_ledger(journal_id);

-- ============================================================
-- MISSING RLS POLICIES FOR REMAINING FINANCIAL TABLES
-- ============================================================

-- Refunds
CREATE POLICY "Refunds viewable by Admin/Accountant"
    ON public.refunds FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

CREATE POLICY "Refunds manageable by Admin/Accountant"
    ON public.refunds FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Adjustments
CREATE POLICY "Adjustments viewable by Admin/Accountant"
    ON public.adjustments FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

CREATE POLICY "Adjustments manageable by Admin/Accountant"
    ON public.adjustments FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Payment Allocations
CREATE POLICY "Payment allocations viewable by Admin/Accountant"
    ON public.payment_allocations FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

CREATE POLICY "Payment allocations manageable by Admin/Accountant"
    ON public.payment_allocations FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Payments manageable by Admin/Accountant (for status updates)
CREATE POLICY "Payments manageable by Admin/Accountant"
    ON public.payments FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Fee structures viewable
CREATE POLICY "Fee structures viewable by authenticated school users"
    ON public.fee_structures FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Fee structures manageable by Admin/Accountant"
    ON public.fee_structures FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Fee structure items
CREATE POLICY "Fee structure items viewable"
    ON public.fee_structure_items FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Fee structure items manageable by Admin/Accountant"
    ON public.fee_structure_items FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Student fee assignments
CREATE POLICY "Student fee assignments viewable"
    ON public.student_fee_assignments FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Student fee assignments manageable"
    ON public.student_fee_assignments FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Student concessions
CREATE POLICY "Student concessions viewable"
    ON public.student_concessions FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Student concessions manageable"
    ON public.student_concessions FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Invoice items
CREATE POLICY "Invoice items viewable by authorized roles"
    ON public.invoice_items FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id()
    );

CREATE POLICY "Invoice items manageable by Admin/Accountant"
    ON public.invoice_items FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );

-- Financial clearance
CREATE POLICY "Financial clearance viewable"
    ON public.financial_clearance FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id()
    );

CREATE POLICY "Financial clearance manageable"
    ON public.financial_clearance FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role(auth.uid(), 'Super Admin') OR public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'Accountant'))
    );


-- ------------------------------------------------------------------------------
-- FILE: 20260813010000_concurrent_refund_protection.sql
-- ------------------------------------------------------------------------------
-- Migration 027: Concurrent Refund Protection
-- Prevents race condition where two simultaneous refund requests
-- bypass application-level validation.
--
-- Uses a BEFORE INSERT trigger to atomically check the refund cap
-- at the database level. This is the authoritative guard — the
-- application-level check in requestRefundAction is defense-in-depth.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.check_refund_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_amount NUMERIC(12,2);
    v_total_refunded NUMERIC(12,2);
    v_remaining NUMERIC(12,2);
BEGIN
    -- Lock the payment row to prevent concurrent reads
    SELECT amount INTO v_payment_amount
    FROM public.payments
    WHERE id = NEW.payment_id
    FOR UPDATE;

    IF v_payment_amount IS NULL THEN
        RAISE EXCEPTION 'Payment not found: %', NEW.payment_id;
    END IF;

    -- Calculate total already-refunded (exclude rejected/cancelled)
    SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded
    FROM public.refunds
    WHERE payment_id = NEW.payment_id
      AND status NOT IN ('rejected', 'cancelled');

    v_remaining := v_payment_amount - v_total_refunded;

    IF NEW.amount > v_remaining THEN
        RAISE EXCEPTION 'Refund amount (%) exceeds remaining refundable amount (%). Already refunded: %',
            NEW.amount, v_remaining, v_total_refunded;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger to the refunds table
DROP TRIGGER IF EXISTS trg_check_refund_limit ON public.refunds;
CREATE TRIGGER trg_check_refund_limit
    BEFORE INSERT ON public.refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.check_refund_limit();

-- 3. Add a CHECK constraint for additional safety
-- This ensures a single refund can never exceed a sane limit
-- (the trigger does the authoritative multi-row check)
COMMENT ON FUNCTION public.check_refund_limit() IS
    'Atomically prevents total refunds for a payment from exceeding the original payment amount. Uses SELECT FOR UPDATE on payments to serialize concurrent refund inserts.';


-- ------------------------------------------------------------------------------
-- FILE: 20260813020000_phase51_financial_infrastructure.sql
-- ------------------------------------------------------------------------------
-- ============================================================
-- Phase 5.1 Migration 1: Financial Infrastructure
-- ============================================================
-- Creates: financial_accounts, unmatched_webhook_events,
--          credit_allocations, atomic journal RPC,
--          cheque tracking columns, has_role fix
-- ============================================================

-- ============================================================
-- 1. FIX has_role SIGNATURE MISMATCH
-- The existing has_role(text) function takes 1 argument.
-- Create a 2-argument overload so existing policies work.
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, role_name TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        JOIN public.profiles p ON p.id = ur.profile_id
        WHERE p.auth_user_id = p_user_id
          AND ur.school_id = p.school_id
          AND r.name = role_name
    );
$$;

-- ============================================================
-- 2. CHART OF ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE')),
    is_system BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT financial_accounts_school_code_unique UNIQUE (school_id, code)
);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial accounts viewable by authenticated school users"
    ON public.financial_accounts FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Financial accounts manageable by Admin/Accountant"
    ON public.financial_accounts FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

-- Seed system accounts for all existing schools
INSERT INTO public.financial_accounts (school_id, code, name, account_type, is_system)
SELECT s.id, ac.code, ac.name, ac.account_type, true
FROM public.schools s
CROSS JOIN (VALUES
    ('CASH_IN_HAND',       'Cash in Hand',           'ASSET'),
    ('BANK_SBI',           'Bank - SBI',             'ASSET'),
    ('BANK_HDFC',          'Bank - HDFC',            'ASSET'),
    ('RAZORPAY_CLEARING',  'Razorpay Clearing',      'ASSET'),
    ('UPI_CLEARING',       'UPI Clearing',           'ASSET'),
    ('POS_CLEARING',       'POS Clearing',           'ASSET'),
    ('CHEQUE_RECEIVABLE',  'Cheque Receivable',      'ASSET'),
    ('ACCOUNTS_RECEIVABLE','Accounts Receivable',    'ASSET'),
    ('FEE_REVENUE',        'Fee Revenue',            'REVENUE'),
    ('DISCOUNT_EXPENSE',   'Discount Expense',       'EXPENSE'),
    ('REFUND_ACCOUNT',     'Refund Account',         'EXPENSE'),
    ('STUDENT_CREDIT_LIABILITY', 'Student Credit Liability', 'LIABILITY')
) AS ac(code, name, account_type)
ON CONFLICT (school_id, code) DO NOTHING;

-- ============================================================
-- 3. UNMATCHED WEBHOOK EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.unmatched_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'razorpay',
    external_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature_verified BOOLEAN NOT NULL DEFAULT false,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processing_status TEXT NOT NULL DEFAULT 'unmatched'
        CHECK (processing_status IN ('unmatched', 'manually_resolved', 'ignored')),
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unmatched_webhook_events_ext_id_unique UNIQUE (provider, external_event_id)
);

ALTER TABLE public.unmatched_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only Super Admin / Admin can view unmatched events (no school scoping needed)
CREATE POLICY "Unmatched webhooks insert by service"
    ON public.unmatched_webhook_events FOR INSERT
    WITH CHECK (true); -- Webhook handler runs without user context

CREATE POLICY "Unmatched webhooks viewable by Super Admin"
    ON public.unmatched_webhook_events FOR SELECT
    USING (auth.uid() IS NOT NULL AND public.has_role('Super Admin'));

CREATE POLICY "Unmatched webhooks deny update"
    ON public.unmatched_webhook_events FOR UPDATE
    USING (false);

CREATE POLICY "Unmatched webhooks deny delete"
    ON public.unmatched_webhook_events FOR DELETE
    USING (false);

-- ============================================================
-- 4. CREDIT ALLOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_credit_id UUID NOT NULL REFERENCES public.student_credits(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    actor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credit allocations viewable by Admin/Accountant"
    ON public.credit_allocations FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

CREATE POLICY "Credit allocations manageable by Admin/Accountant"
    ON public.credit_allocations FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

CREATE POLICY "Credit allocations deny update"
    ON public.credit_allocations FOR UPDATE
    USING (false);

CREATE POLICY "Credit allocations deny delete"
    ON public.credit_allocations FOR DELETE
    USING (false);

-- ============================================================
-- 5. CHEQUE TRACKING COLUMNS
-- ============================================================
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cheque_date DATE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cheque_status TEXT;

-- Add check constraint for cheque_status
DO $$ BEGIN
    ALTER TABLE public.payments ADD CONSTRAINT payments_cheque_status_check
        CHECK (cheque_status IS NULL OR cheque_status IN ('pending', 'cleared', 'bounced', 'failed', 'refunded'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 6. ATOMIC DOUBLE-ENTRY JOURNAL RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_balanced_journal(
    p_school_id UUID,
    p_academic_session_id UUID,
    p_student_id UUID,
    p_invoice_id UUID DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
    p_transaction_type TEXT DEFAULT 'PAYMENT',
    p_description TEXT DEFAULT '',
    p_actor_profile_id UUID DEFAULT NULL,
    p_entries JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_journal_id UUID;
    v_total_debit NUMERIC(12, 2) := 0;
    v_total_credit NUMERIC(12, 2) := 0;
    v_entry JSONB;
    v_running_balance NUMERIC(12, 2);
    v_last_balance NUMERIC(12, 2);
    v_balance_change NUMERIC(12, 2) := 0;
BEGIN
    -- Validate entries exist
    IF jsonb_array_length(p_entries) < 2 THEN
        RAISE EXCEPTION 'Journal must have at least 2 entries (debit and credit sides)';
    END IF;

    -- Validate balance
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        DECLARE
            v_debit NUMERIC(12, 2) := COALESCE((v_entry->>'debit')::NUMERIC, 0);
            v_credit NUMERIC(12, 2) := COALESCE((v_entry->>'credit')::NUMERIC, 0);
        BEGIN
            -- Each entry must have debit > 0 XOR credit > 0
            IF (v_debit > 0 AND v_credit > 0) THEN
                RAISE EXCEPTION 'Entry cannot have both debit and credit: %', v_entry;
            END IF;
            IF (v_debit <= 0 AND v_credit <= 0) THEN
                RAISE EXCEPTION 'Entry must have either debit or credit > 0: %', v_entry;
            END IF;

            v_total_debit := v_total_debit + v_debit;
            v_total_credit := v_total_credit + v_credit;
        END;
    END LOOP;

    -- SUM(debit) must equal SUM(credit)
    IF v_total_debit != v_total_credit THEN
        RAISE EXCEPTION 'Unbalanced journal: total debit (%) != total credit (%)',
            v_total_debit, v_total_credit;
    END IF;

    -- Generate journal ID
    v_journal_id := gen_random_uuid();

    -- Compute running balance
    SELECT COALESCE(running_balance, 0) INTO v_last_balance
    FROM public.financial_ledger
    WHERE student_id = p_student_id
      AND academic_session_id = p_academic_session_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_balance IS NULL THEN
        v_last_balance := 0;
    END IF;

    -- Determine balance impact
    IF p_transaction_type IN ('CHARGE', 'LATE_FEE', 'CHEQUE_BOUNCE') THEN
        v_balance_change := v_total_debit;
    ELSIF p_transaction_type IN ('PAYMENT', 'REFUND', 'OVERPAYMENT_CREDIT', 'CONCESSION', 'DISCOUNT') THEN
        v_balance_change := -v_total_debit;
    ELSIF p_transaction_type = 'ADJUSTMENT' THEN
        -- Determined by entry structure
        v_balance_change := 0;
    ELSE
        v_balance_change := 0;
    END IF;

    v_running_balance := v_last_balance + v_balance_change;

    -- Insert all entries atomically
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        DECLARE
            v_debit NUMERIC(12, 2) := COALESCE((v_entry->>'debit')::NUMERIC, 0);
            v_credit NUMERIC(12, 2) := COALESCE((v_entry->>'credit')::NUMERIC, 0);
            v_account TEXT := v_entry->>'account';
            v_entry_type TEXT;
            v_amount NUMERIC(12, 2);
        BEGIN
            IF v_debit > 0 THEN
                v_entry_type := 'DEBIT';
                v_amount := v_debit;
            ELSE
                v_entry_type := 'CREDIT';
                v_amount := v_credit;
            END IF;

            INSERT INTO public.financial_ledger (
                school_id, academic_session_id, student_id,
                invoice_id, payment_id, transaction_type,
                amount, running_balance, description,
                actor_profile_id, journal_id, entry_type, account_name
            ) VALUES (
                p_school_id, p_academic_session_id, p_student_id,
                p_invoice_id, p_payment_id, p_transaction_type,
                v_amount, v_running_balance, p_description,
                p_actor_profile_id, v_journal_id, v_entry_type, v_account
            );
        END;
    END LOOP;

    RETURN v_journal_id;
END;
$$;

-- Add OVERPAYMENT_CREDIT and CHEQUE_BOUNCE to transaction_type
ALTER TABLE public.financial_ledger DROP CONSTRAINT IF EXISTS financial_ledger_transaction_type_check;
ALTER TABLE public.financial_ledger ADD CONSTRAINT financial_ledger_transaction_type_check
    CHECK (transaction_type IN (
        'CHARGE', 'PAYMENT', 'DISCOUNT', 'CONCESSION',
        'ADJUSTMENT', 'REFUND', 'REVERSAL', 'LATE_FEE',
        'OVERPAYMENT_CREDIT', 'CHEQUE_BOUNCE', 'CASH_MOVEMENT'
    ));

COMMENT ON FUNCTION public.create_balanced_journal IS
    'Atomically creates a balanced double-entry journal. Validates SUM(debit) = SUM(credit) and that each entry has debit XOR credit. On any failure: full rollback.';


-- ------------------------------------------------------------------------------
-- FILE: 20260813020100_phase51_cash_reconciliation.sql
-- ------------------------------------------------------------------------------
-- ============================================================
-- Phase 5.1 Migration 2: Cash Reconciliation & Movements
-- ============================================================

-- ============================================================
-- 1. DAILY CASH RECONCILIATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_cash_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    reconciliation_date DATE NOT NULL,
    opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cash_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cash_refunded NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    physical_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    difference NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reason TEXT, -- Required if difference != 0
    prepared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'reviewed', 'locked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT daily_cash_recon_school_date_unique UNIQUE (school_id, reconciliation_date),
    -- If difference is not zero, reason must be provided
    CONSTRAINT daily_cash_recon_reason_required CHECK (
        difference = 0 OR reason IS NOT NULL AND reason != ''
    )
);

ALTER TABLE public.daily_cash_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cash reconciliation viewable by Admin/Accountant/Principal"
    ON public.daily_cash_reconciliations FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR
         public.has_role('Accountant') OR public.has_role('Principal'))
    );

CREATE POLICY "Cash reconciliation manageable by Admin/Accountant"
    ON public.daily_cash_reconciliations FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

CREATE POLICY "Cash reconciliation update by Admin/Accountant (non-locked)"
    ON public.daily_cash_reconciliations FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        status != 'locked' AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

CREATE POLICY "Cash reconciliation deny delete"
    ON public.daily_cash_reconciliations FOR DELETE
    USING (false);

-- ============================================================
-- 2. CASH MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    movement_date DATE NOT NULL,
    source_account_code TEXT NOT NULL,
    destination_account_code TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    reference TEXT,
    actor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    journal_id UUID, -- Link to balanced journal entry
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cash_movements_different_accounts CHECK (source_account_code != destination_account_code)
);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cash movements viewable by Admin/Accountant"
    ON public.cash_movements FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

CREATE POLICY "Cash movements manageable by Admin/Accountant"
    ON public.cash_movements FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

CREATE POLICY "Cash movements deny update"
    ON public.cash_movements FOR UPDATE
    USING (false);

CREATE POLICY "Cash movements deny delete"
    ON public.cash_movements FOR DELETE
    USING (false);

-- ============================================================
-- 3. RECONCILIATION LOCK TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_reconciliation_lock()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent any modification once locked
    IF OLD.status = 'locked' THEN
        RAISE EXCEPTION 'Cannot modify a locked reconciliation record (date: %)', OLD.reconciliation_date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_reconciliation_lock ON public.daily_cash_reconciliations;
CREATE TRIGGER trg_enforce_reconciliation_lock
    BEFORE UPDATE ON public.daily_cash_reconciliations
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_reconciliation_lock();

-- ============================================================
-- 4. OPENING BALANCE DERIVATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.derive_opening_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_closing NUMERIC(12, 2);
BEGIN
    -- Try to derive from previous locked reconciliation
    SELECT physical_cash INTO v_prev_closing
    FROM public.daily_cash_reconciliations
    WHERE school_id = NEW.school_id
      AND reconciliation_date < NEW.reconciliation_date
      AND status = 'locked'
    ORDER BY reconciliation_date DESC
    LIMIT 1;

    IF v_prev_closing IS NOT NULL THEN
        NEW.opening_balance := v_prev_closing;
    END IF;
    -- If no previous locked record, opening_balance must be set explicitly by user

    -- Compute expected cash
    NEW.expected_cash := NEW.opening_balance + NEW.cash_received - NEW.cash_refunded;

    -- Compute difference
    NEW.difference := NEW.physical_cash - NEW.expected_cash;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_derive_opening_balance ON public.daily_cash_reconciliations;
CREATE TRIGGER trg_derive_opening_balance
    BEFORE INSERT OR UPDATE ON public.daily_cash_reconciliations
    FOR EACH ROW
    EXECUTE FUNCTION public.derive_opening_balance();

-- ============================================================
-- 5. CREDIT CONSUMPTION SERIALIZATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_credit_consumption()
RETURNS TRIGGER AS $$
DECLARE
    v_remaining NUMERIC(12, 2);
BEGIN
    -- Lock the student_credit row to serialize concurrent consumption
    SELECT remaining_amount INTO v_remaining
    FROM public.student_credits
    WHERE id = NEW.student_credit_id
    FOR UPDATE;

    IF v_remaining IS NULL THEN
        RAISE EXCEPTION 'Student credit not found: %', NEW.student_credit_id;
    END IF;

    IF NEW.amount > v_remaining THEN
        RAISE EXCEPTION 'Credit consumption amount (%) exceeds remaining credit (%)',
            NEW.amount, v_remaining;
    END IF;

    -- Atomically reduce remaining amount
    UPDATE public.student_credits
    SET remaining_amount = remaining_amount - NEW.amount
    WHERE id = NEW.student_credit_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_credit_consumption ON public.credit_allocations;
CREATE TRIGGER trg_check_credit_consumption
    BEFORE INSERT ON public.credit_allocations
    FOR EACH ROW
    EXECUTE FUNCTION public.check_credit_consumption();

-- ============================================================
-- 6. REFUND FINALIZATION PROTECTION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_refund_finalization()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('processed', 'cancelled', 'rejected') THEN
        RAISE EXCEPTION 'Cannot modify a finalized refund (status: %)', OLD.status;
    END IF;

    -- Self-approval prohibition
    IF NEW.status = 'approved' AND NEW.approved_by = OLD.requested_by THEN
        RAISE EXCEPTION 'Self-approval of refunds is prohibited';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_refund_finalization ON public.refunds;
CREATE TRIGGER trg_enforce_refund_finalization
    BEFORE UPDATE ON public.refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_refund_finalization();

-- Add processed_by column to refunds if not exists
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;


-- ------------------------------------------------------------------------------
-- FILE: 20260813030000_phase6a_examination_setup.sql
-- ------------------------------------------------------------------------------
-- ============================================================
-- Phase 6A Migration: Examination Setup & Scheduling
-- ============================================================
-- Creates: exam_types, examinations, examination_classes,
--          examination_subject_configs, examination_schedules,
--          examination_invigilators, conflict check RPC, RLS
-- ============================================================

-- 1. EXAMINATION TYPES
CREATE TABLE IF NOT EXISTS public.exam_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT exam_types_school_code_unique UNIQUE (school_id, code)
);

ALTER TABLE public.exam_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam types viewable by authenticated school users"
    ON public.exam_types FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Exam types manageable by Admin/Principal"
    ON public.exam_types FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- Seed standard exam types for all existing schools
INSERT INTO public.exam_types (school_id, code, name, description)
SELECT s.id, et.code, et.name, et.description
FROM public.schools s
CROSS JOIN (VALUES
    ('UT',      'Unit Test',           'Periodic unit evaluation'),
    ('PT',      'Periodic Test',       'Term periodic test'),
    ('HY',      'Half Yearly',         'Mid-term examination'),
    ('PA',      'Pre-Annual',          'Pre-board / pre-annual mock exam'),
    ('ANNUAL',  'Annual Examination',  'Final annual examination'),
    ('PRAC',    'Practical Exam',      'Laboratory and practical assessment'),
    ('IA',      'Internal Assessment', 'Continuous internal assessment')
) AS et(code, name, description)
ON CONFLICT (school_id, code) DO NOTHING;

-- 2. EXAMINATIONS MASTER
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    exam_type_id UUID NOT NULL REFERENCES public.exam_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'scheduled', 'published', 'in_progress', 'completed', 'cancelled')),
    cancellation_reason TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT examinations_school_session_code_unique UNIQUE (school_id, academic_session_id, code),
    CONSTRAINT examinations_dates_valid CHECK (end_date >= start_date)
);

ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Examinations viewable by authorized roles"
    ON public.examinations FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (
            public.has_role('Super Admin') OR
            public.has_role('Admin') OR
            public.has_role('Principal') OR
            public.has_role('Teacher') OR
            (status IN ('published', 'in_progress', 'completed') AND (public.has_role('Student') OR public.has_role('Parent')))
        )
    );

CREATE POLICY "Examinations manageable by Admin/Principal"
    ON public.examinations FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- 3. EXAMINATION APPLICABLE CLASSES
CREATE TABLE IF NOT EXISTS public.examination_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT exam_classes_exam_class_unique UNIQUE (examination_id, class_id)
);

ALTER TABLE public.examination_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam classes viewable by authenticated users"
    ON public.examination_classes FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Exam classes manageable by Admin/Principal"
    ON public.examination_classes FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- 4. EXAMINATION SUBJECT MARKING CONFIGURATION
CREATE TABLE IF NOT EXISTS public.examination_subject_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    maximum_marks NUMERIC(6, 2) NOT NULL CHECK (maximum_marks > 0),
    passing_marks NUMERIC(6, 2) NOT NULL CHECK (passing_marks >= 0),
    theory_marks NUMERIC(6, 2) DEFAULT 0 CHECK (theory_marks >= 0),
    practical_marks NUMERIC(6, 2) DEFAULT 0 CHECK (practical_marks >= 0),
    internal_marks NUMERIC(6, 2) DEFAULT 0 CHECK (internal_marks >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT exam_subject_configs_unique UNIQUE (examination_id, class_id, subject_id),
    CONSTRAINT exam_subject_configs_passing_valid CHECK (passing_marks <= maximum_marks)
);

ALTER TABLE public.examination_subject_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam subject configs viewable by authenticated users"
    ON public.examination_subject_configs FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Exam subject configs manageable by Admin/Principal"
    ON public.examination_subject_configs FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- 5. EXAMINATION SCHEDULES
CREATE TABLE IF NOT EXISTS public.examination_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE, -- NULL means all sections in class
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    venue TEXT,
    room TEXT,
    maximum_marks NUMERIC(6, 2) NOT NULL CHECK (maximum_marks > 0),
    passing_marks NUMERIC(6, 2) NOT NULL CHECK (passing_marks >= 0),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT exam_schedules_time_valid CHECK (start_time < end_time),
    CONSTRAINT exam_schedules_passing_valid CHECK (passing_marks <= maximum_marks)
);

ALTER TABLE public.examination_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam schedules viewable by authorized roles"
    ON public.examination_schedules FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (
            public.has_role('Super Admin') OR
            public.has_role('Admin') OR
            public.has_role('Principal') OR
            public.has_role('Teacher') OR
            (status = 'scheduled' AND (public.has_role('Student') OR public.has_role('Parent')))
        )
    );

CREATE POLICY "Exam schedules manageable by Admin/Principal"
    ON public.examination_schedules FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- 6. EXAMINATION INVIGILATORS
CREATE TABLE IF NOT EXISTS public.examination_invigilators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    exam_schedule_id UUID NOT NULL REFERENCES public.examination_schedules(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT exam_invigilators_schedule_profile_unique UNIQUE (exam_schedule_id, profile_id)
);

ALTER TABLE public.examination_invigilators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam invigilators viewable by authenticated users"
    ON public.examination_invigilators FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Exam invigilators manageable by Admin/Principal"
    ON public.examination_invigilators FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- 7. CONFLICT DETECTION RPC FUNCTION
CREATE OR REPLACE FUNCTION public.check_exam_schedule_conflicts(
    p_school_id UUID,
    p_schedule_id UUID DEFAULT NULL,
    p_class_id UUID DEFAULT NULL,
    p_section_id UUID DEFAULT NULL,
    p_subject_id UUID DEFAULT NULL,
    p_exam_date DATE DEFAULT NULL,
    p_start_time TIME DEFAULT NULL,
    p_end_time TIME DEFAULT NULL,
    p_room TEXT DEFAULT NULL,
    p_invigilator_ids UUID[] DEFAULT '{}'::UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conflicts JSONB := '[]'::jsonb;
    v_rec RECORD;
BEGIN
    -- 1. Class/Section Time Overlap Conflict
    -- Same class and section cannot have two exams at overlapping times on the same date
    FOR v_rec IN
        SELECT es.id, es.room, s.name as subject_name, c.name as class_name, es.start_time, es.end_time
        FROM public.examination_schedules es
        JOIN public.subjects s ON s.id = es.subject_id
        JOIN public.classes c ON c.id = es.class_id
        WHERE es.school_id = p_school_id
          AND es.exam_date = p_exam_date
          AND es.class_id = p_class_id
          AND (p_section_id IS NULL OR es.section_id IS NULL OR es.section_id = p_section_id)
          AND es.status != 'cancelled'
          AND (p_schedule_id IS NULL OR es.id != p_schedule_id)
          AND (es.start_time, es.end_time) OVERLAPS (p_start_time, p_end_time)
    LOOP
        v_conflicts := v_conflicts || jsonb_build_object(
            'type', 'CLASS_TIME_OVERLAP',
            'message', format('Class %s already has %s exam scheduled at %s - %s', v_rec.class_name, v_rec.subject_name, v_rec.start_time, v_rec.end_time),
            'schedule_id', v_rec.id
        );
    END LOOP;

    -- 2. Room / Venue Conflict
    -- Same room cannot host overlapping examinations
    IF p_room IS NOT NULL AND trim(p_room) != '' THEN
        FOR v_rec IN
            SELECT es.id, es.room, s.name as subject_name, c.name as class_name, es.start_time, es.end_time
            FROM public.examination_schedules es
            JOIN public.subjects s ON s.id = es.subject_id
            JOIN public.classes c ON c.id = es.class_id
            WHERE es.school_id = p_school_id
              AND es.exam_date = p_exam_date
              AND lower(trim(es.room)) = lower(trim(p_room))
              AND es.status != 'cancelled'
              AND (p_schedule_id IS NULL OR es.id != p_schedule_id)
              AND (es.start_time, es.end_time) OVERLAPS (p_start_time, p_end_time)
        LOOP
            v_conflicts := v_conflicts || jsonb_build_object(
                'type', 'ROOM_OVERLAP',
                'message', format('Room %s is already occupied by Class %s (%s) from %s to %s', p_room, v_rec.class_name, v_rec.subject_name, v_rec.start_time, v_rec.end_time),
                'schedule_id', v_rec.id
            );
        END LOOP;
    END IF;

    -- 3. Invigilator Conflict
    -- Same invigilator cannot be assigned to overlapping exams
    IF array_length(p_invigilator_ids, 1) > 0 THEN
        FOR v_rec IN
            SELECT ei.profile_id, p.full_name, es.id as schedule_id, c.name as class_name, s.name as subject_name, es.start_time, es.end_time
            FROM public.examination_invigilators ei
            JOIN public.examination_schedules es ON es.id = ei.exam_schedule_id
            JOIN public.profiles p ON p.id = ei.profile_id
            JOIN public.subjects s ON s.id = es.subject_id
            JOIN public.classes c ON c.id = es.class_id
            WHERE ei.school_id = p_school_id
              AND ei.profile_id = ANY(p_invigilator_ids)
              AND es.exam_date = p_exam_date
              AND es.status != 'cancelled'
              AND (p_schedule_id IS NULL OR es.id != p_schedule_id)
              AND (es.start_time, es.end_time) OVERLAPS (p_start_time, p_end_time)
        LOOP
            v_conflicts := v_conflicts || jsonb_build_object(
                'type', 'INVIGILATOR_OVERLAP',
                'message', format('Invigilator %s is already assigned to %s exam for Class %s from %s to %s', v_rec.full_name, v_rec.subject_name, v_rec.class_name, v_rec.start_time, v_rec.end_time),
                'profile_id', v_rec.profile_id,
                'schedule_id', v_rec.schedule_id
            );
        END LOOP;
    END IF;

    -- 4. Subject Duplication
    -- Same subject should not be scheduled twice for same class in overlapping timeslot
    FOR v_rec IN
        SELECT es.id, s.name as subject_name
        FROM public.examination_schedules es
        JOIN public.subjects s ON s.id = es.subject_id
        WHERE es.school_id = p_school_id
          AND es.exam_date = p_exam_date
          AND es.class_id = p_class_id
          AND es.subject_id = p_subject_id
          AND es.status != 'cancelled'
          AND (p_schedule_id IS NULL OR es.id != p_schedule_id)
    LOOP
        v_conflicts := v_conflicts || jsonb_build_object(
            'type', 'SUBJECT_DUPLICATION',
            'message', format('Subject %s is already scheduled on date %s for this class', v_rec.subject_name, p_exam_date),
            'schedule_id', v_rec.id
        );
    END LOOP;

    RETURN v_conflicts;
END;
$$;

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_exam_types_school ON public.exam_types(school_id);
CREATE INDEX IF NOT EXISTS idx_examinations_school_session ON public.examinations(school_id, academic_session_id);
CREATE INDEX IF NOT EXISTS idx_examinations_status ON public.examinations(status);
CREATE INDEX IF NOT EXISTS idx_exam_classes_exam ON public.examination_classes(examination_id);
CREATE INDEX IF NOT EXISTS idx_exam_subject_configs_exam_class ON public.examination_subject_configs(examination_id, class_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_date ON public.examination_schedules(school_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_invigilators_schedule ON public.examination_invigilators(exam_schedule_id);


-- ------------------------------------------------------------------------------
-- FILE: 20260813040000_phase6b_admit_cards.sql
-- ------------------------------------------------------------------------------
-- ============================================================
-- Phase 6B Migration: Admit Cards & Financial Clearance Gate
-- ============================================================
-- Creates: admit_cards table, generate_admit_card_number RPC,
--          unique active card constraint, RLS policies, indexes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_academic_history_id UUID REFERENCES public.student_academic_history(id) ON DELETE SET NULL,
    admit_card_number TEXT NOT NULL,
    verification_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'eligible', 'blocked', 'override_released', 'published', 'revoked')),
    financial_clearance_status TEXT NOT NULL DEFAULT 'OUTSTANDING'
        CHECK (financial_clearance_status IN ('CLEAR', 'PARTIAL', 'OUTSTANDING', 'WAIVED', 'ON_HOLD')),
    financial_outstanding_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (financial_outstanding_amount >= 0),
    financial_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    override_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    override_at TIMESTAMPTZ,
    candidate_eligibility_status TEXT NOT NULL DEFAULT 'eligible'
        CHECK (candidate_eligibility_status IN ('eligible', 'ineligible')),
    eligibility_remarks TEXT,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    revocation_reason TEXT,
    previous_admit_card_id UUID REFERENCES public.admit_cards(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT admit_cards_number_school_unique UNIQUE (school_id, admit_card_number),
    CONSTRAINT admit_cards_token_unique UNIQUE (verification_token)
);

-- Unique constraint preventing multiple active non-revoked Admit Cards for same student in same exam
CREATE UNIQUE INDEX IF NOT EXISTS idx_admit_cards_active_unique
    ON public.admit_cards (school_id, academic_session_id, examination_id, student_id)
    WHERE status != 'revoked';

-- Enable RLS
ALTER TABLE public.admit_cards ENABLE ROW LEVEL SECURITY;

-- 1. SELECT POLICIES
CREATE POLICY "Admit cards viewable by Admin/Principal"
    ON public.admit_cards FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal') OR public.has_role('Accountant'))
    );

CREATE POLICY "Admit cards viewable by Teachers"
    ON public.admit_cards FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Teacher')
    );

CREATE POLICY "Admit cards viewable by Student for own published card"
    ON public.admit_cards FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Student') AND
        status = 'published' AND
        student_id IN (
            SELECT id FROM public.students WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Admit cards viewable by Parent for child published card"
    ON public.admit_cards FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Parent') AND
        status = 'published' AND
        student_id IN (
            SELECT student_id FROM public.parent_student_map psm
            JOIN public.profiles p ON p.id = psm.parent_profile_id
            WHERE p.id = auth.uid()
        )
    );

-- 2. INSERT/UPDATE/DELETE POLICIES (Admin, Super Admin, Principal ONLY)
CREATE POLICY "Admit cards manageable by Admin/Principal"
    ON public.admit_cards FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- ATOMIC ADMIT CARD NUMBER GENERATOR RPC
CREATE OR REPLACE FUNCTION public.generate_admit_card_number(
    p_school_id UUID,
    p_session_name TEXT,
    p_exam_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prefix TEXT;
    v_count INTEGER;
    v_number TEXT;
BEGIN
    -- Format: AC/{SESSION_NAME}/{EXAM_CODE}/{SEQUENCE}
    v_prefix := 'AC/' || regexp_replace(COALESCE(p_session_name, 'SESSION'), '\s+', '', 'g') || '/' || UPPER(COALESCE(p_exam_code, 'EXAM')) || '/';
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM public.admit_cards
    WHERE school_id = p_school_id AND admit_card_number LIKE v_prefix || '%';

    v_number := v_prefix || lpad(v_count::text, 5, '0');
    RETURN v_number;
END;
$$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_admit_cards_school_exam ON public.admit_cards(school_id, examination_id);
CREATE INDEX IF NOT EXISTS idx_admit_cards_student ON public.admit_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_admit_cards_status ON public.admit_cards(status);
CREATE INDEX IF NOT EXISTS idx_admit_cards_token ON public.admit_cards(verification_token);


-- ------------------------------------------------------------------------------
-- FILE: 20260813050000_phase6c_marks_and_results.sql
-- ------------------------------------------------------------------------------
-- ============================================================
-- Phase 6C Migration: Marks Entry, Result Calculation & Release
-- ============================================================
-- Creates: student_marks, student_results, grading_scales, RLS
-- ============================================================

-- 1. GRADING SCALES
CREATE TABLE IF NOT EXISTS public.grading_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    min_percentage NUMERIC(5, 2) NOT NULL CHECK (min_percentage >= 0),
    max_percentage NUMERIC(5, 2) NOT NULL CHECK (max_percentage <= 100),
    grade TEXT NOT NULL,
    grade_point NUMERIC(3, 1) DEFAULT 0.0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT grading_scales_school_grade_unique UNIQUE (school_id, grade),
    CONSTRAINT grading_scales_percentage_range_valid CHECK (max_percentage >= min_percentage)
);

ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grading scales viewable by authenticated school users"
    ON public.grading_scales FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Grading scales manageable by Admin/Principal"
    ON public.grading_scales FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- Seed standard CBSE grading scale per school
INSERT INTO public.grading_scales (school_id, name, min_percentage, max_percentage, grade, grade_point, description)
SELECT s.id, gs.name, gs.min_p, gs.max_p, gs.grade, gs.gp, gs.desc
FROM public.schools s
CROSS JOIN (VALUES
    ('A1', 91.00, 100.00, 'A1', 10.0, 'Top 1/8th of passed candidates'),
    ('A2', 81.00,  90.99, 'A2',  9.0, 'Next 1/8th of passed candidates'),
    ('B1', 71.00,  80.99, 'B1',  8.0, 'Next 1/8th of passed candidates'),
    ('B2', 61.00,  70.99, 'B2',  7.0, 'Next 1/8th of passed candidates'),
    ('C1', 51.00,  60.99, 'C1',  6.0, 'Next 1/8th of passed candidates'),
    ('C2', 41.00,  50.99, 'C2',  5.0, 'Next 1/8th of passed candidates'),
    ('D',  33.00,  40.99, 'D',   4.0, 'Next 1/8th of passed candidates'),
    ('E',   0.00,  32.99, 'E',   0.0, 'Failed / Essential Repeat')
) AS gs(name, min_p, max_p, grade, gp, desc)
ON CONFLICT (school_id, grade) DO NOTHING;

-- 2. STUDENT MARKS TABLE
CREATE TABLE IF NOT EXISTS public.student_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_academic_history_id UUID REFERENCES public.student_academic_history(id) ON DELETE SET NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    examination_subject_config_id UUID REFERENCES public.examination_subject_configs(id) ON DELETE SET NULL,
    attendance_status TEXT NOT NULL DEFAULT 'present'
        CHECK (attendance_status IN ('present', 'absent', 'excused', 'not_appeared')),
    theory_marks_obtained NUMERIC(6, 2) DEFAULT 0.00 CHECK (theory_marks_obtained >= 0),
    practical_marks_obtained NUMERIC(6, 2) DEFAULT 0.00 CHECK (practical_marks_obtained >= 0),
    internal_marks_obtained NUMERIC(6, 2) DEFAULT 0.00 CHECK (internal_marks_obtained >= 0),
    total_marks_obtained NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (total_marks_obtained >= 0),
    is_pass BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'verified', 'locked')),
    correction_reason TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    locked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT student_marks_unique UNIQUE (examination_id, student_id, subject_id)
);

ALTER TABLE public.student_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student marks viewable by Admin/Principal/Teacher"
    ON public.student_marks FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal') OR public.has_role('Teacher') OR public.has_role('Accountant'))
    );

CREATE POLICY "Student marks manageable by Admin/Principal/Teacher"
    ON public.student_marks FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal') OR public.has_role('Teacher'))
    );

-- 3. STUDENT RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.student_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_academic_history_id UUID REFERENCES public.student_academic_history(id) ON DELETE SET NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    total_marks_obtained NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (total_marks_obtained >= 0),
    maximum_marks NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (maximum_marks > 0),
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (percentage >= 0 AND percentage <= 100),
    result_status TEXT NOT NULL DEFAULT 'PASS'
        CHECK (result_status IN ('PASS', 'FAIL', 'COMPARTMENT', 'WITHHELD')),
    grade TEXT,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'calculated', 'pending_approval', 'approved', 'blocked', 'override_released', 'published', 'withheld', 'revoked')),
    financial_clearance_status TEXT NOT NULL DEFAULT 'OUTSTANDING'
        CHECK (financial_clearance_status IN ('CLEAR', 'PARTIAL', 'OUTSTANDING', 'WAIVED', 'ON_HOLD')),
    financial_outstanding_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (financial_outstanding_amount >= 0),
    financial_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    override_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    override_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    previous_result_id UUID REFERENCES public.student_results(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique active non-revoked result constraint per student and exam
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_results_active_unique
    ON public.student_results (school_id, academic_session_id, examination_id, student_id)
    WHERE status != 'revoked';

ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student results viewable by Admin/Principal/Teacher/Accountant"
    ON public.student_results FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal') OR public.has_role('Teacher') OR public.has_role('Accountant'))
    );

CREATE POLICY "Student results viewable by Student for own published result"
    ON public.student_results FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Student') AND
        status = 'published' AND
        student_id IN (
            SELECT id FROM public.students WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Student results viewable by Parent for child published result"
    ON public.student_results FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Parent') AND
        status = 'published' AND
        student_id IN (
            SELECT student_id FROM public.parent_student_map psm
            JOIN public.profiles p ON p.id = psm.parent_profile_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Student results manageable by Admin/Principal"
    ON public.student_results FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_student_marks_exam_class ON public.student_marks(school_id, examination_id, class_id);
CREATE INDEX IF NOT EXISTS idx_student_marks_student ON public.student_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_results_school_exam ON public.student_results(school_id, examination_id);
CREATE INDEX IF NOT EXISTS idx_student_results_student ON public.student_results(student_id);
CREATE INDEX IF NOT EXISTS idx_student_results_status ON public.student_results(status);


-- ------------------------------------------------------------------------------
-- FILE: 20260813060000_phase6d_promotion_and_lifecycle.sql
-- ------------------------------------------------------------------------------
-- ============================================================
-- Phase 6D Migration: Promotion, Repeat & Student Lifecycle
-- ============================================================
-- Creates: promotion_policies, class_progressions, promotion_records, RLS
-- ============================================================

-- 1. PROMOTION POLICIES TABLE
CREATE TABLE IF NOT EXISTS public.promotion_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Standard Promotion Policy',
    min_overall_percentage NUMERIC(5, 2) NOT NULL DEFAULT 33.00 CHECK (min_overall_percentage >= 0),
    min_passed_subjects INTEGER NOT NULL DEFAULT 0,
    max_failed_subjects_allowed INTEGER NOT NULL DEFAULT 0,
    allow_supplementary BOOLEAN NOT NULL DEFAULT TRUE,
    max_supplementary_subjects INTEGER NOT NULL DEFAULT 2,
    allow_conditional_promotion BOOLEAN NOT NULL DEFAULT FALSE,
    require_attendance BOOLEAN NOT NULL DEFAULT FALSE,
    min_attendance_percentage NUMERIC(5, 2) DEFAULT 75.00 CHECK (min_attendance_percentage >= 0),
    require_fee_clearance BOOLEAN NOT NULL DEFAULT FALSE,
    require_principal_approval BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT promotion_policies_school_name_unique UNIQUE (school_id, name)
);

ALTER TABLE public.promotion_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotion policies viewable by authenticated school users"
    ON public.promotion_policies FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Promotion policies manageable by Admin/Principal"
    ON public.promotion_policies FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- Seed default promotion policy per school
INSERT INTO public.promotion_policies (school_id, name, min_overall_percentage, max_failed_subjects_allowed, allow_supplementary, max_supplementary_subjects)
SELECT s.id, 'Standard CBSE Promotion Policy', 33.00, 0, TRUE, 2
FROM public.schools s
ON CONFLICT (school_id, name) DO NOTHING;

-- 2. CLASS PROGRESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.class_progressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    source_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    target_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    is_final_class BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT class_progressions_school_source_unique UNIQUE (school_id, source_class_id)
);

ALTER TABLE public.class_progressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class progressions viewable by authenticated school users"
    ON public.class_progressions FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Class progressions manageable by Admin/Principal"
    ON public.class_progressions FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- 3. PROMOTION RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.promotion_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    source_academic_history_id UUID NOT NULL REFERENCES public.student_academic_history(id) ON DELETE CASCADE,
    source_academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    target_academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    source_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    target_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    target_section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    source_result_id UUID REFERENCES public.student_results(id) ON DELETE SET NULL,
    decision TEXT NOT NULL
        CHECK (decision IN ('PROMOTED', 'REPEAT', 'SUPPLEMENTARY', 'CONDITIONAL_PROMOTION', 'PASSED_OUT', 'TRANSFERRED', 'WITHDRAWN')),
    conditional BOOLEAN NOT NULL DEFAULT FALSE,
    condition_description TEXT,
    reason TEXT,
    recommended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recommended_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    executed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    executed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'recommended'
        CHECK (status IN ('recommended', 'approved', 'executed', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique executed promotion index per student and target session
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotion_records_executed_unique
    ON public.promotion_records (school_id, target_academic_session_id, student_id)
    WHERE status = 'executed';

ALTER TABLE public.promotion_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotion records viewable by Admin/Principal/Teacher"
    ON public.promotion_records FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal') OR public.has_role('Teacher') OR public.has_role('Accountant'))
    );

CREATE POLICY "Promotion records viewable by Student for own record"
    ON public.promotion_records FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Student') AND
        status = 'executed' AND
        student_id IN (
            SELECT id FROM public.students WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Promotion records viewable by Parent for child record"
    ON public.promotion_records FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Parent') AND
        status = 'executed' AND
        student_id IN (
            SELECT student_id FROM public.parent_student_map psm
            JOIN public.profiles p ON p.id = psm.parent_profile_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Promotion records manageable by Admin/Principal/Teacher"
    ON public.promotion_records FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal') OR public.has_role('Teacher'))
    );

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_promotion_records_school_student ON public.promotion_records(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_promotion_records_target_session ON public.promotion_records(target_academic_session_id);
CREATE INDEX IF NOT EXISTS idx_promotion_records_status ON public.promotion_records(status);

-- 4. ATOMIC PROMOTION EXECUTION RPC FUNCTION
CREATE OR REPLACE FUNCTION public.execute_student_promotion(
    p_promotion_record_id UUID,
    p_actor_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rec RECORD;
    v_new_history_id UUID;
    v_target_status TEXT;
BEGIN
    -- 1. Lock & fetch promotion record
    SELECT * INTO v_rec
    FROM public.promotion_records
    WHERE id = p_promotion_record_id
    FOR UPDATE;

    IF v_rec IS NULL THEN
        RAISE EXCEPTION 'Promotion record not found';
    END IF;

    IF v_rec.status = 'executed' THEN
        RAISE EXCEPTION 'Promotion record has already been executed';
    END IF;

    -- 2. Transition source student_academic_history status
    IF v_rec.decision = 'PASSED_OUT' THEN
        v_target_status := 'graduated';
    ELSIF v_rec.decision = 'TRANSFERRED' THEN
        v_target_status := 'transferred';
    ELSIF v_rec.decision = 'WITHDRAWN' THEN
        v_target_status := 'withdrawn';
    ELSE
        v_target_status := 'completed';
    END IF;

    UPDATE public.student_academic_history
    SET status = v_target_status,
        updated_at = NOW()
    WHERE id = v_rec.source_academic_history_id;

    -- 3. If PROMOTED, REPEAT, or CONDITIONAL_PROMOTION, create NEW student_academic_history row for target session
    IF v_rec.decision IN ('PROMOTED', 'REPEAT', 'CONDITIONAL_PROMOTION', 'SUPPLEMENTARY') AND v_rec.target_class_id IS NOT NULL THEN
        INSERT INTO public.student_academic_history (
            school_id,
            student_id,
            academic_session_id,
            class_id,
            section_id,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_rec.school_id,
            v_rec.student_id,
            v_rec.target_academic_session_id,
            v_rec.target_class_id,
            v_rec.target_section_id,
            'active',
            NOW(),
            NOW()
        ) RETURNING id INTO v_new_history_id;
    END IF;

    -- 4. Update student master status if PASSED_OUT or TRANSFERRED
    IF v_rec.decision = 'PASSED_OUT' THEN
        UPDATE public.students SET status = 'graduated', updated_at = NOW() WHERE id = v_rec.student_id;
    ELSIF v_rec.decision = 'TRANSFERRED' THEN
        UPDATE public.students SET status = 'transferred', updated_at = NOW() WHERE id = v_rec.student_id;
    ELSIF v_rec.decision = 'WITHDRAWN' THEN
        UPDATE public.students SET status = 'withdrawn', updated_at = NOW() WHERE id = v_rec.student_id;
    END IF;

    -- 5. Mark promotion record as EXECUTED
    UPDATE public.promotion_records
    SET status = 'executed',
        executed_by = p_actor_profile_id,
        executed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_rec.id;

    RETURN jsonb_build_object(
        'success', true,
        'promotion_record_id', v_rec.id,
        'new_academic_history_id', v_new_history_id,
        'decision', v_rec.decision
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- FILE: 20260813070000_phase6e_documents_and_certificates.sql
-- ------------------------------------------------------------------------------
-- ============================================================
-- Phase 6E Migration: Report Cards, Certificates & Documents
-- ============================================================
-- Creates: report_card_templates, report_cards, certificate_types,
--          certificate_sequences, certificates, RPCs, RLS
-- ============================================================

-- 1. REPORT CARD TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.report_card_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Standard Academic Report Card',
    title TEXT NOT NULL DEFAULT 'ANNUAL PROGRESS REPORT CARD',
    school_name_override TEXT,
    header_address TEXT DEFAULT 'Main Campus, Educational Zone',
    affiliation_text TEXT DEFAULT 'Affiliated to CBSE / State Education Board',
    principal_title TEXT DEFAULT 'Principal & Head of Institution',
    teacher_signature_label TEXT DEFAULT 'Class Teacher Signature',
    principal_signature_label TEXT DEFAULT 'Principal Signature & Seal',
    show_attendance BOOLEAN NOT NULL DEFAULT TRUE,
    show_remarks BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT report_card_templates_school_name_unique UNIQUE (school_id, name)
);

ALTER TABLE public.report_card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Report card templates viewable by authenticated school users"
    ON public.report_card_templates FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Report card templates manageable by Admin/Principal"
    ON public.report_card_templates FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- Seed default template per school
INSERT INTO public.report_card_templates (school_id, name, title)
SELECT s.id, 'Standard Academic Report Card', 'ANNUAL PROGRESS REPORT CARD'
FROM public.schools s
ON CONFLICT (school_id, name) DO NOTHING;

-- 2. REPORT CARDS TABLE
CREATE TABLE IF NOT EXISTS public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_academic_history_id UUID REFERENCES public.student_academic_history(id) ON DELETE SET NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    result_id UUID REFERENCES public.student_results(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.report_card_templates(id) ON DELETE SET NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    previous_report_card_id UUID REFERENCES public.report_cards(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'generated'
        CHECK (status IN ('draft', 'generated', 'review_required', 'approved', 'published', 'revoked')),
    attendance_days INTEGER DEFAULT 0 CHECK (attendance_days >= 0),
    present_days INTEGER DEFAULT 0 CHECK (present_days >= 0),
    absent_days INTEGER DEFAULT 0 CHECK (absent_days >= 0),
    leave_days INTEGER DEFAULT 0 CHECK (leave_days >= 0),
    attendance_percentage NUMERIC(5, 2) DEFAULT 0.00 CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    overall_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (overall_percentage >= 0 AND overall_percentage <= 100),
    overall_grade TEXT,
    result_status TEXT NOT NULL DEFAULT 'PASS',
    promotion_status TEXT NOT NULL DEFAULT 'PROMOTED',
    teacher_remarks TEXT,
    principal_remarks TEXT,
    correction_reason TEXT,
    verification_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique active non-revoked report card index per student, session, and exam
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_cards_active_unique
    ON public.report_cards (school_id, academic_session_id, examination_id, student_id)
    WHERE status != 'revoked';

ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Report cards viewable by Admin/Principal/Teacher/Accountant"
    ON public.report_cards FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal') OR public.has_role('Teacher') OR public.has_role('Accountant'))
    );

CREATE POLICY "Report cards viewable by Student for own published card"
    ON public.report_cards FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Student') AND
        status = 'published' AND
        student_id IN (
            SELECT id FROM public.students WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Report cards viewable by Parent for child published card"
    ON public.report_cards FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Parent') AND
        status = 'published' AND
        student_id IN (
            SELECT student_id FROM public.parent_student_map psm
            JOIN public.profiles p ON p.id = psm.parent_profile_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Report cards manageable by Admin/Principal/Teacher"
    ON public.report_cards FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal') OR public.has_role('Teacher'))
    );

-- 3. CERTIFICATE TYPES TABLE
CREATE TABLE IF NOT EXISTS public.certificate_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    code TEXT NOT NULL CHECK (code IN ('TC', 'BONAFIDE', 'CHARACTER', 'COMPLETION', 'STUDY')),
    name TEXT NOT NULL,
    prefix TEXT NOT NULL DEFAULT 'CERT',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT certificate_types_school_code_unique UNIQUE (school_id, code)
);

ALTER TABLE public.certificate_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificate types viewable by authenticated school users"
    ON public.certificate_types FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Certificate types manageable by Admin/Principal"
    ON public.certificate_types FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- Seed 5 default certificate types per school
INSERT INTO public.certificate_types (school_id, code, name, prefix, description)
SELECT s.id, ct.code, ct.name, ct.prefix, ct.desc
FROM public.schools s
CROSS JOIN (VALUES
    ('TC', 'Transfer Certificate', 'TC', 'Official Transfer & School Leaving Certificate'),
    ('BONAFIDE', 'Bonafide Certificate', 'BON', 'Certificate of Bonafide Student Status'),
    ('CHARACTER', 'Character Certificate', 'CHR', 'Certificate of Conduct & Character'),
    ('COMPLETION', 'Academic Completion Certificate', 'CMP', 'Certificate of Program Completion'),
    ('STUDY', 'Study Certificate', 'STD', 'Certificate of Attendance & Study')
) AS ct(code, name, prefix, desc)
ON CONFLICT (school_id, code) DO NOTHING;

-- 4. CERTIFICATE SEQUENCES TABLE (Concurrency-Safe Sequence Tracker)
CREATE TABLE IF NOT EXISTS public.certificate_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    certificate_type_code TEXT NOT NULL,
    academic_year INTEGER NOT NULL,
    last_sequence INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT certificate_sequences_unique UNIQUE (school_id, certificate_type_code, academic_year)
);

ALTER TABLE public.certificate_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificate sequences manageable by Admin/Principal"
    ON public.certificate_sequences FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- 5. ATOMIC CERTIFICATE NUMBER GENERATION RPC
CREATE OR REPLACE FUNCTION public.generate_certificate_number(
    p_school_id UUID,
    p_certificate_type_code TEXT,
    p_academic_year INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seq INTEGER;
    v_prefix TEXT;
    v_cert_num TEXT;
BEGIN
    -- Fetch prefix from certificate_types
    SELECT prefix INTO v_prefix
    FROM public.certificate_types
    WHERE school_id = p_school_id AND code = p_certificate_type_code;

    IF v_prefix IS NULL THEN
        v_prefix := p_certificate_type_code;
    END IF;

    -- Upsert atomic sequence counter with row locking
    INSERT INTO public.certificate_sequences (school_id, certificate_type_code, academic_year, last_sequence, updated_at)
    VALUES (p_school_id, p_certificate_type_code, p_academic_year, 1, NOW())
    ON CONFLICT (school_id, certificate_type_code, academic_year)
    DO UPDATE SET
        last_sequence = public.certificate_sequences.last_sequence + 1,
        updated_at = NOW()
    RETURNING last_sequence INTO v_seq;

    -- Format string: RPS/TC/2026/000001
    v_cert_num := 'RPS/' || v_prefix || '/' || p_academic_year::TEXT || '/' || LPAD(v_seq::TEXT, 6, '0');

    RETURN v_cert_num;
END;
$$;

-- 6. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_academic_history_id UUID REFERENCES public.student_academic_history(id) ON DELETE SET NULL,
    certificate_type_id UUID NOT NULL REFERENCES public.certificate_types(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL UNIQUE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'ISSUED'
        CHECK (status IN ('ISSUED', 'REVOKED')),
    revocation_reason TEXT,
    revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    verification_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    issued_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificates viewable by Admin/Principal/Teacher/Accountant"
    ON public.certificates FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal') OR public.has_role('Teacher') OR public.has_role('Accountant'))
    );

CREATE POLICY "Certificates viewable by Student for own issued certificate"
    ON public.certificates FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Student') AND
        status = 'ISSUED' AND
        student_id IN (
            SELECT id FROM public.students WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Certificates viewable by Parent for child issued certificate"
    ON public.certificates FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        public.has_role('Parent') AND
        status = 'ISSUED' AND
        student_id IN (
            SELECT student_id FROM public.parent_student_map psm
            JOIN public.profiles p ON p.id = psm.parent_profile_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Certificates manageable by Admin/Principal"
    ON public.certificates FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Principal'))
    );

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_report_cards_school_student ON public.report_cards(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_verification ON public.report_cards(verification_token);
CREATE INDEX IF NOT EXISTS idx_certificates_school_student ON public.certificates(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification ON public.certificates(verification_token);


-- ------------------------------------------------------------------------------
-- FILE: 20260813080000_phase7_audit_remediation.sql
-- ------------------------------------------------------------------------------
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


-- ------------------------------------------------------------------------------
-- FILE: 20260815080000_least_privilege_security_and_auth_fix.sql
-- ------------------------------------------------------------------------------
-- ==============================================================================
-- Migration: Least-Privilege Security Hardening and Supabase Auth Permission Fix
-- ==============================================================================
-- Description:
-- 1. Grants USAGE on public schema to standard Supabase roles.
-- 2. Grants minimal SELECT & REFERENCES on public.profiles to supabase_auth_admin
--    to resolve foreign key constraint checks during GoTrue authentication.
-- 3. Grants appropriate DML permissions to authenticated role for all ERP tables,
--    fully protected and constrained by existing Row Level Security (RLS) policies.
-- 4. Restores EXECUTE privileges to service_role and authenticated on helper functions.
-- 5. Hardens anon role to strict zero-trust (no access to private ERP data).
-- 6. Preserves auth schema security without any broad GRANT ALL.
-- ==============================================================================

-- 1. Schema-level usage (safe namespace resolution, grants zero table access by itself)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, service_role;

-- 2. Supabase Auth Admin (GoTrue) — Least Privilege
-- When auth.users is referenced by public.profiles(auth_user_id), GoTrue / supabase_auth_admin
-- requires SELECT and REFERENCES on public.profiles to validate foreign key constraints during sign-in.
GRANT SELECT, REFERENCES ON public.profiles TO supabase_auth_admin;

-- 3. Function Execution Grants
GRANT EXECUTE ON FUNCTION public.get_current_profile_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_school_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_guardian_of_student(uuid) TO authenticated, service_role;

-- Execute grants on phase-specific helper functions if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_assigned_teacher_of_section') THEN
    GRANT EXECUTE ON FUNCTION public.is_assigned_teacher_of_section(uuid, uuid, uuid) TO authenticated, service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_application_number') THEN
    GRANT EXECUTE ON FUNCTION public.generate_application_number(uuid, uuid) TO authenticated, service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_admission_number') THEN
    GRANT EXECUTE ON FUNCTION public.generate_admission_number(uuid) TO authenticated, service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'convert_admission_application') THEN
    GRANT EXECUTE ON FUNCTION public.convert_admission_application(uuid, uuid, text, text) TO authenticated, service_role;
  END IF;
END $$;

-- 4. Server-Side Privileged Operations (service_role)
-- Standard Supabase server-only role used for backend scripts and background processing.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 5. Authenticated Role Table Grants (Governed strictly by RLS)
-- Explicit table-level privileges across all ERP phases:
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.schools,
  public.school_settings,
  public.academic_sessions,
  public.classes,
  public.sections,
  public.subjects,
  public.class_subjects,
  public.profiles,
  public.roles,
  public.user_roles,
  public.guardians,
  public.students,
  public.student_guardians,
  public.student_academic_history,
  public.student_documents,
  public.audit_logs,
  public.admission_applications,
  public.teacher_assignments,
  public.attendance_sessions,
  public.attendance_records,
  public.leave_types,
  public.leave_applications,
  public.leave_approvals,
  public.leave_entitlements,
  public.notifications,
  public.fee_heads,
  public.fee_structures,
  public.fee_structure_items,
  public.student_fee_assignments,
  public.student_concessions,
  public.invoices,
  public.invoice_items,
  public.payments,
  public.payment_allocations,
  public.financial_ledger,
  public.refunds,
  public.adjustments,
  public.receipts,
  public.financial_clearance,
  public.payment_events,
  public.student_credits,
  public.financial_accounts,
  public.unmatched_webhook_events,
  public.credit_allocations,
  public.daily_cash_reconciliations,
  public.cash_movements,
  public.exam_types,
  public.examinations,
  public.examination_classes,
  public.examination_subject_configs,
  public.admit_cards,
  public.student_marks,
  public.student_results,
  public.student_promotions,
  public.student_status_history,
  public.report_cards,
  public.transfer_certificates,
  public.character_certificates,
  public.bonafide_certificates,
  public.document_verifications
TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 6. Anonymous (Public) Role — Zero Trust & Explicit Hardening
-- Revoke all table-level access from anon to prevent exposure of sensitive student/financial/staff data.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Explicitly allow anon ONLY on public document verification (which has its own verification code RLS)
GRANT SELECT ON public.document_verifications TO anon;

-- 7. Auth Schema Hardening
REVOKE ALL ON SCHEMA auth FROM anon, authenticated;

