-- ============================================================
-- Phase 5.1 Migration 1: Financial Infrastructure
-- ============================================================
-- Creates: financial_accounts, unmatched_webhook_events,
--          credit_allocations, atomic journal RPC,
--          cheque tracking columns, has_role fix
-- ============================================================

-- ============================================================
-- 1. FIX has_role SIGNATURE MISMATCH
-- The existing has_role(text) function takes 1 argument.
-- Create a 2-argument overload so existing policies work.
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, role_name TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        JOIN public.profiles p ON p.id = ur.profile_id
        WHERE p.auth_user_id = p_user_id
          AND ur.school_id = p.school_id
          AND r.name = role_name
    );
$$;

-- ============================================================
-- 2. CHART OF ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE')),
    is_system BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT financial_accounts_school_code_unique UNIQUE (school_id, code)
);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial accounts viewable by authenticated school users"
    ON public.financial_accounts FOR SELECT
    USING (auth.uid() IS NOT NULL AND school_id = public.get_current_school_id());

CREATE POLICY "Financial accounts manageable by Admin/Accountant"
    ON public.financial_accounts FOR ALL
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

-- Seed system accounts for all existing schools
INSERT INTO public.financial_accounts (school_id, code, name, account_type, is_system)
SELECT s.id, ac.code, ac.name, ac.account_type, true
FROM public.schools s
CROSS JOIN (VALUES
    ('CASH_IN_HAND',       'Cash in Hand',           'ASSET'),
    ('BANK_SBI',           'Bank - SBI',             'ASSET'),
    ('BANK_HDFC',          'Bank - HDFC',            'ASSET'),
    ('RAZORPAY_CLEARING',  'Razorpay Clearing',      'ASSET'),
    ('UPI_CLEARING',       'UPI Clearing',           'ASSET'),
    ('POS_CLEARING',       'POS Clearing',           'ASSET'),
    ('CHEQUE_RECEIVABLE',  'Cheque Receivable',      'ASSET'),
    ('ACCOUNTS_RECEIVABLE','Accounts Receivable',    'ASSET'),
    ('FEE_REVENUE',        'Fee Revenue',            'REVENUE'),
    ('DISCOUNT_EXPENSE',   'Discount Expense',       'EXPENSE'),
    ('REFUND_ACCOUNT',     'Refund Account',         'EXPENSE'),
    ('STUDENT_CREDIT_LIABILITY', 'Student Credit Liability', 'LIABILITY')
) AS ac(code, name, account_type)
ON CONFLICT (school_id, code) DO NOTHING;

-- ============================================================
-- 3. UNMATCHED WEBHOOK EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.unmatched_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'razorpay',
    external_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature_verified BOOLEAN NOT NULL DEFAULT false,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processing_status TEXT NOT NULL DEFAULT 'unmatched'
        CHECK (processing_status IN ('unmatched', 'manually_resolved', 'ignored')),
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unmatched_webhook_events_ext_id_unique UNIQUE (provider, external_event_id)
);

ALTER TABLE public.unmatched_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only Super Admin / Admin can view unmatched events (no school scoping needed)
CREATE POLICY "Unmatched webhooks insert by service"
    ON public.unmatched_webhook_events FOR INSERT
    WITH CHECK (true); -- Webhook handler runs without user context

CREATE POLICY "Unmatched webhooks viewable by Super Admin"
    ON public.unmatched_webhook_events FOR SELECT
    USING (auth.uid() IS NOT NULL AND public.has_role('Super Admin'));

CREATE POLICY "Unmatched webhooks deny update"
    ON public.unmatched_webhook_events FOR UPDATE
    USING (false);

CREATE POLICY "Unmatched webhooks deny delete"
    ON public.unmatched_webhook_events FOR DELETE
    USING (false);

-- ============================================================
-- 4. CREDIT ALLOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_credit_id UUID NOT NULL REFERENCES public.student_credits(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    actor_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credit allocations viewable by Admin/Accountant"
    ON public.credit_allocations FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

CREATE POLICY "Credit allocations manageable by Admin/Accountant"
    ON public.credit_allocations FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        school_id = public.get_current_school_id() AND
        (public.has_role('Super Admin') OR public.has_role('Admin') OR public.has_role('Accountant'))
    );

CREATE POLICY "Credit allocations deny update"
    ON public.credit_allocations FOR UPDATE
    USING (false);

CREATE POLICY "Credit allocations deny delete"
    ON public.credit_allocations FOR DELETE
    USING (false);

-- ============================================================
-- 5. CHEQUE TRACKING COLUMNS
-- ============================================================
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cheque_date DATE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cheque_status TEXT;

