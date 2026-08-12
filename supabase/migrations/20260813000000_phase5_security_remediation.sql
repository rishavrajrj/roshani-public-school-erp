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
