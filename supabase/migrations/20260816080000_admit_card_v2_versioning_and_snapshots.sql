-- ============================================================
-- Phase 6B V2 Migration: Admit Card Versioning, Snapshots & Crypto Tokens
-- ============================================================
-- Enhances public.admit_cards with:
--   - version (INTEGER DEFAULT 1)
--   - document_fingerprint (TEXT)
--   - replacement_reason (TEXT)
--   - superseded_at (TIMESTAMPTZ)
--   - superseded_by (UUID REFERENCES profiles(id))
--   - data_snapshot (JSONB)
--   - updated CHECK constraint including 'superseded'
-- ============================================================

ALTER TABLE public.admit_cards
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS document_fingerprint TEXT,
    ADD COLUMN IF NOT EXISTS replacement_reason TEXT,
    ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS data_snapshot JSONB;

-- Drop old check constraint on status and re-create with 'superseded'
ALTER TABLE public.admit_cards DROP CONSTRAINT IF EXISTS admit_cards_status_check;

ALTER TABLE public.admit_cards
    ADD CONSTRAINT admit_cards_status_check
    CHECK (status IN ('draft', 'eligible', 'blocked', 'override_released', 'published', 'revoked', 'superseded'));

-- Update unique index so that neither 'revoked' nor 'superseded' prevent active new version issuance
DROP INDEX IF EXISTS public.idx_admit_cards_active_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admit_cards_active_unique
    ON public.admit_cards (school_id, academic_session_id, examination_id, student_id)
    WHERE status NOT IN ('revoked', 'superseded');

-- Additional indexes for fast verification and fingerprint lookup
CREATE INDEX IF NOT EXISTS idx_admit_cards_fingerprint ON public.admit_cards(document_fingerprint);
CREATE INDEX IF NOT EXISTS idx_admit_cards_version ON public.admit_cards(student_id, examination_id, version);
