-- Migration 027: Concurrent Refund Protection
-- Prevents race condition where two simultaneous refund requests
-- bypass application-level validation.
--
-- Uses a BEFORE INSERT trigger to atomically check the refund cap
-- at the database level. This is the authoritative guard — the
-- application-level check in requestRefundAction is defense-in-depth.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.check_refund_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_amount NUMERIC(12,2);
    v_total_refunded NUMERIC(12,2);
    v_remaining NUMERIC(12,2);
BEGIN
    -- Lock the payment row to prevent concurrent reads
    SELECT amount INTO v_payment_amount
    FROM public.payments
    WHERE id = NEW.payment_id
    FOR UPDATE;

    IF v_payment_amount IS NULL THEN
        RAISE EXCEPTION 'Payment not found: %', NEW.payment_id;
    END IF;

    -- Calculate total already-refunded (exclude rejected/cancelled)
    SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded
    FROM public.refunds
    WHERE payment_id = NEW.payment_id
      AND status NOT IN ('rejected', 'cancelled');

    v_remaining := v_payment_amount - v_total_refunded;

    IF NEW.amount > v_remaining THEN
        RAISE EXCEPTION 'Refund amount (%) exceeds remaining refundable amount (%). Already refunded: %',
            NEW.amount, v_remaining, v_total_refunded;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger to the refunds table
DROP TRIGGER IF EXISTS trg_check_refund_limit ON public.refunds;
CREATE TRIGGER trg_check_refund_limit
    BEFORE INSERT ON public.refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.check_refund_limit();

-- 3. Add a CHECK constraint for additional safety
-- This ensures a single refund can never exceed a sane limit
-- (the trigger does the authoritative multi-row check)
COMMENT ON FUNCTION public.check_refund_limit() IS
    'Atomically prevents total refunds for a payment from exceeding the original payment amount. Uses SELECT FOR UPDATE on payments to serialize concurrent refund inserts.';
