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
