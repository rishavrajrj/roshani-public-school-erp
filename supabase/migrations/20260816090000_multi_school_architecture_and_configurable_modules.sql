-- ============================================================
-- Migration: 20260816090000_multi_school_architecture_and_configurable_modules.sql
-- Description: Multi-School Information Architecture, UDISE Identity,
--              School Feature Registry, Dynamic Field Configs, and
--              Optional Module Relational Tables with Strict RLS.
-- ============================================================

-- 1. Extend schools table with official UDISE Code and full School Profile metadata
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS udise_code text,
  ADD COLUMN IF NOT EXISTS short_name text,
  ADD COLUMN IF NOT EXISTS school_type text DEFAULT 'co-ed',
  ADD COLUMN IF NOT EXISTS management_type text DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS affiliation text DEFAULT 'CBSE',
  ADD COLUMN IF NOT EXISTS affiliation_number text,
  ADD COLUMN IF NOT EXISTS recognition_number text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS village_town_city text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS pin_code text,
  ADD COLUMN IF NOT EXISTS alternate_phone text,
  ADD COLUMN IF NOT EXISTS seal_url text,
  ADD COLUMN IF NOT EXISTS campus_image_url text,
  ADD COLUMN IF NOT EXISTS motto text,
  ADD COLUMN IF NOT EXISTS mission text,
  ADD COLUMN IF NOT EXISTS vision text,
  ADD COLUMN IF NOT EXISTS established_year integer,
  ADD COLUMN IF NOT EXISTS principal_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'onboarding'));

-- Ensure unique UDISE code across all schools
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_udise_code_unique'
  ) THEN
    ALTER TABLE public.schools ADD CONSTRAINT schools_udise_code_unique UNIQUE (udise_code);
  END IF;
END $$;

-- Update existing default school with standard UDISE code if missing
UPDATE public.schools
SET
  udise_code = '10123456789',
  short_name = COALESCE(short_name, 'RPS'),
  school_type = COALESCE(school_type, 'co-ed'),
  management_type = COALESCE(management_type, 'private'),
  affiliation = COALESCE(affiliation, 'CBSE'),
  affiliation_number = COALESCE(affiliation_number, 'CBSE/AFF/2026/001'),
  district = COALESCE(district, city),
  pin_code = COALESCE(pin_code, '800001'),
  motto = COALESCE(motto, 'Excellence in Education, Character in Life'),
  established_year = COALESCE(established_year, 2010),
  status = 'active'
WHERE udise_code IS NULL;

-- 2. Create school_features table for Canonical Feature Registry
CREATE TABLE IF NOT EXISTS public.school_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled_at timestamptz,
  disabled_at timestamptz,
  enabled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_features_school_key_unique UNIQUE (school_id, feature_key)
);

COMMENT ON TABLE public.school_features IS 'Per-school feature activation and custom module configuration';

CREATE INDEX IF NOT EXISTS idx_school_features_school_id ON public.school_features(school_id);
CREATE INDEX IF NOT EXISTS idx_school_features_lookup ON public.school_features(school_id, feature_key, enabled);

ALTER TABLE public.school_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_features_select" ON public.school_features
  FOR SELECT TO authenticated
  USING (
    school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
    OR (SELECT r.name FROM public.profiles p JOIN public.user_roles ur ON ur.profile_id = p.id JOIN public.roles r ON r.id = ur.role_id WHERE p.auth_user_id = auth.uid()) = 'Super Admin'
  );

CREATE POLICY "school_features_admin_manage" ON public.school_features
  FOR ALL TO authenticated
  USING (
    (school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
     AND EXISTS (
       SELECT 1 FROM public.profiles p2
       JOIN public.user_roles ur ON ur.profile_id = p2.id
       JOIN public.roles r ON r.id = ur.role_id
       WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal')
     ))
    OR EXISTS (
      SELECT 1 FROM public.profiles p3
      JOIN public.user_roles ur ON ur.profile_id = p3.id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE p3.auth_user_id = auth.uid() AND r.name = 'Super Admin'
    )
  )
  WITH CHECK (
    (school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
     AND EXISTS (
       SELECT 1 FROM public.profiles p2
       JOIN public.user_roles ur ON ur.profile_id = p2.id
       JOIN public.roles r ON r.id = ur.role_id
       WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal')
     ))
    OR EXISTS (
      SELECT 1 FROM public.profiles p3
      JOIN public.user_roles ur ON ur.profile_id = p3.id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE p3.auth_user_id = auth.uid() AND r.name = 'Super Admin'
    )
  );

