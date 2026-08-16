import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [k, ...v] = trimmed.split('=')
    if (k && v.length > 0) {
      process.env[k.trim()] = v.join('=').trim()
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

async function inspectAll() {
  console.log('Inspecting Supabase URL:', supabaseUrl)

  // Test RPC or execute raw sql if available
  const { data: rpcData, error: rpcErr } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
  console.log('RPC exec_sql available?:', !rpcErr, rpcErr?.message)

  // Query schools, classes, students, profiles
  const tables = [
    'schools', 'school_settings', 'academic_sessions', 'classes', 'sections',
    'subjects', 'class_subjects', 'profiles', 'roles', 'user_roles',
    'guardians', 'students', 'student_guardians', 'student_academic_history',
    'student_documents', 'audit_logs', 'admission_applications',
    'teacher_assignments', 'attendance_sessions', 'attendance_records',
    'leave_types', 'leave_applications', 'leave_approvals', 'leave_entitlements',
    'notifications', 'fee_heads', 'fee_structures', 'fee_structure_items',
    'student_fee_assignments', 'student_concessions', 'invoices', 'invoice_items',
    'payments', 'payment_allocations', 'financial_ledger', 'refunds', 'adjustments',
    'receipts', 'financial_clearance', 'payment_events', 'student_credits',
    'financial_accounts', 'unmatched_webhook_events', 'credit_allocations',
    'daily_cash_reconciliations', 'cash_movements', 'exam_types', 'examinations',
    'examination_classes', 'examination_subject_configs', 'examination_schedules',
    'examination_invigilators', 'admit_cards', 'grading_scales', 'student_marks',
    'student_results', 'promotion_policies', 'class_progressions', 'promotion_records',
    'report_card_templates', 'report_cards', 'certificate_types', 'certificate_sequences',
    'certificates', 'school_features', 'school_field_configs', 'transport_routes',
    'transport_stops', 'student_transport_allocations', 'hostels', 'hostel_rooms',
    'student_hostel_allocations', 'library_books', 'library_members', 'library_issues',
    'inventory_categories', 'inventory_items', 'inventory_purchases',
    'staff_salary_structures', 'payroll_periods', 'staff_payslips',
    'school_houses', 'school_clubs', 'student_activity_memberships'
  ]

  const promises = tables.map(async (t) => {
    try {
      const { data, error, count } = await supabase.from(t).select('*', { count: 'exact', head: true })
      if (error) {
        return { table: t, exists: false, err: error.message }
      } else {
        return { table: t, exists: true, count: count ?? 0 }
      }
    } catch (e: any) {
      return { table: t, exists: false, err: e.message }
    }
  })

  const results = await Promise.all(promises)

  const existing = results.filter(r => r.exists)
  const missing = results.filter(r => !r.exists)

  console.log('\n=== EXISTING TABLES (' + existing.length + ') ===')
  existing.forEach(e => console.log(`  ✅ ${e.table} (count: ${e.count})`))

  console.log('\n=== MISSING / UNACCESSIBLE TABLES (' + missing.length + ') ===')
  missing.forEach(m => console.log(`  ❌ ${m.table} (${m.err})`))
}

inspectAll().catch(console.error)
