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
