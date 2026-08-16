-- ==============================================================================
-- Roshani Public School ERP - Production Performance & High-Selectivity Composite Indexes
-- ==============================================================================
-- Optimizes query performance across high-volume multi-tenant tables:
-- 1. Student queries (status, admission lookup, academic history filters)
-- 2. Daily Attendance roll-call and date-range aggregations
-- 3. Invoicing, Payments, Ledger aggregations, and Clearance checks
-- 4. Examination marks entry, result publication, admit card lookups
-- 5. Audit log chronological indexing and notification queries
-- ==============================================================================

-- 1. Student Academic History Composite Indexes
CREATE INDEX IF NOT EXISTS idx_student_academic_history_tenant_lookup
  ON public.student_academic_history (school_id, academic_session_id, class_id, section_id, status);

CREATE INDEX IF NOT EXISTS idx_student_academic_history_student_session
  ON public.student_academic_history (school_id, student_id, academic_session_id);

-- 2. Attendance Sessions & Records Composite Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_tenant_date
  ON public.attendance_sessions (school_id, academic_session_id, class_id, section_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_student
  ON public.attendance_records (session_id, student_id, status);

-- 3. Financial Infrastructure & Billing Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_student_status
  ON public.invoices (school_id, academic_session_id, student_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_due_date
  ON public.invoices (school_id, due_date, status);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_student_status
  ON public.payments (school_id, academic_session_id, student_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_date
  ON public.payments (school_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_tenant_invoice
  ON public.payment_allocations (school_id, invoice_id, payment_id);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_tenant_student_date
  ON public.financial_ledger (school_id, academic_session_id, student_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_student_credits_tenant_student
  ON public.student_credits (school_id, student_id, remaining_amount);

-- 4. Examination, Marks & Result Indexes
CREATE INDEX IF NOT EXISTS idx_student_marks_tenant_exam_class_subject
  ON public.student_marks (school_id, examination_id, class_id, subject_id, status);

CREATE INDEX IF NOT EXISTS idx_student_results_tenant_exam_class
  ON public.student_results (school_id, examination_id, class_id, section_id, status);

CREATE INDEX IF NOT EXISTS idx_admit_cards_tenant_exam_student
  ON public.admit_cards (school_id, examination_id, student_id, status);

CREATE INDEX IF NOT EXISTS idx_admit_cards_verification_token
  ON public.admit_cards (verification_token)
  WHERE verification_token IS NOT NULL;

-- 5. Audit Logs & Notifications Chronological Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp
  ON public.audit_logs (school_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp
  ON public.audit_logs (actor_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user_unread
  ON public.notifications (school_id, user_id, read_at)
  WHERE read_at IS NULL;

-- 6. Teacher Assignments & School Feature Governance
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_tenant_teacher
  ON public.teacher_assignments (school_id, teacher_profile_id, active);

CREATE INDEX IF NOT EXISTS idx_school_features_tenant_feature
  ON public.school_features (school_id, feature_key, enabled);

CREATE INDEX IF NOT EXISTS idx_school_field_configs_tenant_entity
  ON public.school_field_configs (school_id, entity_type, is_enabled);
