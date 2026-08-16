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

async function main() {
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

  const fullData: Record<string, any[]> = {}

  const results = await Promise.all(
    tables.map(async (t) => {
      try {
        const { data, error } = await supabase.from(t).select('*')
        if (error) {
          return { table: t, data: [], error: error.message }
        }
        return { table: t, data: data || [], error: null }
      } catch (err: any) {
        return { table: t, data: [], error: err.message }
      }
    })
  )

  for (const res of results) {
    fullData[res.table] = res.data
  }

  const populated = results.filter(r => r.data.length > 0)
  const empty = results.filter(r => r.data.length === 0 && !r.error)
  const errors = results.filter(r => r.error)

  console.log(`\n=== ALL DATABASE TABLES SUMMARY ===`)
  console.log(`Total Populated Tables: ${populated.length}`)
  console.log(`Total Empty Tables: ${empty.length}`)
  console.log(`Errors/Non-existent: ${errors.length}\n`)

  for (const p of populated) {
    console.log(`TABLE: ${p.table} (${p.data.length} records)`)
  }

  fs.writeFileSync(path.resolve(process.cwd(), 'scripts', 'all_tables_dump.json'), JSON.stringify(fullData, null, 2))
  console.log('\nSaved full payload to scripts/all_tables_dump.json')
}

main().catch(console.error)
