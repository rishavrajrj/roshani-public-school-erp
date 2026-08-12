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
