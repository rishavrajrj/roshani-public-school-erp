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
