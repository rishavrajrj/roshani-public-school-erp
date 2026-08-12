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
