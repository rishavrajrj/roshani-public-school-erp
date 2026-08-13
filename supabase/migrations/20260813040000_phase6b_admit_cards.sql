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
