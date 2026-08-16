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
    ('UT',      'Unit Test',               'Periodic unit evaluation'),
    ('PT',      'Periodic Test',           'Term periodic test'),
    ('HY',      'Half-Yearly Examination', 'Mid-term examination'),
    ('PA',      'Pre-Annual Examination',  'Pre-board / pre-annual mock exam'),
    ('ANNUAL',  'Annual Examination',      'Final annual examination'),
    ('PRAC',    'Practical Examination',   'Laboratory and practical assessment'),
    ('IA',      'Internal Assessment',     'Continuous internal assessment')
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
