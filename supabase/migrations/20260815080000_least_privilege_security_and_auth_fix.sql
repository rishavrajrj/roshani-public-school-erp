-- ==============================================================================
-- Migration: Least-Privilege Security Hardening and Supabase Auth Permission Fix
-- ==============================================================================
-- Description:
-- 1. Grants USAGE on public schema to standard Supabase roles.
-- 2. Grants minimal SELECT & REFERENCES on public.profiles to supabase_auth_admin
--    to resolve foreign key constraint checks during GoTrue authentication.
-- 3. Grants appropriate DML permissions to authenticated role for all ERP tables,
--    fully protected and constrained by existing Row Level Security (RLS) policies.
-- 4. Restores EXECUTE privileges to service_role and authenticated on helper functions.
-- 5. Hardens anon role to strict zero-trust (no access to private ERP data).
-- 6. Preserves auth schema security without any broad GRANT ALL.
-- ==============================================================================

-- 1. Schema-level usage (safe namespace resolution, grants zero table access by itself)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, supabase_auth_admin;
GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, service_role;

-- 2. Supabase Auth Admin (GoTrue) — Least Privilege
-- When auth.users is referenced by public.profiles(auth_user_id), GoTrue / supabase_auth_admin
-- requires SELECT and REFERENCES on public.profiles to validate foreign key constraints during sign-in.
GRANT SELECT, REFERENCES ON public.profiles TO supabase_auth_admin;

-- 3. Function Execution Grants
GRANT EXECUTE ON FUNCTION public.get_current_profile_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_school_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_guardian_of_student(uuid) TO authenticated, service_role;

-- Execute grants on phase-specific helper functions if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_assigned_teacher_of_section') THEN
    GRANT EXECUTE ON FUNCTION public.is_assigned_teacher_of_section(uuid, uuid, uuid) TO authenticated, service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_application_number') THEN
    GRANT EXECUTE ON FUNCTION public.generate_application_number(uuid, uuid) TO authenticated, service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_admission_number') THEN
    GRANT EXECUTE ON FUNCTION public.generate_admission_number(uuid) TO authenticated, service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'convert_admission_application') THEN
    GRANT EXECUTE ON FUNCTION public.convert_admission_application(uuid, uuid, text, text) TO authenticated, service_role;
  END IF;
END $$;

-- 4. Server-Side Privileged Operations (service_role)
-- Standard Supabase server-only role used for backend scripts and background processing.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 5. Authenticated Role Table Grants (Governed strictly by RLS)
-- Explicit table-level privileges across all ERP phases:
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.schools,
  public.school_settings,
  public.academic_sessions,
  public.classes,
  public.sections,
  public.subjects,
  public.class_subjects,
  public.profiles,
  public.roles,
  public.user_roles,
  public.guardians,
  public.students,
  public.student_guardians,
  public.student_academic_history,
  public.student_documents,
  public.audit_logs,
  public.admission_applications,
  public.teacher_assignments,
  public.attendance_sessions,
  public.attendance_records,
  public.leave_types,
  public.leave_applications,
  public.leave_approvals,
  public.leave_entitlements,
  public.notifications,
  public.fee_heads,
  public.fee_structures,
  public.fee_structure_items,
  public.student_fee_assignments,
  public.student_concessions,
  public.invoices,
  public.invoice_items,
  public.payments,
  public.payment_allocations,
  public.financial_ledger,
  public.refunds,
  public.adjustments,
  public.receipts,
  public.financial_clearance,
  public.payment_events,
  public.student_credits,
  public.financial_accounts,
  public.unmatched_webhook_events,
  public.credit_allocations,
  public.daily_cash_reconciliations,
  public.cash_movements,
  public.exam_types,
  public.examinations,
  public.examination_classes,
  public.examination_subject_configs,
  public.admit_cards,
  public.student_marks,
  public.student_results,
  public.student_promotions,
  public.student_status_history,
  public.report_cards,
  public.transfer_certificates,
  public.character_certificates,
  public.bonafide_certificates,
  public.document_verifications
TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 6. Anonymous (Public) Role — Zero Trust & Explicit Hardening
-- Revoke all table-level access from anon to prevent exposure of sensitive student/financial/staff data.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Explicitly allow anon ONLY on public document verification (which has its own verification code RLS)
GRANT SELECT ON public.document_verifications TO anon;

-- 7. Auth Schema Hardening
REVOKE ALL ON SCHEMA auth FROM anon, authenticated;
