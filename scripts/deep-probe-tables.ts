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

async function deepProbe() {
  console.log('Deep probe with real row select on:', supabaseUrl)
  
  const tables = [
    'schools',
    'profiles',
    'roles',
    'user_roles',
    'students',
    'guardians',
    'student_guardians',
    'classes',
    'sections',
    'subjects',
    'academic_sessions',
    'audit_logs',
    'admission_applications',
    'admission_notes',
    'teacher_assignments',
    'attendance_sessions',
    'attendance_records',
    'leave_types',
    'leave_applications',
    'fee_heads',
    'fee_structures',
    'invoices',
    'payments',
    'receipts',
    'financial_ledger',
    'exam_types',
    'examinations',
    'examination_classes',
    'examination_schedules',
    'admit_cards',
    'student_marks',
    'student_results',
    'promotion_records',
    'certificates',
    'report_cards',
  ]

  const results: { table: string; status: string; detail: string }[] = []

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        results.push({ table, status: 'MISSING', detail: error.message })
      } else {
        results.push({ table, status: 'EXISTS', detail: `Rows present or queryable` })
      }
    } catch (e: any) {
      results.push({ table, status: 'ERROR', detail: e.message })
    }
  }

  console.log('\n--- EXACT DEEP PROBE RESULTS ---')
  for (const r of results) {
    console.log(`${r.status === 'EXISTS' ? '✅' : '❌'} [${r.status}] Table '${r.table}': ${r.detail}`)
  }
}

deepProbe().catch(console.error)