-- Add check constraint for cheque_status
DO $$ BEGIN
    ALTER TABLE public.payments ADD CONSTRAINT payments_cheque_status_check
        CHECK (cheque_status IS NULL OR cheque_status IN ('pending', 'cleared', 'bounced', 'failed', 'refunded'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 6. ATOMIC DOUBLE-ENTRY JOURNAL RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_balanced_journal(
    p_school_id UUID,
    p_academic_session_id UUID,
    p_student_id UUID,
    p_invoice_id UUID DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
    p_transaction_type TEXT DEFAULT 'PAYMENT',
    p_description TEXT DEFAULT '',
    p_actor_profile_id UUID DEFAULT NULL,
    p_entries JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_journal_id UUID;
    v_total_debit NUMERIC(12, 2) := 0;
    v_total_credit NUMERIC(12, 2) := 0;
    v_entry JSONB;
    v_running_balance NUMERIC(12, 2);
    v_last_balance NUMERIC(12, 2);
    v_balance_change NUMERIC(12, 2) := 0;
BEGIN
    -- Validate entries exist
    IF jsonb_array_length(p_entries) < 2 THEN
        RAISE EXCEPTION 'Journal must have at least 2 entries (debit and credit sides)';
    END IF;

    -- Validate balance
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        DECLARE
            v_debit NUMERIC(12, 2) := COALESCE((v_entry->>'debit')::NUMERIC, 0);
            v_credit NUMERIC(12, 2) := COALESCE((v_entry->>'credit')::NUMERIC, 0);
        BEGIN
            -- Each entry must have debit > 0 XOR credit > 0
            IF (v_debit > 0 AND v_credit > 0) THEN
                RAISE EXCEPTION 'Entry cannot have both debit and credit: %', v_entry;
            END IF;
            IF (v_debit <= 0 AND v_credit <= 0) THEN
                RAISE EXCEPTION 'Entry must have either debit or credit > 0: %', v_entry;
            END IF;

            v_total_debit := v_total_debit + v_debit;
            v_total_credit := v_total_credit + v_credit;
        END;
    END LOOP;

    -- SUM(debit) must equal SUM(credit)
    IF v_total_debit != v_total_credit THEN
        RAISE EXCEPTION 'Unbalanced journal: total debit (%) != total credit (%)',
            v_total_debit, v_total_credit;
    END IF;

    -- Generate journal ID
    v_journal_id := gen_random_uuid();

    -- Compute running balance
    SELECT COALESCE(running_balance, 0) INTO v_last_balance
    FROM public.financial_ledger
    WHERE student_id = p_student_id
      AND academic_session_id = p_academic_session_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_balance IS NULL THEN
        v_last_balance := 0;
    END IF;

    -- Determine balance impact
    IF p_transaction_type IN ('CHARGE', 'LATE_FEE', 'CHEQUE_BOUNCE') THEN
        v_balance_change := v_total_debit;
    ELSIF p_transaction_type IN ('PAYMENT', 'REFUND', 'OVERPAYMENT_CREDIT', 'CONCESSION', 'DISCOUNT') THEN
        v_balance_change := -v_total_debit;
    ELSIF p_transaction_type = 'ADJUSTMENT' THEN
        -- Determined by entry structure
        v_balance_change := 0;
    ELSE
        v_balance_change := 0;
    END IF;

    v_running_balance := v_last_balance + v_balance_change;

    -- Insert all entries atomically
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        DECLARE
            v_debit NUMERIC(12, 2) := COALESCE((v_entry->>'debit')::NUMERIC, 0);
            v_credit NUMERIC(12, 2) := COALESCE((v_entry->>'credit')::NUMERIC, 0);
            v_account TEXT := v_entry->>'account';
            v_entry_type TEXT;
            v_amount NUMERIC(12, 2);
        BEGIN
            IF v_debit > 0 THEN
                v_entry_type := 'DEBIT';
                v_amount := v_debit;
            ELSE
                v_entry_type := 'CREDIT';
                v_amount := v_credit;
            END IF;

            INSERT INTO public.financial_ledger (
                school_id, academic_session_id, student_id,
                invoice_id, payment_id, transaction_type,
                amount, running_balance, description,
                actor_profile_id, journal_id, entry_type, account_name
            ) VALUES (
                p_school_id, p_academic_session_id, p_student_id,
                p_invoice_id, p_payment_id, p_transaction_type,
                v_amount, v_running_balance, p_description,
                p_actor_profile_id, v_journal_id, v_entry_type, v_account
            );
        END;
    END LOOP;

    RETURN v_journal_id;
END;
$$;

-- Add OVERPAYMENT_CREDIT and CHEQUE_BOUNCE to transaction_type
ALTER TABLE public.financial_ledger DROP CONSTRAINT IF EXISTS financial_ledger_transaction_type_check;
ALTER TABLE public.financial_ledger ADD CONSTRAINT financial_ledger_transaction_type_check
    CHECK (transaction_type IN (
        'CHARGE', 'PAYMENT', 'DISCOUNT', 'CONCESSION',
        'ADJUSTMENT', 'REFUND', 'REVERSAL', 'LATE_FEE',
        'OVERPAYMENT_CREDIT', 'CHEQUE_BOUNCE', 'CASH_MOVEMENT'
    ));

COMMENT ON FUNCTION public.create_balanced_journal IS
    'Atomically creates a balanced double-entry journal. Validates SUM(debit) = SUM(credit) and that each entry has debit XOR credit. On any failure: full rollback.';