-- 3. Create school_field_configs table for School-Configurable Required Fields
CREATE TABLE IF NOT EXISTS public.school_field_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  field_name text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT true,
  custom_label text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_field_configs_unique UNIQUE (school_id, entity_type, field_name)
);

COMMENT ON TABLE public.school_field_configs IS 'Configurable field requirements (e.g. photo, blood group, aadhaar) per school';

CREATE INDEX IF NOT EXISTS idx_school_field_configs_lookup ON public.school_field_configs(school_id, entity_type);

ALTER TABLE public.school_field_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_field_configs_select" ON public.school_field_configs
  FOR SELECT TO authenticated
  USING (
    school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
    OR (SELECT r.name FROM public.profiles p JOIN public.user_roles ur ON ur.profile_id = p.id JOIN public.roles r ON r.id = ur.role_id WHERE p.auth_user_id = auth.uid()) = 'Super Admin'
  );

CREATE POLICY "school_field_configs_admin_manage" ON public.school_field_configs
  FOR ALL TO authenticated
  USING (
    (school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
     AND EXISTS (
       SELECT 1 FROM public.profiles p2
       JOIN public.user_roles ur ON ur.profile_id = p2.id
       JOIN public.roles r ON r.id = ur.role_id
       WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal')
     ))
    OR EXISTS (
      SELECT 1 FROM public.profiles p3
      JOIN public.user_roles ur ON ur.profile_id = p3.id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE p3.auth_user_id = auth.uid() AND r.name = 'Super Admin'
    )
  )
  WITH CHECK (
    (school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
     AND EXISTS (
       SELECT 1 FROM public.profiles p2
       JOIN public.user_roles ur ON ur.profile_id = p2.id
       JOIN public.roles r ON r.id = ur.role_id
       WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal')
     ))
    OR EXISTS (
      SELECT 1 FROM public.profiles p3
      JOIN public.user_roles ur ON ur.profile_id = p3.id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE p3.auth_user_id = auth.uid() AND r.name = 'Super Admin'
    )
  );

-- ============================================================
-- 4. OPTIONAL MODULE RELATIONAL TABLES
-- ============================================================

-- 4.1 Transport Module
CREATE TABLE IF NOT EXISTS public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  route_name text NOT NULL,
  route_code text NOT NULL,
  vehicle_number text,
  driver_name text,
  driver_phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transport_routes_code_unique UNIQUE (school_id, route_code)
);

CREATE TABLE IF NOT EXISTS public.transport_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  stop_name text NOT NULL,
  pickup_time text,
  drop_time text,
  fare_amount numeric(10, 2) NOT NULL DEFAULT 0.00,
  display_order integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_transport_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.transport_routes(id) ON DELETE RESTRICT,
  stop_id uuid NOT NULL REFERENCES public.transport_stops(id) ON DELETE RESTRICT,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_transport_alloc_unique UNIQUE (school_id, student_id, academic_session_id)
);

-- 4.2 Hostel Module
CREATE TABLE IF NOT EXISTS public.hostels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  type text NOT NULL DEFAULT 'boys' CHECK (type IN ('boys', 'girls', 'co-ed')),
  warden_name text,
  warden_phone text,
  capacity integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hostels_code_unique UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.hostel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  occupied_count integer NOT NULL DEFAULT 0,
  monthly_fee numeric(10, 2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hostel_rooms_num_unique UNIQUE (school_id, hostel_id, room_number)
);

CREATE TABLE IF NOT EXISTS public.student_hostel_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE RESTRICT,
  room_id uuid NOT NULL REFERENCES public.hostel_rooms(id) ON DELETE RESTRICT,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  bed_number text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'vacated', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_hostel_alloc_unique UNIQUE (school_id, student_id, academic_session_id)
);

