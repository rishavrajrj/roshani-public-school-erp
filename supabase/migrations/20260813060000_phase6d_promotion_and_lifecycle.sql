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
