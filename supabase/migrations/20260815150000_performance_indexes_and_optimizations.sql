-- Migration: Strategic Performance Indexes for High-Traffic ERP Tables

-- 1. Students & Academic History Indexes
CREATE INDEX IF NOT EXISTS idx_students_school_status ON public.students (school_id, status);
CREATE INDEX IF NOT EXISTS idx_students_school_name ON public.students (school_id, first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_sah_active_lookup ON public.student_academic_history (school_id, academic_session_id, class_id, section_id, status);
CREATE INDEX IF NOT EXISTS idx_sah_student_session ON public.student_academic_history (school_id, student_id, academic_session_id);

-- 2. Admissions Applications Indexes
CREATE INDEX IF NOT EXISTS idx_admission_apps_filter ON public.admission_applications (school_id, academic_session_id, applying_for_class_id, status);
CREATE INDEX IF NOT EXISTS idx_admission_apps_created ON public.admission_applications (school_id, created_at DESC);

-- 3. Attendance Sessions & Records Indexes
CREATE INDEX IF NOT EXISTS idx_att_sessions_date ON public.attendance_sessions (school_id, academic_session_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_att_records_student_date ON public.attendance_records (school_id, student_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_att_records_session_student ON public.attendance_records (session_id, student_id);

-- 4. Invoices & Payments Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_school_status_due ON public.invoices (school_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_student_session ON public.invoices (school_id, student_id, academic_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_school_date ON public.payments (school_id, status, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments (school_id, student_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_alloc_invoice ON public.payment_allocations (school_id, invoice_id);

-- 5. Examinations & Marks Indexes
CREATE INDEX IF NOT EXISTS idx_examinations_session_status ON public.examinations (school_id, academic_session_id, status);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_lookup ON public.examination_schedules (school_id, examination_id, class_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_marks_entries_lookup ON public.marks_entries (school_id, examination_id, student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_results_lookup ON public.results (school_id, examination_id, student_id);

-- 6. Notifications & Leave Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications (school_id, recipient_profile_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leave_apps_pending ON public.leave_applications (school_id, status, start_date);