-- 4.3 Library Module
CREATE TABLE IF NOT EXISTS public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  isbn text,
  author text,
  publisher text,
  category text,
  total_copies integer NOT NULL DEFAULT 1,
  available_copies integer NOT NULL DEFAULT 1,
  shelf_location text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  member_type text NOT NULL CHECK (member_type IN ('student', 'staff')),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_number text NOT NULL,
  max_books_allowed integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT library_members_num_unique UNIQUE (school_id, membership_number)
);

CREATE TABLE IF NOT EXISTS public.library_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.library_books(id) ON DELETE RESTRICT,
  member_id uuid NOT NULL REFERENCES public.library_members(id) ON DELETE RESTRICT,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  returned_date date,
  fine_amount numeric(10, 2) NOT NULL DEFAULT 0.00,
  fine_status text NOT NULL DEFAULT 'none' CHECK (fine_status IN ('none', 'pending', 'paid', 'waived')),
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4.4 Inventory Module
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_categories_code_unique UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.inventory_categories(id) ON DELETE RESTRICT,
  item_name text NOT NULL,
  item_code text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  current_stock integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_items_code_unique UNIQUE (school_id, item_code)
);

CREATE TABLE IF NOT EXISTS public.inventory_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  vendor_contact text,
  invoice_number text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  total_amount numeric(10, 2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('ordered', 'received', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4.5 HR & Payroll Module (Restricted access)
CREATE TABLE IF NOT EXISTS public.staff_salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  basic_salary numeric(10, 2) NOT NULL DEFAULT 0.00,
  hra numeric(10, 2) NOT NULL DEFAULT 0.00,
  da numeric(10, 2) NOT NULL DEFAULT 0.00,
  special_allowance numeric(10, 2) NOT NULL DEFAULT 0.00,
  pf_deduction numeric(10, 2) NOT NULL DEFAULT 0.00,
  tax_deduction numeric(10, 2) NOT NULL DEFAULT 0.00,
  net_salary numeric(10, 2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_salary_profile_unique UNIQUE (school_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  period_month integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year integer NOT NULL CHECK (period_year BETWEEN 2000 AND 2100),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'cancelled')),
  processed_at timestamptz,
  processed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_periods_month_year_unique UNIQUE (school_id, period_month, period_year)
);

CREATE TABLE IF NOT EXISTS public.staff_payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payroll_period_id uuid NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  gross_amount numeric(10, 2) NOT NULL DEFAULT 0.00,
  total_deductions numeric(10, 2) NOT NULL DEFAULT 0.00,
  net_amount numeric(10, 2) NOT NULL DEFAULT 0.00,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_date date,
  payment_mode text CHECK (payment_mode IN ('bank_transfer', 'cheque', 'cash', 'upi', 'neft')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_payslips_profile_period_unique UNIQUE (school_id, profile_id, payroll_period_id)
);

-- 4.6 Activities / Houses / Clubs
CREATE TABLE IF NOT EXISTS public.school_houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  color text,
  motto text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_houses_code_unique UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.school_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  coordinator_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_clubs_code_unique UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.student_activity_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  house_id uuid REFERENCES public.school_houses(id) ON DELETE SET NULL,
  club_id uuid REFERENCES public.school_clubs(id) ON DELETE SET NULL,
  academic_session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY & INDEXES ON ALL NEW TABLES
-- ============================================================

ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transport_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_hostel_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity_memberships ENABLE ROW LEVEL SECURITY;

-- Helper macro/policies for general tenant tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'transport_routes', 'transport_stops', 'student_transport_allocations',
      'hostels', 'hostel_rooms', 'student_hostel_allocations',
      'library_books', 'library_members', 'library_issues',
      'inventory_categories', 'inventory_items', 'inventory_purchases',
      'school_houses', 'school_clubs', 'student_activity_memberships'
    ])
  LOOP
    EXECUTE format('
      CREATE POLICY "%s_select" ON public.%I FOR SELECT TO authenticated
      USING (school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid()));

      CREATE POLICY "%s_admin_all" ON public.%I FOR ALL TO authenticated
      USING (
        school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.profiles p2
          JOIN public.user_roles ur ON ur.profile_id = p2.id
          JOIN public.roles r ON r.id = ur.role_id
          WHERE p2.auth_user_id = auth.uid() AND r.name IN (''Super Admin'', ''Admin'', ''Principal'')
        )
      )
      WITH CHECK (
        school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.profiles p2
          JOIN public.user_roles ur ON ur.profile_id = p2.id
          JOIN public.roles r ON r.id = ur.role_id
          WHERE p2.auth_user_id = auth.uid() AND r.name IN (''Super Admin'', ''Admin'', ''Principal'')
        )
      );
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- Strict RLS for Payroll Tables (Restricted to Super Admin, Admin, Principal, Accountant)
CREATE POLICY "salary_structures_select" ON public.staff_salary_structures FOR SELECT TO authenticated
USING (
  school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
  AND (
    profile_id = (SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p2
      JOIN public.user_roles ur ON ur.profile_id = p2.id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal', 'Accountant')
    )
  )
);

