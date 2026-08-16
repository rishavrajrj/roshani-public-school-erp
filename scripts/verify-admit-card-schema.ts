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

async function verifyAdmitCardSchema() {
  console.log('Inspecting actual ERP tables on:', supabaseUrl)
  
  const tables = [
    // Foundational
    'schools',
    'profiles',
    'roles',
    'user_roles',
    'students',
    'classes',
    'sections',
    'subjects',
    'academic_sessions',
    'audit_logs',
    // Admissions
    'admission_applications',
    'admission_notes',
    // Attendance & Faculty
    'teacher_assignments',
    'attendance_sessions',
    'attendance_records',
    // Leave
    'leave_types',
    'leave_applications',
    // Fees
    'fee_heads',
    'fee_structures',
    'invoices',
    'payments',
    'receipts',
    'financial_ledger',
    // Examinations
    'exam_types',
    'examinations',
    'examination_classes',
    'examination_schedules',
    'admit_cards',
    'student_marks',
    'student_results',
    // Documents & Promotion
    'promotion_records',
    'certificates',
    'report_cards',
  ]

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`❌ Table '${table}': PENDING MIGRATION (${error.message})`)
    } else {
      console.log(`✅ Table '${table}': EXISTS ON REMOTE`)
    }
  }
}

verifyAdmitCardSchema().catch(console.error)