CREATE POLICY "salary_structures_manage" ON public.staff_salary_structures FOR ALL TO authenticated
USING (
  school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p2
    JOIN public.user_roles ur ON ur.profile_id = p2.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal', 'Accountant')
  )
)
WITH CHECK (
  school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p2
    JOIN public.user_roles ur ON ur.profile_id = p2.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal', 'Accountant')
  )
);

CREATE POLICY "payroll_periods_select" ON public.payroll_periods FOR SELECT TO authenticated
USING (school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid()));

CREATE POLICY "payroll_periods_manage" ON public.payroll_periods FOR ALL TO authenticated
USING (
  school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p2
    JOIN public.user_roles ur ON ur.profile_id = p2.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal', 'Accountant')
  )
)
WITH CHECK (
  school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p2
    JOIN public.user_roles ur ON ur.profile_id = p2.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal', 'Accountant')
  )
);

CREATE POLICY "staff_payslips_select" ON public.staff_payslips FOR SELECT TO authenticated
USING (
  school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
  AND (
    profile_id = (SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p2
      JOIN public.user_roles ur ON ur.profile_id = p2.id
      JOIN public.roles r ON r.id = ur.role_id
      WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal', 'Accountant')
    )
  )
);

CREATE POLICY "staff_payslips_manage" ON public.staff_payslips FOR ALL TO authenticated
USING (
  school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p2
    JOIN public.user_roles ur ON ur.profile_id = p2.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal', 'Accountant')
  )
)
WITH CHECK (
  school_id = (SELECT p.school_id FROM public.profiles p WHERE p.auth_user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles p2
    JOIN public.user_roles ur ON ur.profile_id = p2.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE p2.auth_user_id = auth.uid() AND r.name IN ('Super Admin', 'Admin', 'Principal', 'Accountant')
  )
);

-- ============================================================
-- 6. GRANT TABLE ACCESS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.school_features,
  public.school_field_configs,
  public.transport_routes,
  public.transport_stops,
  public.student_transport_allocations,
  public.hostels,
  public.hostel_rooms,
  public.student_hostel_allocations,
  public.library_books,
  public.library_members,
  public.library_issues,
  public.inventory_categories,
  public.inventory_items,
  public.inventory_purchases,
  public.staff_salary_structures,
  public.payroll_periods,
  public.staff_payslips,
  public.school_houses,
  public.school_clubs,
  public.student_activity_memberships
TO authenticated;

-- Seed core features for default schools
INSERT INTO public.school_features (school_id, feature_key, enabled, enabled_at)
SELECT id, key, true, now()
FROM public.schools
CROSS JOIN (
  VALUES
    ('school_profile'),
    ('academic'),
    ('students'),
    ('guardians'),
    ('staff'),
    ('users_roles'),
    ('admissions'),
    ('attendance'),
    ('examinations'),
    ('results'),
    ('documents'),
    ('fees'),
    ('audit')
) AS f(key)
ON CONFLICT (school_id, feature_key) DO NOTHING;
